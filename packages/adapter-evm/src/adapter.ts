import type { GetAccountReturnType } from '@wagmi/core';
import { type TransactionReceipt } from 'viem';
import React from 'react';

import type {
  AvailableUiKit,
  Connector,
  ContractAdapter,
  ContractFunction,
  ContractSchema,
  EcosystemReactUiProviderProps,
  EcosystemSpecificReactHooks,
  EcosystemWalletComponents,
  ExecutionConfig,
  ExecutionMethodDetail,
  FieldType,
  FormFieldType,
  FormValues,
  FunctionParameter,
  NativeConfigLoader,
  NetworkConfig,
  RelayerDetails,
  RelayerDetailsRich,
  TransactionStatusUpdate,
  UiKitConfiguration,
  UserExplorerConfig,
  UserRpcProviderConfig,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { EvmWalletUiRoot } from './wallet/components/EvmWalletUiRoot';
import { evmUiKitManager } from './wallet/evmUiKitManager';
import { evmFacadeHooks } from './wallet/hooks/facade-hooks';
import { loadInitialConfigFromAppService } from './wallet/hooks/useUiKitConfig';
import { generateRainbowKitConfigFile } from './wallet/rainbowkit/config-generator';
import { generateRainbowKitExportables } from './wallet/rainbowkit/export-service';
import { resolveFullUiKitConfiguration } from './wallet/services/configResolutionService';
import { getResolvedWalletComponents } from './wallet/utils';
import {
  connectAndEnsureCorrectNetwork,
  disconnectEvmWallet,
  evmSupportsWalletConnection,
  getEvmAvailableConnectors,
  getEvmWalletConnectionStatus,
} from './wallet/utils/connection';
import {
  getEvmWalletImplementation,
  getInitializedEvmWalletImplementation,
} from './wallet/utils/walletImplementationManager';

import { loadEvmContract } from './abi';
import {
  getEvmExplorerAddressUrl,
  getEvmExplorerTxUrl,
  getEvmSupportedExecutionMethods,
  testEvmExplorerConnection,
  testEvmRpcConnection,
  validateEvmExecutionConfig,
  validateEvmExplorerConfig,
  validateEvmRpcEndpoint,
} from './configuration';
import {
  generateEvmDefaultField,
  getEvmCompatibleFieldTypes,
  mapEvmParamTypeToFieldType,
} from './mapping';
import { isEvmViewFunction, queryEvmViewFunction } from './query';
import {
  EoaExecutionStrategy,
  EvmRelayerOptions,
  ExecutionStrategy,
  formatEvmTransactionData,
  RelayerExecutionStrategy,
  waitForEvmTransactionConfirmation,
} from './transaction';
import { formatEvmFunctionResult } from './transform';
import { TypedEvmNetworkConfig } from './types';
import type { WriteContractParameters } from './types';
import { isValidEvmAddress } from './utils';

/**
 * Type guard to check if a network config is a TypedEvmNetworkConfig
 * @param config The network configuration to check
 * @returns True if the config is for EVM
 */
const isTypedEvmNetworkConfig = (config: NetworkConfig): config is TypedEvmNetworkConfig =>
  config.ecosystem === 'evm';

/**
 * EVM-specific adapter implementation
 */
export class EvmAdapter implements ContractAdapter {
  readonly networkConfig: TypedEvmNetworkConfig;
  readonly initialAppServiceKitName: UiKitConfiguration['kitName'];

  constructor(networkConfig: TypedEvmNetworkConfig) {
    if (!isTypedEvmNetworkConfig(networkConfig)) {
      throw new Error('EvmAdapter requires a valid EVM network configuration.');
    }
    this.networkConfig = networkConfig;
    logger.info(
      'EvmAdapter',
      `Adapter initialized for network: ${networkConfig.name} (ID: ${networkConfig.id})`
    );

    // Determine the initial kitName from AppConfigService at the time of adapter construction.
    // This provides a baseline kitName preference from the application's static/global configuration.
    // It defaults to 'custom' if no specific kitName is found in AppConfigService.
    // This value is stored on the instance to inform the first call to configureUiKit if no programmatic overrides are given.
    const initialGlobalConfig = loadInitialConfigFromAppService();
    this.initialAppServiceKitName =
      (initialGlobalConfig.kitName as UiKitConfiguration['kitName']) || 'custom';

    logger.info(
      'EvmAdapter:constructor',
      'Initial kitName from AppConfigService noted:',
      this.initialAppServiceKitName
    );
    // The actual EvmUiKitManager.configure call (which drives UI setup) is deferred.
    // It's typically triggered by WalletStateProvider after this adapter instance is fully initialized and provided to it,
    // ensuring that loadConfigModule (for user native configs) is available.
  }

  /**
   * @inheritdoc
   */
  public async loadContract(artifacts: FormValues): Promise<ContractSchema> {
    return loadEvmContract(artifacts, this.networkConfig);
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
  public formatTransactionData(
    contractSchema: ContractSchema,
    functionId: string,
    submittedInputs: Record<string, unknown>,
    fields: FormFieldType[]
  ): WriteContractParameters {
    return formatEvmTransactionData(contractSchema, functionId, submittedInputs, fields);
  }

  /**
   * @inheritdoc
   */
  public async signAndBroadcast(
    transactionData: unknown,
    executionConfig: ExecutionConfig,
    onStatusChange: (status: string, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<{ txHash: string }> {
    const walletImplementation = await getEvmWalletImplementation();
    let strategy: ExecutionStrategy;

    switch (executionConfig.method) {
      case 'relayer':
        strategy = new RelayerExecutionStrategy();
        break;
      case 'eoa':
      default:
        strategy = new EoaExecutionStrategy();
        break;
    }

    return strategy.execute(
      transactionData as WriteContractParameters,
      executionConfig,
      walletImplementation,
      onStatusChange,
      runtimeApiKey
    );
  }

  /**
   * @inheritdoc
   */
  public async getRelayers(serviceUrl: string, accessToken: string): Promise<RelayerDetails[]> {
    const relayerStrategy = new RelayerExecutionStrategy();
    return relayerStrategy.getEvmRelayers(serviceUrl, accessToken, this.networkConfig);
  }

  /**
   * @inheritdoc
   */
  public async getRelayer(
    serviceUrl: string,
    accessToken: string,
    relayerId: string
  ): Promise<RelayerDetailsRich> {
    const relayerStrategy = new RelayerExecutionStrategy();
    return relayerStrategy.getEvmRelayer(serviceUrl, accessToken, relayerId, this.networkConfig);
  }

  /**
   * Returns a React component for configuring EVM-specific relayer transaction options.
   * @returns The EVM relayer options component
   */
  public getRelayerOptionsComponent():
    | React.ComponentType<{
        options: Record<string, unknown>;
        onChange: (options: Record<string, unknown>) => void;
      }>
    | undefined {
    return EvmRelayerOptions;
  }

  /**
   * @inheritdoc
   */
  public getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'] {
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
    const walletStatus = this.getWalletConnectionStatus();
    return validateEvmExecutionConfig(config, walletStatus);
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
    const walletImplementation = await getEvmWalletImplementation();
    return queryEvmViewFunction(
      contractAddress,
      functionId,
      this.networkConfig,
      params,
      contractSchema,
      walletImplementation,
      (src) => this.loadContract({ contractAddress: src })
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
    return getEvmAvailableConnectors();
  }

  /**
   * @inheritdoc
   */
  public async connectWallet(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    const result = await connectAndEnsureCorrectNetwork(connectorId, this.networkConfig.chainId);

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
    return disconnectEvmWallet();
  }

  /**
   * @inheritdoc
   */
  public getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
    const status = getEvmWalletConnectionStatus();
    return {
      isConnected: status.isConnected,
      address: status.address,
      chainId: status.chainId?.toString(),
    };
  }

  /**
   * @inheritdoc
   */
  public onWalletConnectionChange(
    callback: (account: GetAccountReturnType, prevAccount: GetAccountReturnType) => void
  ): () => void {
    const walletImplementation = getInitializedEvmWalletImplementation();
    if (!walletImplementation) {
      logger.warn(
        'EvmAdapter:onWalletConnectionChange',
        'Wallet implementation not ready. Subscription may not work.'
      );
      return () => {};
    }
    return walletImplementation.onWalletConnectionChange(callback);
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
    const walletImplementation = await getEvmWalletImplementation();
    return waitForEvmTransactionConfirmation(txHash, walletImplementation);
  }

  /**
   * @inheritdoc
   */
  public async configureUiKit(
    programmaticOverrides: Partial<UiKitConfiguration> = {},
    options?: {
      loadUiKitNativeConfig?: NativeConfigLoader;
    }
  ): Promise<void> {
    const currentAppServiceConfig = loadInitialConfigFromAppService();

    // Delegate the entire configuration resolution to the service function.
    const finalFullConfig = await resolveFullUiKitConfiguration(
      programmaticOverrides,
      this.initialAppServiceKitName,
      currentAppServiceConfig,
      options
    );

    // Delegate the application of this configuration to the central EvmUiKitManager.
    await evmUiKitManager.configure(finalFullConfig);
    logger.info(
      'EvmAdapter:configureUiKit',
      'EvmUiKitManager configuration requested with final config:',
      finalFullConfig
    );
  }

  /**
   * @inheritdoc
   */
  public getEcosystemReactUiContextProvider():
    | React.ComponentType<EcosystemReactUiProviderProps>
    | undefined {
    // EvmWalletUiRoot is now the stable provider that subscribes to evmUiKitManager
    logger.info('EvmAdapter:getEcosystemReactUiContextProvider', 'Returning EvmWalletUiRoot.');
    return EvmWalletUiRoot;
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
    const currentManagerState = evmUiKitManager.getState();
    // Only attempt to resolve components if the manager has a configuration set.
    // During initial app load, currentFullUiKitConfig might be null until the first configure call completes.
    if (!currentManagerState.currentFullUiKitConfig) {
      logger.debug(
        // Changed from warn to debug, as this can be normal during init sequence
        'EvmAdapter:getEcosystemWalletComponents',
        'No UI kit configuration available in manager yet. Returning undefined components.'
      );
      return undefined; // Explicitly return undefined if manager isn't configured yet
    }
    // If manager has a config, use that for resolving components.
    return getResolvedWalletComponents(currentManagerState.currentFullUiKitConfig);
  }

  public async getAvailableUiKits(): Promise<AvailableUiKit[]> {
    const rainbowkitDefaultCode = generateRainbowKitConfigFile({});

    return [
      {
        id: 'custom',
        name: 'OpenZeppelin Custom',
        configFields: [],
      },
      {
        id: 'rainbowkit',
        name: 'RainbowKit',
        linkToDocs: 'https://www.rainbowkit.com/docs/installation#configure',
        description: `Configure RainbowKit for your exported application. This code will be saved as <code class="bg-muted px-1 py-0.5 rounded text-xs">rainbowkit.config.ts</code>.<br/><br/>
<strong>Export Only:</strong> This configuration is <em>only used in exported apps</em>. The preview always uses the default RainbowKit configuration.<br/><br/>
<strong>Available options:</strong><br/>
• <code>wagmiParams</code>: Configure app name, projectId, wallets, etc.<br/>
• <code>providerProps</code>: Set theme, modal size, and other UI options<br/><br/>
Get your WalletConnect projectId from <a href="https://cloud.walletconnect.com" target="_blank" rel="noopener" class="text-primary underline">cloud.walletconnect.com</a>`,
        hasCodeEditor: true,
        defaultCode: rainbowkitDefaultCode,
        configFields: [],
      },
    ];
  }

  public async getExportableWalletConfigFiles(
    uiKitConfig?: UiKitConfiguration
  ): Promise<Record<string, string>> {
    if (uiKitConfig?.kitName === 'rainbowkit') {
      return generateRainbowKitExportables(uiKitConfig);
    }
    return {};
  }

  /**
   * @inheritdoc
   */
  public getContractDefinitionInputs(): FormFieldType[] {
    return [
      {
        id: 'contractAddress',
        name: 'contractAddress',
        label: 'Contract Address',
        type: 'text',
        validation: { required: true },
        placeholder: '0x1234...abcd',
        helperText:
          'Enter the deployed contract address. For verified contracts, the ABI will be fetched automatically from the block explorer.',
      },
      {
        id: 'abiJson',
        name: 'abiJson',
        label: 'Contract ABI (Optional)',
        type: 'textarea',
        validation: { required: false },
        placeholder:
          '[{"inputs":[],"name":"myFunction","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
        helperText:
          "If the contract is not verified on the block explorer, paste the contract's ABI JSON here. You can find this in your contract's compilation artifacts or deployment files.",
      },
    ];
  }

  /**
   * @inheritdoc
   */
  public async validateRpcEndpoint(rpcConfig: UserRpcProviderConfig): Promise<boolean> {
    return validateEvmRpcEndpoint(rpcConfig);
  }

  /**
   * @inheritdoc
   */
  public async testRpcConnection(rpcConfig: UserRpcProviderConfig): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    return testEvmRpcConnection(rpcConfig);
  }

  /**
   * @inheritdoc
   */
  public async validateExplorerConfig(explorerConfig: UserExplorerConfig): Promise<boolean> {
    return validateEvmExplorerConfig(explorerConfig);
  }

  /**
   * @inheritdoc
   */
  public async testExplorerConnection(explorerConfig: UserExplorerConfig): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    return testEvmExplorerConnection(explorerConfig, this.networkConfig);
  }
}

// Also export as default to ensure compatibility with various import styles
export default EvmAdapter;
