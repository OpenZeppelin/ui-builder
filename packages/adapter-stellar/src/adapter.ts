import type React from 'react';

import type {
  AccessControlService,
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
  FunctionParameter,
  NativeConfigLoader,
  NetworkServiceForm,
  RelayerDetails,
  RelayerDetailsRich,
  StellarNetworkConfig,
  TransactionStatusUpdate,
  TxStatus,
  UiKitConfiguration,
  UserRpcProviderConfig,
  WalletConnectionStatus,
} from '@openzeppelin/ui-builder-types';
import { isStellarNetworkConfig } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { createStellarAccessControlService } from './access-control/service';
import {
  getStellarNetworkServiceForms,
  testStellarNetworkServiceConnection,
  validateStellarNetworkServiceConfig,
} from './configuration/network-services';
// Import functions from modules
import { loadStellarContract, loadStellarContractWithMetadata } from './contract/loader';
import { StellarRelayerOptions } from './transaction/components';
import { RelayerExecutionStrategy } from './transaction/relayer';

import {
  getStellarExplorerAddressUrl,
  getStellarExplorerTxUrl,
  getStellarSupportedExecutionMethods,
  testStellarRpcConnection,
  validateStellarExecutionConfig,
  validateStellarRpcEndpoint,
} from './configuration';
import {
  generateStellarDefaultField,
  getStellarCompatibleFieldTypes,
  mapStellarParameterTypeToFieldType,
} from './mapping';
import {
  getStellarWritableFunctions,
  isStellarViewFunction,
  queryStellarViewFunction,
} from './query';
import { formatStellarTransactionData, signAndBroadcastStellarTransaction } from './transaction';
import { formatStellarFunctionResult } from './transform';
import { validateAndConvertStellarArtifacts } from './utils';
import { isValidAddress as isStellarValidAddress, type StellarAddressType } from './validation';
import {
  connectStellarWallet,
  disconnectStellarWallet,
  generateStellarWalletsKitExportables,
  getInitializedStellarWalletImplementation,
  getResolvedWalletComponents,
  getStellarAvailableConnectors,
  getStellarWalletImplementation,
  loadInitialConfigFromAppService,
  resolveFullUiKitConfiguration,
  stellarFacadeHooks,
  stellarUiKitManager,
  StellarWalletConnectionStatus,
  StellarWalletUiRoot,
  supportsStellarWalletConnection,
} from './wallet';

/**
 * Stellar-specific adapter implementation using explicit method delegation.
 */
export class StellarAdapter implements ContractAdapter {
  readonly networkConfig: StellarNetworkConfig;
  readonly initialAppServiceKitName: UiKitConfiguration['kitName'];
  private readonly accessControlService: AccessControlService;

