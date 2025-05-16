import type { GetAccountReturnType } from '@wagmi/core';
import { type TransactionReceipt } from 'viem';

import type {
  Connector,
  ContractAdapter,
  ContractFunction,
  ContractSchema,
  EcosystemReactUiProviderProps,
  EcosystemSpecificReactHooks,
  EcosystemWalletComponents,
  EvmNetworkConfig,
  ExecutionConfig,
  ExecutionMethodDetail,
  FieldType,
  FormFieldType,
  FunctionParameter,
  UiKitConfiguration,
} from '@openzeppelin/transaction-form-types';
import { isEvmNetworkConfig } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import {
  CustomAccountDisplay,
  CustomConnectButton,
  CustomNetworkSwitcher,
} from './wallet/components';
import { evmFacadeHooks } from './wallet/hooks/facade-hooks';
import { loadConfigFromAppConfig, setUiKitConfig } from './wallet/hooks/useUiKitConfig';
import { EvmBasicUiContextProvider } from './wallet/provider/ui-provider';
import {
  connectAndEnsureCorrectNetwork,
  disconnectEvmWallet,
  evmSupportsWalletConnection,
  getEvmAvailableConnectors,
  getEvmWalletConnectionStatus,
  onEvmWalletConnectionChange,
} from './wallet/utils/connection';
import { getEvmWalletImplementation } from './wallet/utils/walletImplementationManager';

import { loadEvmContract } from './abi';
import {
  getEvmExplorerAddressUrl,
  getEvmExplorerTxUrl,
  getEvmSupportedExecutionMethods,
  validateEvmExecutionConfig,
} from './configuration';
import {
  generateEvmDefaultField,
  getEvmCompatibleFieldTypes,
  mapEvmParamTypeToFieldType,
} from './mapping';
import { isEvmViewFunction, queryEvmViewFunction } from './query';
import {
  formatEvmTransactionData,
  signAndBroadcastEvmTransaction,
  waitForEvmTransactionConfirmation,
} from './transaction';
import { formatEvmFunctionResult } from './transform';
import type { WriteContractParameters } from './types';
import { isValidEvmAddress } from './utils';

/**
 * EVM-specific adapter implementation
 */
export class EvmAdapter implements ContractAdapter {
  readonly networkConfig: EvmNetworkConfig;
  private uiKitConfiguration: UiKitConfiguration = { kitName: 'none' };

  constructor(networkConfig: EvmNetworkConfig) {
    if (!isEvmNetworkConfig(networkConfig)) {
      throw new Error('EvmAdapter requires a valid EVM network configuration.');
    }
    this.networkConfig = networkConfig;
    logger.info(
      'EvmAdapter',
      `Adapter initialized for network: ${networkConfig.name} (ID: ${networkConfig.id})`
    );

    // Load configuration from AppConfigService if available
    const loaded = loadConfigFromAppConfig();
    if (loaded) {
      logger.info('EvmAdapter', 'Configuration loaded from AppConfigService');
    }
  }

  /**
   * @inheritdoc
   */
  async loadContract(source: string): Promise<ContractSchema> {
    return loadEvmContract(source, this.networkConfig);
  }

  /**
   * @inheritdoc
   */
  mapParameterTypeToFieldType(parameterType: string): FieldType {
    return mapEvmParamTypeToFieldType(parameterType);
  }

  /**
   * @inheritdoc
   */
  getCompatibleFieldTypes(parameterType: string): FieldType[] {
    return getEvmCompatibleFieldTypes(parameterType);
  }

  /**
   * @inheritdoc
   */
  generateDefaultField<T extends FieldType = FieldType>(
    parameter: FunctionParameter
  ): FormFieldType<T> {
    return generateEvmDefaultField(parameter);
  }

  /**
   * @inheritdoc
   */
  formatTransactionData(
    contractSchema: ContractSchema,
    functionId: string,
    submittedInputs: Record<string, unknown>,
    allFieldsConfig: FormFieldType[]
  ): unknown {
    return formatEvmTransactionData(contractSchema, functionId, submittedInputs, allFieldsConfig);
  }

  /**
   * @inheritdoc
   */
  async signAndBroadcast(transactionData: unknown): Promise<{ txHash: string }> {
    return signAndBroadcastEvmTransaction(
      transactionData as WriteContractParameters,
      getEvmWalletImplementation(),
      this.networkConfig.chainId
    );
  }

