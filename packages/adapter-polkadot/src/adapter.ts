/**
 * @fileoverview PolkadotAdapter - Contract adapter for the Polkadot ecosystem.
 *
 * This adapter implements the ContractAdapter interface for Polkadot networks,
 * supporting both Hub networks (Polkadot Hub, Kusama Hub) and parachains (Moonbeam, Moonriver).
 *
 * All EVM operations are delegated to the evm/ modules, which in turn delegate to adapter-evm-core.
 * The adapter architecture supports future non-EVM (Substrate/Wasm) chains.
 *
 * ## Architecture Overview
 *
 * ```
 * PolkadotAdapter (this file)
 * ├── Contract Operations (evm/ module)
 * │   ├── ABI loading, validation
 * │   ├── Query (view functions)
 * │   ├── Transaction formatting
 * │   └── Delegates to adapter-evm-core
 * │
 * └── Wallet Operations (wallet/ module)
 *     ├── Connection management (wagmi)
 *     ├── UI kit configuration (RainbowKit)
 *     └── React hooks (wagmi facade)
 * ```
 *
 * ## Developer Notes: Future Substrate Extension
 *
 * When adding Substrate (non-EVM) support:
 *
 * 1. **Contract Operations** - Create `substrate/` module alongside `evm/`:
 *    - `substrate/abi/` - ink! ABI handling
 *    - `substrate/query/` - Contract queries via polkadot-api
 *    - `substrate/transaction/` - Substrate extrinsics
 *
 * 2. **Wallet Operations** - Create `wallet/substrate/` alongside current wagmi-based wallet:
 *    - Use @polkadot/extension-dapp for wallet connectivity
 *    - Different connector types (Polkadot.js, Talisman, SubWallet)
 *    - Different UI kit (e.g., custom Substrate wallet modal)
 *
 * 3. **Execution Type Routing** - The `assertEvmExecution()` pattern will become:
 *    ```typescript
 *    if (this._typedNetworkConfig.executionType === 'evm') {
 *      return evm.someFunction(...);
 *    } else {
 *      return substrate.someFunction(...);
 *    }
 *    ```
 *
 * 4. **Network Config** - TypedPolkadotNetworkConfig.executionType determines routing
 */

import type { TransactionReceipt } from 'viem';
import React from 'react';

// =============================================================================
// Wallet Module Imports
// -----------------------------------------------------------------------------
// Wallet operations use wagmi/RainbowKit for EVM-compatible Polkadot chains.
// These are NOT delegated to the evm/ module because wallet connectivity is a
// separate concern from contract operations.
//
// [SUBSTRATE TODO]: When adding Substrate support, create wallet/substrate/ with:
// - Polkadot.js extension integration
// - Talisman/SubWallet connectors
// - Substrate-specific UI kit manager
// =============================================================================
import {
  generateRainbowKitExportables,
  resolveFullUiKitConfiguration,
} from '@openzeppelin/ui-builder-adapter-evm-core';
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
  FunctionParameter,
  NetworkConfig,
  NetworkServiceForm,
  ProxyInfo,
  RelayerDetails,
  RelayerDetailsRich,
  TransactionStatusUpdate,
  TxStatus,
  TypeMappingInfo,
  UiKitConfiguration,
  UserExplorerConfig,
  UserRpcProviderConfig,
  WalletConnectionStatus,
} from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { loadInitialConfigFromAppService, polkadotFacadeHooks } from './wallet/hooks';
import { getPolkadotWalletImplementation } from './wallet/implementation';
import { polkadotUiKitManager } from './wallet/polkadotUiKitManager';
import { PolkadotWalletUiRoot } from './wallet/PolkadotWalletUiRoot';
import {
  connectAndEnsureCorrectNetwork,
  disconnectPolkadotWallet,
  getPolkadotAvailableConnectors,
  getPolkadotWalletConnectionStatus,
  getResolvedWalletComponents,
  onPolkadotWalletConnectionChange,
  polkadotSupportsWalletConnection,
} from './wallet/utils';