  constructor(networkConfig: StellarNetworkConfig) {
    if (!isStellarNetworkConfig(networkConfig)) {
      throw new Error('StellarAdapter requires a valid Stellar network configuration.');
    }
    this.networkConfig = networkConfig;

    // Initialize Access Control Service
    this.accessControlService = createStellarAccessControlService(networkConfig);

    // Set the network config in the wallet UI kit manager
    stellarUiKitManager.setNetworkConfig(networkConfig);

    // Initialize wallet implementation with network config
    getStellarWalletImplementation(networkConfig).catch((error) => {
      logger.error(
        'StellarAdapter:constructor',
        'Failed to initialize wallet implementation:',
        error
      );
    });

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

  /**
   * @inheritdoc
   */
  public getNetworkServiceForms(): NetworkServiceForm[] {
    return getStellarNetworkServiceForms();
  }

  /**
   * @inheritdoc
   */
  public async validateNetworkServiceConfig(
    serviceId: string,
    values: Record<string, unknown>
  ): Promise<boolean> {
    return validateStellarNetworkServiceConfig(serviceId, values);
  }

  /**
   * @inheritdoc
   */
  public async testNetworkServiceConnection(
    serviceId: string,
    values: Record<string, unknown>
  ): Promise<{ success: boolean; latency?: number; error?: string }> {
    return testStellarNetworkServiceConnection(serviceId, values);
  }

  /**
   * NOTE about artifact inputs (single input with auto-detection):
   *
   * The Builder renders the contract definition step using whatever fields the
   * adapter returns here. EVM uses one optional ABI field; Midnight provides
   * multiple fields. Stellar should use a single input approach with automatic
   * content detection when we add manual-spec support:
   *
   * - Keep `contractAddress` (required)
   * - Add optional `contractDefinition` (type: `code-editor`, language: `json`)
   *   with file upload support for both JSON and Wasm binary content
   *
   * When this field is added:
   * - Extend `validateAndConvertStellarArtifacts(...)` to accept
   *   `{ contractAddress, contractDefinition? }`
   * - In the loader, branch: if `contractDefinition` provided, auto-detect
   *   content type (JSON vs Wasm using magic bytes `\0asm`):
   *   - For JSON: Parse and validate as Soroban spec, use `transformStellarSpecToSchema`
   *   - For Wasm: Extract embedded spec from binary, parse locally (no RPC)
   * - Set `source: 'manual'` with `contractDefinitionOriginal` to the raw
   *   user-provided content. This ensures auto-save captures and restores the
   *   manual contract definition exactly like the EVM/Midnight flows.
   * - Provide clear UI hints about supported formats (JSON spec or Wasm binary).
   */
  /**
   * @inheritdoc
   */
  public getContractDefinitionInputs(): FormFieldType[] {
    return [
      {
        id: 'contractAddress',
        name: 'contractAddress',
        label: 'Contract ID',
        type: 'blockchain-address',
        validation: { required: true },
        placeholder: 'C...',
        helperText: 'Enter the Stellar contract ID (C...).',
      },
    ];
  }

  /**
   * @inheritdoc
   */
  public async loadContract(source: string | Record<string, unknown>): Promise<ContractSchema> {
    // Convert generic input to Stellar-specific artifacts
    const artifacts = validateAndConvertStellarArtifacts(source);
    const result = await loadStellarContract(artifacts, this.networkConfig);
    return result.schema;
  }

  /**
   * @inheritdoc
   */
  public async loadContractWithMetadata(source: string | Record<string, unknown>): Promise<{
    schema: ContractSchema;
    source: 'fetched' | 'manual';
    contractDefinitionOriginal?: string;
    metadata?: {
      fetchedFrom?: string;
      contractName?: string;
      fetchTimestamp?: Date;
      definitionHash?: string;
    };
  }> {
    try {
      // Convert generic input to Stellar-specific artifacts
      const artifacts = validateAndConvertStellarArtifacts(source);
      const result = await loadStellarContractWithMetadata(artifacts, this.networkConfig);

      return {
        schema: result.schema,
        source: result.source,
        contractDefinitionOriginal: result.contractDefinitionOriginal,
        metadata: result.metadata,
      };
    } catch (error) {
      // Re-throw errors consistently with EVM adapter
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'] {
    return getStellarWritableFunctions(contractSchema);
  }

  /**
   * @inheritdoc
   */
  mapParameterTypeToFieldType(parameterType: string): FieldType {
    return mapStellarParameterTypeToFieldType(parameterType);
  }
  getCompatibleFieldTypes(parameterType: string): FieldType[] {
    return getStellarCompatibleFieldTypes(parameterType);
  }
  generateDefaultField<T extends FieldType = FieldType>(
    parameter: FunctionParameter,
    contractSchema?: ContractSchema
  ): FormFieldType<T> {
    return generateStellarDefaultField(parameter, contractSchema);
  }

  /**
   * @inheritdoc
   */
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
    executionConfig: ExecutionConfig,
    onStatusChange: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<{ txHash: string }> {
    return signAndBroadcastStellarTransaction(
      transactionData,
      executionConfig,
      this.networkConfig,
      onStatusChange,
      runtimeApiKey
    );
  }

  /**
   * @inheritdoc
   */
  isViewFunction(functionDetails: ContractFunction): boolean {
    return isStellarViewFunction(functionDetails);
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
    return queryStellarViewFunction(
      contractAddress,
      functionId,
      this.networkConfig,
      params,
      contractSchema,
      (address: string) => this.loadContract({ contractAddress: address })
    );
  }

  /**
   * @inheritdoc
   */
  formatFunctionResult(decodedValue: unknown, functionDetails: ContractFunction): string {
    return formatStellarFunctionResult(decodedValue, functionDetails);
  }

  /**
   * @inheritdoc
   */
  supportsWalletConnection(): boolean {
    return supportsStellarWalletConnection();
  }

  /**
   * @inheritdoc
   */
  async getAvailableConnectors(): Promise<Connector[]> {
    return getStellarAvailableConnectors();
  }

  /**
   * @inheritdoc
   */
  async connectWallet(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    return connectStellarWallet(connectorId);
  }

  /**
   * @inheritdoc
   */
  async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    return disconnectStellarWallet();
  }

  /**
   * @inheritdoc
   */
  getWalletConnectionStatus(): StellarWalletConnectionStatus {
    const impl = getInitializedStellarWalletImplementation();
    if (!impl) {
      return {
        isConnected: false,
        address: undefined,
        chainId: stellarUiKitManager.getState().networkConfig?.id || 'stellar-testnet',
      };
    }

    const stellarStatus = impl.getWalletConnectionStatus();

    // Return the rich Stellar-specific status directly
    return stellarStatus;
  }

  /**
   * @inheritdoc
   */
  onWalletConnectionChange(
    callback: (
      currentStatus: WalletConnectionStatus,
      previousStatus: WalletConnectionStatus
    ) => void
  ): () => void {
    const walletImplementation = getInitializedStellarWalletImplementation();
    if (!walletImplementation) {
      logger.warn(
        'StellarAdapter:onWalletConnectionChange',
        'Wallet implementation not ready. Subscription may not work.'
      );
      return () => {};
    }

    return walletImplementation.onWalletConnectionChange(
      (currentImplStatus, previousImplStatus) => {
        callback(currentImplStatus, previousImplStatus);
      }
    );
  }

  /**
   * @inheritdoc
   */
  async getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
    return getStellarSupportedExecutionMethods();
  }

