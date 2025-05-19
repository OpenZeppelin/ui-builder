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

import { evmFacadeHooks } from './wallet/hooks/facade-hooks';
import { loadConfigFromAppConfig, setUiKitConfig } from './wallet/hooks/useUiKitConfig';
import { getResolvedUiContextProvider, getResolvedWalletComponents } from './wallet/utils';
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
  private uiKitConfiguration: UiKitConfiguration;

  constructor(networkConfig: EvmNetworkConfig) {
    if (!isEvmNetworkConfig(networkConfig)) {
      throw new Error('EvmAdapter requires a valid EVM network configuration.');
    }
    this.networkConfig = networkConfig;
    logger.info(
      'EvmAdapter',
      `Adapter initialized for network: ${networkConfig.name} (ID: ${networkConfig.id})`
    );

    loadConfigFromAppConfig();
    this.uiKitConfiguration = { kitName: 'custom' };
    logger.info(
      'EvmAdapter',
      'Initial uiKitConfiguration for instance set to:',
      this.uiKitConfiguration
    );
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
    this.uiKitConfiguration = {
      kitName: config.kitName || 'custom',
      kitConfig: config.kitConfig,
    };
    setUiKitConfig(this.uiKitConfiguration);
  }

  /**
   * @inheritdoc
   */
  public getEcosystemReactUiContextProvider():
    | React.ComponentType<EcosystemReactUiProviderProps>
    | undefined {
    return getResolvedUiContextProvider(this.uiKitConfiguration);
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
    return getResolvedWalletComponents(this.uiKitConfiguration);
  }
}

// Also export as default to ensure compatibility with various import styles
export default EvmAdapter;