// =============================================================================
// EVM Module Imports
// -----------------------------------------------------------------------------
// Contract operations (ABI, query, transactions) delegate to the evm/ module,
// which wraps adapter-evm-core functionality.
//
// [SUBSTRATE TODO]: Create substrate/ module with parallel structure:
// - substrate/abi/ - ink! ABI loading/validation
// - substrate/query/ - polkadot-api contract queries
// - substrate/transaction/ - Substrate extrinsic formatting
// =============================================================================
import * as evm from './evm';
import type { WriteContractParameters } from './evm';
import type { TypedPolkadotNetworkConfig } from './types';

/**
 * PolkadotAdapter implements ContractAdapter for the Polkadot ecosystem.
 *
 * ## Supported Networks
 *
 * **Hub Networks (P1):**
 * - Polkadot Hub (chain ID: 420420419)
 * - Kusama Hub (chain ID: 420420418)
 * - Polkadot Hub TestNet (chain ID: 420420417)
 *
 * **Parachain Networks (P2):**
 * - Moonbeam (chain ID: 1284)
 * - Moonriver (chain ID: 1285)
 * - Moonbase Alpha (chain ID: 1287)
 *
 * ## Architecture
 *
 * The adapter uses a handler-based architecture to support multiple execution types:
 * - `'evm'`: Delegates to adapter-evm-core modules
 * - `'substrate'`: Reserved for future non-EVM support
 *
 * @example
 * ```typescript
 * import { PolkadotAdapter, polkadotHubMainnet } from '@openzeppelin/ui-builder-adapter-polkadot';
 *
 * const adapter = new PolkadotAdapter(polkadotHubMainnet);
 * const schema = await adapter.loadContract('0x1234...');
 * ```
 */
export class PolkadotAdapter implements ContractAdapter {
  readonly networkConfig: NetworkConfig;
  readonly initialAppServiceKitName: UiKitConfiguration['kitName'];
  private readonly _typedNetworkConfig: TypedPolkadotNetworkConfig;

  /**
   * Create a new PolkadotAdapter instance.
   * @param networkConfig - The Polkadot network configuration
   */
  constructor(networkConfig: NetworkConfig) {
    // Validate that this is a Polkadot network config
    const config = networkConfig as unknown as TypedPolkadotNetworkConfig;
    if (config.ecosystem !== 'polkadot') {
      throw new Error(
        `PolkadotAdapter requires a Polkadot network config, got ecosystem: ${config.ecosystem}`
      );
    }
    this.networkConfig = networkConfig;
    this._typedNetworkConfig = config;

    // Load initial kitName from AppConfigService
    const initialGlobalConfig = loadInitialConfigFromAppService();
    this.initialAppServiceKitName =
      (initialGlobalConfig.kitName as UiKitConfiguration['kitName']) || 'custom';

    logger.info(
      'PolkadotAdapter:constructor',
      `Adapter initialized for network: ${config.name} (ID: ${config.id}). ` +
        `Initial kitName: ${this.initialAppServiceKitName}`
    );
  }

  /**
   * Load a contract schema from an address or artifacts.
   * Uses Blockscout (V1 API) for Hub networks, Moonscan (V2 API) for parachains.
   * Falls back to Sourcify if primary provider fails.
   *
   * [SUBSTRATE TODO]: ink! contracts would need different loading:
   * - Fetch .contract metadata from Subscan or similar
   * - Parse ink! ABI format (constructors, messages, events)
   * - Different address format (SS58 vs 0x)
   */
  async loadContract(source: string | Record<string, unknown>): Promise<ContractSchema> {
    this.assertEvmExecution();
    // If source is a string, treat it as an address; otherwise use it as artifacts
    const address = typeof source === 'string' ? source : '';
    const options = typeof source === 'string' ? undefined : { artifacts: source };
    return evm.loadContract(address, this._typedNetworkConfig, options);
  }