  /**
   * @inheritdoc
   */
  async validateExecutionConfig(config: ExecutionConfig): Promise<true | string> {
    const walletStatus = this.getWalletConnectionStatus();
    return validateStellarExecutionConfig(config, walletStatus);
  }

  /**
   * @inheritdoc
   */
  getExplorerUrl(address: string): string | null {
    return getStellarExplorerAddressUrl(address, this.networkConfig);
  }

  /**
   * @inheritdoc
   */
  getExplorerTxUrl?(txHash: string): string | null {
    if (getStellarExplorerTxUrl) {
      return getStellarExplorerTxUrl(txHash, this.networkConfig);
    }
    return null;
  }

  /**
   * @inheritdoc
   */
  isValidAddress(address: string, addressType?: string): boolean {
    return isStellarValidAddress(address, addressType as StellarAddressType);
  }

  /**
   * @inheritdoc
   */
  public async getAvailableUiKits(): Promise<AvailableUiKit[]> {
    return [
      {
        id: 'custom',
        name: 'Stellar Wallets Kit Custom',
        configFields: [],
      },
      {
        id: 'stellar-wallets-kit',
        name: 'Stellar Wallets Kit',
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

  /**
   * @inheritdoc
   */
  public async getRelayers(serviceUrl: string, accessToken: string): Promise<RelayerDetails[]> {
    const relayerStrategy = new RelayerExecutionStrategy();
    try {
      return await relayerStrategy.getStellarRelayers(serviceUrl, accessToken, this.networkConfig);
    } catch (error) {
      logger.error('StellarAdapter', 'Failed to fetch Stellar relayers:', error);
      return Promise.resolve([]);
    }
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
    try {
      return await relayerStrategy.getStellarRelayer(
        serviceUrl,
        accessToken,
        relayerId,
        this.networkConfig
      );
    } catch (error) {
      logger.error('StellarAdapter', 'Failed to fetch Stellar relayer details:', error);
      return Promise.resolve({} as RelayerDetailsRich);
    }
  }

  /**
   * @inheritdoc
   */
  public getRelayerOptionsComponent():
    | React.ComponentType<{
        options: Record<string, unknown>;
        onChange: (options: Record<string, unknown>) => void;
      }>
    | undefined {
    return StellarRelayerOptions;
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

  /**
   * @inheritdoc
   */
  public getUiLabels(): Record<string, string> | undefined {
    return {
      relayerConfigTitle: 'Transaction Configuration',
      relayerConfigActiveDesc: 'Customize transaction parameters for submission',
      relayerConfigInactiveDesc: 'Using recommended transaction configuration for reliability',
      relayerConfigPresetTitle: 'Recommended Preset Active',
      relayerConfigPresetDesc: 'Transactions will use recommended parameters for quick inclusion',
      relayerConfigCustomizeBtn: 'Customize Settings',
      detailsTitle: 'Relayer Details',
      network: 'Network',
      relayerId: 'Relayer ID',
      active: 'Active',
      paused: 'Paused',
      systemDisabled: 'System Disabled',
      balance: 'Balance',
      // For Stellar, sequence number is conceptually similar; adapters supply the value
      nonce: 'Sequence',
      pending: 'Pending Transactions',
      lastTransaction: 'Last Transaction',
    };
  }

  /**
   * @inheritdoc
   */
  public getAccessControlService(): AccessControlService {
    return this.accessControlService;
  }
}

// Also export as default to ensure compatibility with various import styles
export default StellarAdapter;
