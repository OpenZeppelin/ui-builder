import {
  testStellarRpcConnection,
  validateStellarRpcEndpoint,
} from 'packages/adapter-stellar/src/configuration';
import type React from 'react';

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
  RelayerDetails,
  RelayerDetailsRich,
  StellarNetworkConfig,
  UiKitConfiguration,
  UserRpcProviderConfig,
} from '@openzeppelin/contracts-ui-builder-types';
import { isStellarNetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

// Import functions from modules
import { getStellarSupportedExecutionMethods, validateStellarExecutionConfig } from './execution';
import { getStellarExplorerAddressUrl, getStellarExplorerTxUrl } from './explorer';
import {
  generateStellarDefaultField,
  getStellarCompatibleFieldTypes,
  mapStellarParameterTypeToFieldType,
} from './mapping';
import { isStellarViewFunction, queryStellarViewFunction } from './query';
import { formatStellarTransactionData, signAndBroadcastStellarTransaction } from './transaction';
import { formatStellarFunctionResult } from './transform';
import { isValidAddress as isStellarValidAddress, type StellarAddressType } from './validation';
import {
  connectStellarWallet,
  disconnectStellarWallet,
  generateStellarWalletsKitExportables,
  getResolvedWalletComponents,
  getStellarAvailableConnectors,
  getStellarWalletConnectionStatus,
  loadInitialConfigFromAppService,
  resolveFullUiKitConfiguration,
  stellarFacadeHooks,
  stellarUiKitManager,
  StellarWalletUiRoot,
  supportsStellarWalletConnection,
  // onStellarWalletConnectionChange, // Placeholder if needed later
} from './wallet';

/**
 * Stellar-specific adapter implementation using explicit method delegation.
 *
 * NOTE: Contains placeholder implementations for most functionalities.
 */
export class StellarAdapter implements ContractAdapter {
  readonly networkConfig: StellarNetworkConfig;
  readonly initialAppServiceKitName: UiKitConfiguration['kitName'];

  constructor(networkConfig: StellarNetworkConfig) {
    if (!isStellarNetworkConfig(networkConfig)) {
      throw new Error('StellarAdapter requires a valid Stellar network configuration.');
    }
    this.networkConfig = networkConfig;

    // Set the network config in the wallet UI kit manager
    stellarUiKitManager.setNetworkConfig(networkConfig);

    // Determine the initial kitName from AppConfigService at the time of adapter construction.
    // This provides a baseline kitName preference from the application's static/global configuration.
    // It defaults to 'custom' if no specific kitName is found in AppConfigService.
    const initialGlobalConfig = loadInitialConfigFromAppService();
    this.initialAppServiceKitName =
      (initialGlobalConfig.kitName as UiKitConfiguration['kitName']) || 'custom';

    logger.info(
      'StellarAdapter:constructor',
      'Initial kitName from AppConfigService noted:',
      this.initialAppServiceKitName
    );

    logger.info(
      'StellarAdapter',
      `Adapter initialized for network: ${networkConfig.name} (ID: ${networkConfig.id})`
    );
  }

  // --- Contract Loading --- //
  public getContractDefinitionInputs(): FormFieldType[] {
    return [
      {
        id: 'contractAddress',
        name: 'contractAddress',
        label: 'Contract ID',
        type: 'blockchain-address',
        validation: { required: true },
        placeholder: 'G...',
        helperText: 'Enter the Stellar contract ID.',
      },
    ];
  }

  async loadContract(artifacts: FormValues): Promise<ContractSchema> {
    // Stellar doesn't have a standardized on-chain contract interface like an ABI.
    // The 'source' would need to be a custom JSON descriptor provided by the user.
    // This is a placeholder for a more complex implementation.
    if (typeof artifacts.contractAddress !== 'string') {
      throw new Error('A contract address must be provided.');
    }

    return {
      name: 'StellarContract',
      address: artifacts.contractAddress,
      ecosystem: 'stellar',
      functions: [],
      events: [],
    };
  }

  getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'] {
    return contractSchema.functions.filter((fn: ContractFunction) => fn.modifiesState);
  }

  // --- Type Mapping & Field Generation --- //
  mapParameterTypeToFieldType(parameterType: string): FieldType {
    return mapStellarParameterTypeToFieldType(parameterType);
  }
  getCompatibleFieldTypes(parameterType: string): FieldType[] {
    return getStellarCompatibleFieldTypes(parameterType);
  }
  generateDefaultField<T extends FieldType = FieldType>(
    parameter: FunctionParameter
  ): FormFieldType<T> {
    return generateStellarDefaultField(parameter);
  }

  // --- Transaction Formatting & Execution --- //
  public formatTransactionData(
    contractSchema: ContractSchema,
    functionId: string,
    submittedInputs: Record<string, unknown>,
    fields: FormFieldType[]
  ): unknown {
    return formatStellarTransactionData(contractSchema, functionId, submittedInputs, fields);
  }
  async signAndBroadcast(
    transactionData: unknown,
    executionConfig?: ExecutionConfig
  ): Promise<{ txHash: string }> {
    return signAndBroadcastStellarTransaction(transactionData, executionConfig);
  }

  // NOTE: waitForTransactionConfirmation? is optional in the interface.
  // Since the imported function is currently undefined, we omit the method here.
  // If implemented in ./transaction/sender.ts later, add the method back:
  // async waitForTransactionConfirmation?(...) { ... }

  // --- View Function Querying --- //
  isViewFunction(functionDetails: ContractFunction): boolean {
    return isStellarViewFunction(functionDetails);
  }

  // Implement queryViewFunction with the correct signature from ContractAdapter
  async queryViewFunction(
    contractAddress: string,
    functionId: string,
    params: unknown[] = [],
    contractSchema?: ContractSchema
  ): Promise<unknown> {
    return queryStellarViewFunction(
      contractAddress,
      functionId,
      this.networkConfig,
      params,
      contractSchema
    );
  }

  formatFunctionResult(decodedValue: unknown, functionDetails: ContractFunction): string {
    return formatStellarFunctionResult(decodedValue, functionDetails);
  }

  // --- Wallet Interaction --- //
  supportsWalletConnection(): boolean {
    return supportsStellarWalletConnection();
  }
  async getAvailableConnectors(): Promise<Connector[]> {
    return getStellarAvailableConnectors();
  }
  async connectWallet(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    return connectStellarWallet(connectorId);
  }
  async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    return disconnectStellarWallet();
  }
  getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
    return getStellarWalletConnectionStatus();
  }
  // Optional: onWalletConnectionChange(...) implementation would go here

  // --- Configuration & Metadata --- //
  async getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
    return getStellarSupportedExecutionMethods();
  }
  async validateExecutionConfig(config: ExecutionConfig): Promise<true | string> {
    return validateStellarExecutionConfig(config);
  }

  // Implement getExplorerUrl with the correct signature from ContractAdapter
  getExplorerUrl(address: string): string | null {
    return getStellarExplorerAddressUrl(address, this.networkConfig);
  }

  // Implement getExplorerTxUrl with the correct signature from ContractAdapter
  getExplorerTxUrl?(txHash: string): string | null {
    if (getStellarExplorerTxUrl) {
      return getStellarExplorerTxUrl(txHash, this.networkConfig);
    }
    return null;
  }

  // --- Validation --- //
  isValidAddress(address: string, addressType?: string): boolean {
    return isStellarValidAddress(address, addressType as StellarAddressType);
  }

  public async getAvailableUiKits(): Promise<AvailableUiKit[]> {
    return [
      {
        id: 'stellar-wallets-kit',
        name: 'Stellar Wallets Kit',
        configFields: [],
      },
      {
        id: 'custom',
        name: 'Stellar Wallets Kit Custom',
        configFields: [],
      },
    ];
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

    // Delegate the entire configuration resolution to the service function
    const finalFullConfig = await resolveFullUiKitConfiguration(
      programmaticOverrides,
      this.initialAppServiceKitName,
      currentAppServiceConfig,
      options
    );

    // Configure the Stellar UI kit manager
    await stellarUiKitManager.configure(finalFullConfig);
    logger.info(
      'StellarAdapter:configureUiKit',
      'StellarUiKitManager configuration requested with final config:',
      finalFullConfig
    );
  }

  /**
   * @inheritdoc
   */
  public async getExportableWalletConfigFiles(
    uiKitConfig?: UiKitConfiguration
  ): Promise<Record<string, string>> {
    if (uiKitConfig?.kitName === 'stellar-wallets-kit') {
      return generateStellarWalletsKitExportables(uiKitConfig);
    }
    return {};
  }

  /**
   * @inheritdoc
   */
  public getEcosystemWalletComponents(): EcosystemWalletComponents | undefined {
    const currentManagerState = stellarUiKitManager.getState();

    // Only attempt to resolve components if the manager has a configuration set
    if (!currentManagerState.currentFullUiKitConfig) {
      logger.debug(
        'StellarAdapter:getEcosystemWalletComponents',
        'No UI kit configuration available in manager yet. Returning undefined components.'
      );
      return undefined;
    }

    // Use the service to resolve components based on the current UI kit configuration
    const components = getResolvedWalletComponents(currentManagerState.currentFullUiKitConfig);
    return components;
  }

  /**
   * @inheritdoc
   */
  public getEcosystemReactUiContextProvider():
    | React.ComponentType<EcosystemReactUiProviderProps>
    | undefined {
    logger.info(
      'StellarAdapter:getEcosystemReactUiContextProvider',
      'Returning StellarWalletUiRoot.'
    );
    return StellarWalletUiRoot;
  }

  /**
   * @inheritdoc
   */
  public getEcosystemReactHooks(): EcosystemSpecificReactHooks | undefined {
    // Always provide hooks for Stellar adapter regardless of UI kit
    return stellarFacadeHooks;
  }

  public async getRelayers(_serviceUrl: string, _accessToken: string): Promise<RelayerDetails[]> {
    logger.warn('StellarAdapter', 'getRelayers is not implemented for the Stellar adapter yet.');
    return Promise.resolve([]);
  }

  public async getRelayer(
    _serviceUrl: string,
    _accessToken: string,
    _relayerId: string
  ): Promise<RelayerDetailsRich> {
    logger.warn('StellarAdapter', 'getRelayer is not implemented for the Stellar adapter yet.');
    return Promise.resolve({} as RelayerDetailsRich);
  }

  /**
   * @inheritdoc
   */
  public async validateRpcEndpoint(rpcConfig: UserRpcProviderConfig): Promise<boolean> {
    // TODO: Implement Stellar-specific RPC validation when needed
    return validateStellarRpcEndpoint(rpcConfig);
  }

  /**
   * @inheritdoc
   */
  public async testRpcConnection(rpcConfig: UserRpcProviderConfig): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    // TODO: Implement Stellar-specific RPC validation when needed
    return testStellarRpcConnection(rpcConfig);
  }
}

// Also export as default to ensure compatibility with various import styles
export default StellarAdapter;