  /**
   * @inheritdoc
   */
  getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'] {
    return contractSchema.functions.filter((fn) => fn.modifiesState);
  }

  /**
   * @inheritdoc
   */
  isValidAddress(address: string): boolean {
    return isValidEvmAddress(address);
  }

  /**
   * @inheritdoc
   */
  public async getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
    return getEvmSupportedExecutionMethods();
  }

  /**
   * @inheritdoc
   */
  public async validateExecutionConfig(config: ExecutionConfig): Promise<true | string> {
    return validateEvmExecutionConfig(config);
  }

  /**
   * @inheritdoc
   */
  isViewFunction(functionDetails: ContractFunction): boolean {
    return isEvmViewFunction(functionDetails);
  }

  /**
   * @inheritdoc
   */
  async queryViewFunction(
    contractAddress: string,
    functionId: string,
    params: unknown[] = [],
    contractSchema?: ContractSchema
  ): Promise<unknown> {
    return queryEvmViewFunction(
      contractAddress,
      functionId,
      this.networkConfig,
      params,
      contractSchema,
      getEvmWalletImplementation(),
      (src) => this.loadContract(src)
    );
  }

  /**
   * @inheritdoc
   */
  formatFunctionResult(decodedValue: unknown, functionDetails: ContractFunction): string {
    return formatEvmFunctionResult(decodedValue, functionDetails);
  }

  /**
   * @inheritdoc
   */
  public supportsWalletConnection(): boolean {
    return evmSupportsWalletConnection();
  }

  /**
   * @inheritdoc
   */
  public async getAvailableConnectors(): Promise<Connector[]> {
    return getEvmAvailableConnectors(getEvmWalletImplementation());
  }

  /**
   * @inheritdoc
   */
  public async connectWallet(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    const impl = getEvmWalletImplementation();
    const result = await connectAndEnsureCorrectNetwork(
      connectorId,
      impl,
      this.networkConfig.chainId
    );

    if (result.connected && result.address) {
      return { connected: true, address: result.address };
    } else {
      return {
        connected: false,
        error: result.error || 'Connection failed for an unknown reason.',
      };
    }
  }

  /**
   * @inheritdoc
   */
  public async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    return disconnectEvmWallet(getEvmWalletImplementation());
  }

  /**
   * @inheritdoc
   */
  public getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
    return getEvmWalletConnectionStatus(getEvmWalletImplementation());
  }

  /**
   * @inheritdoc
   */
  public onWalletConnectionChange(
    callback: (account: GetAccountReturnType, prevAccount: GetAccountReturnType) => void
  ): () => void {
    return onEvmWalletConnectionChange(getEvmWalletImplementation(), callback);
  }

  /**
   * @inheritdoc
   */
  getExplorerUrl(address: string): string | null {
    return getEvmExplorerAddressUrl(address, this.networkConfig);
  }

  /**
   * @inheritdoc
   */
  getExplorerTxUrl?(txHash: string): string | null {
    if (getEvmExplorerTxUrl) {
      return getEvmExplorerTxUrl(txHash, this.networkConfig);
    }
    return null;
  }

  /**
   * @inheritdoc
   */
  async waitForTransactionConfirmation(txHash: string): Promise<{
    status: 'success' | 'error';
    receipt?: TransactionReceipt;
    error?: Error;
  }> {
    return waitForEvmTransactionConfirmation(txHash, getEvmWalletImplementation());
  }

  /**
   * @inheritdoc
   */
  public configureUiKit(config: UiKitConfiguration): void {
    this.uiKitConfiguration = config;

    // Update the shared configuration, while preserving any values loaded from AppConfigService
    setUiKitConfig(config);

    const configDisplay = {
      kitName: config.kitName || 'none',
      kitConfig: config.kitConfig ? JSON.stringify(config.kitConfig) : '{}',
    };

    logger.info(
      'EvmAdapter',
      `UI Kit configured: ${configDisplay.kitName}`,
      configDisplay.kitConfig
    );
  }

  /**
   * @inheritdoc
   */
  public getEcosystemReactUiContextProvider():
    | React.ComponentType<EcosystemReactUiProviderProps>
    | undefined {
    // 'custom' is the default UI kit for EVM adapter
    if (this.uiKitConfiguration.kitName === 'custom' || !this.uiKitConfiguration.kitName) {
      return EvmBasicUiContextProvider;
    }

    // 'none' explicitly indicates no UI components should be provided
    if (this.uiKitConfiguration.kitName === 'none') {
      logger.info('EvmAdapter', 'UI Kit set to "none", not providing a UI context.');
      return undefined;
    }

    // Future UI kits like 'rainbowkit', 'connectkit', etc. would be handled here

    logger.warn(
      'EvmAdapter',
      `UI Kit "${this.uiKitConfiguration.kitName}" not yet supported for getEcosystemReactUiContextProvider. Falling back to default implementation.`
    );
    return EvmBasicUiContextProvider; // Default fallback for unsupported kits
  }

  /**
   * @inheritdoc
   */
  public getEcosystemReactHooks(): EcosystemSpecificReactHooks | undefined {
    // Always provide hooks for EVM adapter regardless of UI kit
    return evmFacadeHooks;
  }

  /**
   * @inheritdoc
   */
  public getEcosystemWalletComponents(): EcosystemWalletComponents | undefined {
    // 'custom' is the default UI kit for EVM adapter
    if (this.uiKitConfiguration.kitName === 'custom' || !this.uiKitConfiguration.kitName) {
      return {
        ConnectButton: CustomConnectButton,
        AccountDisplay: CustomAccountDisplay,
        NetworkSwitcher: CustomNetworkSwitcher,
      };
    }

    // 'none' explicitly indicates no UI components should be provided
    if (this.uiKitConfiguration.kitName === 'none') {
      logger.info('EvmAdapter', 'UI Kit set to "none", not providing wallet components.');
      return undefined;
    }

    // Future UI kits like 'rainbowkit', 'connectkit', etc. would be handled here

    logger.warn(
      'EvmAdapter',
      `UI Kit "${this.uiKitConfiguration.kitName}" not yet supported for getEcosystemWalletComponents. Falling back to default components.`
    );

    // Default fallback for unsupported kits
    return {
      ConnectButton: CustomConnectButton,
      AccountDisplay: CustomAccountDisplay,
      NetworkSwitcher: CustomNetworkSwitcher,
    };
  }
}

// Also export as default to ensure compatibility with various import styles
export default EvmAdapter;