  /**
   * Map a Solidity parameter type to a UI field type.
   */
  mapParameterTypeToFieldType(paramType: string): FieldType {
    this.assertEvmExecution();
    return evm.mapEvmParamTypeToFieldType(paramType);
  }

  /**
   * Get compatible field types for a parameter type.
   */
  getCompatibleFieldTypes(paramType: string): FieldType[] {
    this.assertEvmExecution();
    return evm.getEvmCompatibleFieldTypes(paramType);
  }

  /**
   * Generate default field configuration for a function parameter.
   */
  generateDefaultField<T extends FieldType = FieldType>(
    parameter: FunctionParameter,
    _contractSchema?: ContractSchema
  ): FormFieldType<T> {
    this.assertEvmExecution();
    return evm.generateEvmDefaultField(parameter) as FormFieldType<T>;
  }

  /**
   * Format blockchain result for display.
   */
  formatFunctionResult(result: unknown, functionDetails: ContractFunction): string {
    this.assertEvmExecution();
    return evm.formatEvmFunctionResult(result, functionDetails);
  }

  /**
   * Check if a function is view/pure (doesn't require transaction).
   */
  isViewFunction(func: ContractFunction): boolean {
    this.assertEvmExecution();
    return evm.isViewFunction(func);
  }

  /**
   * Query a view/pure function without wallet connection.
   */
  async queryViewFunction(
    address: string,
    functionId: string,
    params: unknown[],
    schema: ContractSchema
  ): Promise<unknown> {
    this.assertEvmExecution();
    return evm.queryViewFunction(address, functionId, params, schema, this._typedNetworkConfig);
  }

  /**
   * Validate an address format.
   * Uses EVM address validation (0x + 40 hex chars).
   */
  isValidAddress(address: string, _addressType?: string): boolean {
    this.assertEvmExecution();
    return evm.isValidEvmAddress(address);
  }

  /**
   * Get supported contract definition providers.
   * Returns Etherscan (for Blockscout/Moonscan) and Sourcify.
   */
  getSupportedContractDefinitionProviders(): Array<{ key: string; label: string }> {
    return [
      {
        key: 'etherscan',
        label: this._typedNetworkConfig.networkCategory === 'hub' ? 'Blockscout' : 'Moonscan',
      },
      { key: 'sourcify', label: 'Sourcify' },
      { key: 'manual', label: 'Manual' },
    ];
  }

  /**
   * Get writable (non-view) functions from a contract schema.
   * Filters functions that modify state.
   */
  getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'] {
    this.assertEvmExecution();
    return evm.getWritableFunctions(contractSchema.functions);
  }

  /**
   * Filter out admin/upgrade management getters that often revert or require permissions.
   */
  filterAutoQueryableFunctions(functions: ContractFunction[]): ContractFunction[] {
    this.assertEvmExecution();
    return evm.filterAutoQueryableFunctions(functions);
  }

  /**
   * Format transaction data for signing and broadcasting.
   */
  formatTransactionData(
    contractSchema: ContractSchema,
    functionId: string,
    submittedInputs: Record<string, unknown>,
    fields: FormFieldType[]
  ): unknown {
    this.assertEvmExecution();
    return evm.formatEvmTransactionData(contractSchema, functionId, submittedInputs, fields);
  }

  /**
   * Sign and broadcast a transaction.
   *
   * [SUBSTRATE TODO]: Substrate transactions (extrinsics) are fundamentally different:
   * - Use polkadot-api or @polkadot/api for transaction construction
   * - Different signing flow (Polkadot.js extension)
   * - Extrinsic format instead of EVM transaction
   * - Different status lifecycle (InBlock, Finalized, etc.)
   * - Create substrate/transaction/ module for extrinsic handling
   */
  async signAndBroadcast(
    transactionData: unknown,
    executionConfig: ExecutionConfig,
    onStatusChange: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<{ txHash: string }> {
    this.assertEvmExecution();

    const walletImplementation = getPolkadotWalletImplementation();

    // Verify wallet implementation has been initialized
    if (!walletImplementation.isReady()) {
      throw new Error(
        'Wallet not initialized. Ensure PolkadotWalletUiRoot is mounted before calling signAndBroadcast.'
      );
    }

    return evm.executeEvmTransaction(
      transactionData as WriteContractParameters,
      executionConfig,
      walletImplementation,
      onStatusChange,
      runtimeApiKey
    );
  }

  // ============================================================================
  // Network Service Configuration
  // ============================================================================

  /**
   * Get network service forms.
   */
  getNetworkServiceForms(): NetworkServiceForm[] {
    this.assertEvmExecution();
    return evm.getNetworkServiceForms(this._typedNetworkConfig);
  }

  /**
   * Validate network service configuration.
   */
  async validateNetworkServiceConfig(
    serviceId: string,
    values: Record<string, unknown>
  ): Promise<boolean> {
    this.assertEvmExecution();
    return evm.validateNetworkServiceConfig(serviceId, values);
  }

  /**
   * Test network service connection.
   */
  async testNetworkServiceConnection(
    serviceId: string,
    values: Record<string, unknown>
  ): Promise<{ success: boolean; latency?: number; error?: string }> {
    this.assertEvmExecution();
    return evm.testNetworkServiceConnection(serviceId, values, this._typedNetworkConfig);
  }

  /**
   * @inheritdoc
   */
  public getDefaultServiceConfig(serviceId: string): Record<string, unknown> | null {
    this.assertEvmExecution();
    return evm.getPolkadotDefaultServiceConfig(this._typedNetworkConfig, serviceId);
  }

  /**
   * Validate an RPC endpoint configuration.
   */
  async validateRpcEndpoint(rpcConfig: UserRpcProviderConfig): Promise<boolean> {
    this.assertEvmExecution();
    return evm.validateRpcEndpoint(rpcConfig);
  }

  /**
   * Test an RPC connection.
   */
  async testRpcConnection(
    rpcConfig: UserRpcProviderConfig
  ): Promise<{ success: boolean; latency?: number; error?: string }> {
    this.assertEvmExecution();
    return evm.testRpcConnection(rpcConfig);
  }

  /**
   * Validate an explorer configuration.
   */
  async validateExplorerConfig(explorerConfig: UserExplorerConfig): Promise<boolean> {
    this.assertEvmExecution();
    return evm.validateExplorerConfig(explorerConfig);
  }

  /**
   * Test an explorer connection.
   */
  async testExplorerConnection(
    explorerConfig: UserExplorerConfig
  ): Promise<{ success: boolean; latency?: number; error?: string }> {
    this.assertEvmExecution();
    return evm.testExplorerConnection(explorerConfig, this._typedNetworkConfig);
  }

  // ============================================================================
  // Contract Definition
  // ----------------------------------------------------------------------------
  // Contract definition handling (ABI loading, validation, comparison).
  // Currently uses EVM ABI format (JSON).
  //
  // [SUBSTRATE TODO]: ink! contracts use different metadata format:
  // - .contract files (JSON with different structure)
  // - Different validation rules
  // - ink! specific comparison logic
  // - Create substrate/abi/ module for ink! metadata handling
  // ============================================================================

  /**
   * Get inputs for the contract definition form.
   * Returns standard EVM contract definition fields.
   */
  getContractDefinitionInputs(): FormFieldType[] {
    this.assertEvmExecution();
    return evm.getContractDefinitionInputs();
  }

  /**
   * Load contract with metadata.
   */
  async loadContractWithMetadata(source: string | Record<string, unknown>): Promise<{
    schema: ContractSchema;
    source: 'fetched' | 'manual';
    contractDefinitionOriginal?: string;
    metadata?: {
      fetchedFrom?: string;
      contractName?: string;
      verificationStatus?: 'verified' | 'unverified' | 'unknown';
      fetchTimestamp?: Date;
      definitionHash?: string;
    };
    proxyInfo?: ProxyInfo;
  }> {
    this.assertEvmExecution();
    return evm.loadContractWithMetadata(source, this._typedNetworkConfig);
  }

  /**
   * Compare two contract definitions (ABI strings).
   */
  async compareContractDefinitions(
    storedSchema: string,
    freshSchema: string
  ): Promise<{
    identical: boolean;
    differences: Array<{
      type: 'added' | 'removed' | 'modified';
      section: string;
      name: string;
      details: string;
      impact: 'low' | 'medium' | 'high';
      oldSignature?: string;
      newSignature?: string;
    }>;
    severity: 'none' | 'minor' | 'major' | 'breaking';
    summary: string;
  }> {
    this.assertEvmExecution();
    return evm.compareContractDefinitions(storedSchema, freshSchema);
  }

  /**
   * Validate a contract definition (ABI string).
   */
  validateContractDefinition(definition: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    this.assertEvmExecution();
    return evm.validateContractDefinition(definition);
  }

  /**
   * Hash a contract definition (ABI string).
   */
  hashContractDefinition(definition: string): string {
    this.assertEvmExecution();
    return evm.hashContractDefinition(definition);
  }

  // ============================================================================
  // Execution Configuration
  // ============================================================================

  /**
   * Get supported execution methods.
   * Returns EOA, Relayer, and Multisig (disabled) options.
   */
  async getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
    this.assertEvmExecution();
    return evm.getSupportedExecutionMethods();
  }

  /**
   * Validate execution configuration.
   */
  async validateExecutionConfig(config: ExecutionConfig): Promise<true | string> {
    this.assertEvmExecution();
    const walletStatus = this.getWalletConnectionStatus();
    return evm.validateExecutionConfig(config, walletStatus);
  }

  // ============================================================================
  // Wallet Connection
  // ----------------------------------------------------------------------------
  // Wallet methods delegate to wallet/utils which uses wagmi for EVM chains.
  // These use assertEvmExecution() because the current wallet implementation
  // (wagmi/RainbowKit) is EVM-specific.
  //
  // [SUBSTRATE TODO]: When adding Substrate wallet support:
  // 1. Create wallet/substrate/ with Polkadot.js extension integration
  // 2. Route based on executionType:
  //    - 'evm' -> current wagmi-based implementation
  //    - 'substrate' -> new polkadot.js-based implementation
  // 3. Update assertEvmExecution() calls to execution type routing
  // ============================================================================

  /**
   * Check if wallet connection is supported.
   */
  supportsWalletConnection(): boolean {
    this.assertEvmExecution();
    return polkadotSupportsWalletConnection();
  }

  /**
   * Get available wallet connectors.
   */
  async getAvailableConnectors(): Promise<Connector[]> {
    this.assertEvmExecution();
    return getPolkadotAvailableConnectors();
  }

  /**
   * Connect to a wallet using the specified connector.
   */
  async connectWallet(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    this.assertEvmExecution();
    const result = await connectAndEnsureCorrectNetwork(
      connectorId,
      this._typedNetworkConfig.chainId
    );
    if (result.connected && result.address) {
      return { connected: true, address: result.address };
    }
    return { connected: false, error: result.error || 'Connection failed.' };
  }

  /**
   * Disconnect the currently connected wallet.
   */
  async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    this.assertEvmExecution();
    return disconnectPolkadotWallet();
  }

  /**
   * Get the current wallet connection status.
   */
  getWalletConnectionStatus(): WalletConnectionStatus {
    this.assertEvmExecution();
    const status = getPolkadotWalletConnectionStatus();
    return {
      isConnected: status.isConnected,
      isConnecting: status.isConnecting,
      isDisconnected: status.isDisconnected,
      isReconnecting: status.isReconnecting,
      status: status.status,
      address: status.address,
      chainId: status.chainId,
    };
  }

  // ============================================================================
  // Relayer Integration
  // ============================================================================

  /**
   * Get available relayers for this network.
   */
  async getRelayers(serviceUrl: string, accessToken: string): Promise<RelayerDetails[]> {
    this.assertEvmExecution();
    return evm.getRelayers(serviceUrl, accessToken, this._typedNetworkConfig);
  }

  /**
   * Get a specific relayer by ID.
   */
  async getRelayer(
    serviceUrl: string,
    accessToken: string,
    relayerId: string
  ): Promise<RelayerDetailsRich> {
    this.assertEvmExecution();
    return evm.getRelayer(serviceUrl, accessToken, relayerId, this._typedNetworkConfig);
  }

  /**
   * Get relayer options component.
   */
  getRelayerOptionsComponent():
    | React.ComponentType<{
        options: Record<string, unknown>;
        onChange: (options: Record<string, unknown>) => void;
      }>
    | undefined {
    this.assertEvmExecution();
    return evm.getRelayerOptionsComponent();
  }

  // ============================================================================
  // Type Mapping
  // ============================================================================

  /**
   * Get type mapping information.
   */
  getTypeMappingInfo(): TypeMappingInfo {
    this.assertEvmExecution();
    return evm.getEvmTypeMappingInfo();
  }

  // ============================================================================
  // Explorer URLs
  // ============================================================================

  /**
   * Get explorer URL for a transaction hash.
   */
  getExplorerTxUrl(txHash: string): string | null {
    this.assertEvmExecution();
    return evm.getEvmExplorerTxUrl(txHash, this._typedNetworkConfig);
  }

  /**
   * Get explorer URL for an address.
   */
  getExplorerUrl(address: string): string | null {
    this.assertEvmExecution();
    return evm.getEvmExplorerAddressUrl(address, this._typedNetworkConfig);
  }

  // ============================================================================
  // Block Information
  // ============================================================================

  /**
   * Get the current block number.
   */
  async getCurrentBlock(): Promise<number> {
    this.assertEvmExecution();
    return evm.getEvmCurrentBlock(this._typedNetworkConfig);
  }

  /**
   * Wait for transaction confirmation.
   */
  async waitForTransactionConfirmation(txHash: string): Promise<{
    status: 'success' | 'error';
    receipt?: TransactionReceipt;
    error?: Error;
  }> {
    this.assertEvmExecution();
    const walletImplementation = getPolkadotWalletImplementation();
    return evm.waitForEvmTransactionConfirmation(txHash, walletImplementation);
  }

  // ============================================================================
  // UI Kit Configuration
  // ----------------------------------------------------------------------------
  // UI kit methods configure wallet UI (e.g., RainbowKit modal).
  // Currently EVM-only as they depend on wagmi configuration.
  //
  // [SUBSTRATE TODO]: Substrate chains would have different UI kit options:
  // - Custom Substrate wallet modal
  // - Different theme/branding options
  // - Substrate-specific config fields
  // ============================================================================

  /**
   * Get available UI kits.
   */
  async getAvailableUiKits(): Promise<AvailableUiKit[]> {
    this.assertEvmExecution();
    return evm.getAvailableUiKits();
  }

  /**
   * Get UI labels for relayer configuration.
   */
  getUiLabels(): Record<string, string> | undefined {
    this.assertEvmExecution();
    return evm.getUiLabels();
  }

  // ============================================================================
  // Wallet Connection Events
  // ============================================================================

  /**
   * Subscribe to wallet connection status changes.
   */
  onWalletConnectionChange(
    callback: (
      currentStatus: WalletConnectionStatus,
      previousStatus: WalletConnectionStatus
    ) => void
  ): () => void {
    this.assertEvmExecution();
    return onPolkadotWalletConnectionChange((current, previous) => {
      callback(
        {
          isConnected: current.isConnected,
          isConnecting: current.isConnecting,
          address: current.address,
          chainId: current.chainId,
        },
        {
          isConnected: previous.isConnected,
          isConnecting: previous.isConnecting,
          address: previous.address,
          chainId: previous.chainId,
        }
      );
    });
  }

  // ============================================================================
  // UI Kit Configuration
  // ============================================================================

  /**
   * Configure the UI kit for the adapter.
   * Resolves configuration from multiple sources and applies it via the UI kit manager.
   */
  async configureUiKit(
    programmaticOverrides: Partial<UiKitConfiguration> = {},
    options?: {
      loadUiKitNativeConfig?: () => Promise<Partial<UiKitConfiguration>>;
    }
  ): Promise<void> {
    this.assertEvmExecution();

    const currentAppServiceConfig = loadInitialConfigFromAppService();

    // Resolve the full configuration from all sources
    const finalFullConfig = await resolveFullUiKitConfiguration(
      programmaticOverrides,
      this.initialAppServiceKitName,
      currentAppServiceConfig,
      options
    );

    // Apply the configuration via the UI kit manager
    await polkadotUiKitManager.configure(finalFullConfig);
    logger.info(
      'PolkadotAdapter:configureUiKit',
      'UI kit configured with kitName:',
      finalFullConfig.kitName
    );
  }

  /**
   * @inheritdoc
   */
  getEcosystemReactUiContextProvider():
    | React.ComponentType<EcosystemReactUiProviderProps>
    | undefined {
    this.assertEvmExecution();
    logger.info(
      'PolkadotAdapter:getEcosystemReactUiContextProvider',
      'Returning PolkadotWalletUiRoot.'
    );
    return PolkadotWalletUiRoot;
  }

  /**
   * @inheritdoc
   */
  getEcosystemReactHooks(): EcosystemSpecificReactHooks | undefined {
    this.assertEvmExecution();
    return polkadotFacadeHooks;
  }

  /**
   * @inheritdoc
   */
  getEcosystemWalletComponents(): EcosystemWalletComponents | undefined {
    this.assertEvmExecution();
    const currentManagerState = polkadotUiKitManager.getState();
    if (!currentManagerState.currentFullUiKitConfig) {
      logger.debug(
        'PolkadotAdapter:getEcosystemWalletComponents',
        'No UI kit configuration available in manager yet. Returning undefined.'
      );
      return undefined;
    }
    return getResolvedWalletComponents(currentManagerState.currentFullUiKitConfig);
  }

  /**
   * @inheritdoc
   */
  async getExportableWalletConfigFiles(
    uiKitConfig?: UiKitConfiguration
  ): Promise<Record<string, string>> {
    this.assertEvmExecution();
    if (uiKitConfig?.kitName === 'rainbowkit') {
      return generateRainbowKitExportables(uiKitConfig);
    }
    return {};
  }

  // ===========================================================================
  // Execution Type Guard
  // ---------------------------------------------------------------------------
  // Currently all operations require EVM execution. When Substrate support is
  // added, this guard will be replaced with execution type routing:
  //
  // [SUBSTRATE TODO]: Replace assertEvmExecution() calls with routing logic:
  //   if (this._typedNetworkConfig.executionType === 'evm') {
  //     return evm.someFunction(...);
  //   } else if (this._typedNetworkConfig.executionType === 'substrate') {
  //     return substrate.someFunction(...);
  //   }
  // ===========================================================================

  /**
   * Assert that the network supports EVM execution.
   * @throws Error if execution type is not 'evm'
   */
  private assertEvmExecution(): void {
    if (this._typedNetworkConfig.executionType !== 'evm') {
      throw new Error(
        `Operation not supported for execution type: ${this._typedNetworkConfig.executionType}. ` +
          `Only 'evm' is currently supported.`
      );
    }
  }
}
