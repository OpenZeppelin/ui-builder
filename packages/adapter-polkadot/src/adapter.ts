/**
 * @fileoverview PolkadotAdapter - Contract adapter for the Polkadot ecosystem.
 *
 * This adapter implements the ContractAdapter interface for Polkadot networks,
 * supporting both Hub networks (Polkadot Hub, Kusama Hub) and parachains (Moonbeam, Moonriver).
 *
 * All EVM operations are delegated to adapter-evm-core through the EVM handler.
 * The adapter architecture supports future non-EVM (Substrate/Wasm) chains.
 */

import React from 'react';

import type {
  AvailableUiKit,
  Connector,
  ContractAdapter,
  ContractFunction,
  ContractSchema,
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
  WalletConnectionStatus,
} from '@openzeppelin/ui-types';

import * as evmHandler from './handlers/evm-handler';

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
  readonly initialAppServiceKitName: UiKitConfiguration['kitName'] = 'custom';
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
  }

  /**
   * Load a contract schema from an address or artifacts.
   * Uses Blockscout (V1 API) for Hub networks, Moonscan (V2 API) for parachains.
   * Falls back to Sourcify if primary provider fails.
   */
  async loadContract(source: string | Record<string, unknown>): Promise<ContractSchema> {
    this.assertEvmExecution();
    // If source is a string, treat it as an address; otherwise use it as artifacts
    const address = typeof source === 'string' ? source : '';
    const options = typeof source === 'string' ? undefined : { artifacts: source };
    return evmHandler.loadContract(address, this._typedNetworkConfig, options);
  }

  /**
   * Map a Solidity parameter type to a UI field type.
   * Delegates to adapter-evm-core.
   */
  mapParameterTypeToFieldType(paramType: string): FieldType {
    this.assertEvmExecution();
    return evmHandler.mapParameterTypeToFieldType(paramType);
  }

  /**
   * Get compatible field types for a parameter type.
   * Delegates to adapter-evm-core.
   */
  getCompatibleFieldTypes(paramType: string): FieldType[] {
    this.assertEvmExecution();
    return evmHandler.getCompatibleFieldTypes(paramType);
  }

  /**
   * Generate default field configuration for a function parameter.
   * Delegates to adapter-evm-core.
   */
  generateDefaultField<T extends FieldType = FieldType>(
    parameter: FunctionParameter,
    _contractSchema?: ContractSchema
  ): FormFieldType<T> {
    this.assertEvmExecution();
    return evmHandler.generateDefaultField(parameter) as FormFieldType<T>;
  }

  /**
   * Parse user input to blockchain-compatible value.
   * Delegates to adapter-evm-core.
   * @internal
   */
  private parseInput(value: string, type: string): unknown {
    this.assertEvmExecution();
    return evmHandler.parseInput(value, type);
  }

  /**
   * Format blockchain result for display.
   * Delegates to adapter-evm-core.
   */
  formatFunctionResult(result: unknown, functionDetails: ContractFunction): string {
    this.assertEvmExecution();
    return evmHandler.formatFunctionResult(
      result,
      functionDetails.outputs || [],
      functionDetails.id
    );
  }

  /**
   * Check if a function is view/pure (doesn't require transaction).
   * Delegates to adapter-evm-core.
   */
  isViewFunction(func: ContractFunction): boolean {
    this.assertEvmExecution();
    return evmHandler.isViewFunction(func);
  }

  /**
   * Query a view/pure function without wallet connection.
   * Delegates to adapter-evm-core.
   */
  async queryViewFunction(
    address: string,
    functionId: string,
    params: unknown[],
    schema: ContractSchema
  ): Promise<unknown> {
    this.assertEvmExecution();
    return evmHandler.queryViewFunction(
      address,
      functionId,
      params,
      schema,
      this._typedNetworkConfig
    );
  }

  /**
   * Validate an address format.
   * Uses EVM address validation (0x + 40 hex chars).
   */
  isValidAddress(address: string, _addressType?: string): boolean {
    this.assertEvmExecution();
    return evmHandler.isValidAddress(address);
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
   * Get the current typed network configuration.
   * @internal
   */
  private getTypedNetworkConfig(): TypedPolkadotNetworkConfig {
    return this._typedNetworkConfig;
  }

  /**
   * Get writable (non-view) functions from a contract schema.
   * TODO: Implement by delegating to EVM handler
   */
  getWritableFunctions(_contractSchema: ContractSchema): ContractSchema['functions'] {
    this.assertEvmExecution();
    // TODO: Implement getWritableFunctions delegation to EVM handler
    throw new Error('getWritableFunctions not yet implemented');
  }

  /**
   * Format transaction data for signing and broadcasting.
   * TODO: Implement by delegating to EVM handler
   */
  formatTransactionData(
    _contractSchema: ContractSchema,
    _functionId: string,
    _submittedInputs: Record<string, unknown>,
    _fields: FormFieldType[]
  ): unknown {
    this.assertEvmExecution();
    // TODO: Implement formatTransactionData delegation to EVM handler
    throw new Error('formatTransactionData not yet implemented');
  }

  /**
   * Sign and broadcast a transaction.
   * TODO: Implement by delegating to EVM handler
   */
  async signAndBroadcast(
    _transactionData: unknown,
    _executionConfig: ExecutionConfig,
    _onStatusChange: (status: TxStatus, details: TransactionStatusUpdate) => void,
    _runtimeApiKey?: string
  ): Promise<{ txHash: string }> {
    this.assertEvmExecution();
    // TODO: Implement signAndBroadcast delegation to EVM handler
    throw new Error('signAndBroadcast not yet implemented');
  }

  // ============================================================================
  // Stub implementations for ContractAdapter interface
  // TODO: These methods need to be implemented in future tasks by delegating to EVM handlers
  // ============================================================================

  getNetworkServiceForms(): NetworkServiceForm[] {
    this.assertEvmExecution();
    throw new Error('getNetworkServiceForms not yet implemented');
  }

  async validateNetworkServiceConfig(
    _serviceId: string,
    _values: Record<string, unknown>
  ): Promise<boolean> {
    this.assertEvmExecution();
    throw new Error('validateNetworkServiceConfig not yet implemented');
  }

  async testNetworkServiceConnection(
    _serviceId: string,
    _values: Record<string, unknown>
  ): Promise<{ success: boolean; latency?: number; error?: string }> {
    this.assertEvmExecution();
    throw new Error('testNetworkServiceConnection not yet implemented');
  }

  getContractDefinitionInputs(): FormFieldType[] {
    this.assertEvmExecution();
    throw new Error('getContractDefinitionInputs not yet implemented');
  }

  async loadContractWithMetadata(_source: string | Record<string, unknown>): Promise<{
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
    throw new Error('loadContractWithMetadata not yet implemented');
  }

  async getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
    this.assertEvmExecution();
    throw new Error('getSupportedExecutionMethods not yet implemented');
  }

  async validateExecutionConfig(_config: ExecutionConfig): Promise<true | string> {
    this.assertEvmExecution();
    throw new Error('validateExecutionConfig not yet implemented');
  }

  supportsWalletConnection(): boolean {
    this.assertEvmExecution();
    throw new Error('supportsWalletConnection not yet implemented');
  }

  async getAvailableConnectors(): Promise<Connector[]> {
    this.assertEvmExecution();
    throw new Error('getAvailableConnectors not yet implemented');
  }

  async connectWallet(
    _connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    this.assertEvmExecution();
    throw new Error('connectWallet not yet implemented');
  }

  async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    this.assertEvmExecution();
    throw new Error('disconnectWallet not yet implemented');
  }

  getWalletConnectionStatus(): WalletConnectionStatus {
    this.assertEvmExecution();
    throw new Error('getWalletConnectionStatus not yet implemented');
  }

  async getRelayers(_serviceUrl: string, _accessToken: string): Promise<RelayerDetails[]> {
    this.assertEvmExecution();
    throw new Error('getRelayers not yet implemented');
  }

  async getRelayer(
    _serviceUrl: string,
    _accessToken: string,
    _relayerId: string
  ): Promise<RelayerDetailsRich> {
    this.assertEvmExecution();
    throw new Error('getRelayer not yet implemented');
  }

  getRelayerOptionsComponent():
    | React.ComponentType<{
        options: Record<string, unknown>;
        onChange: (options: Record<string, unknown>) => void;
      }>
    | undefined {
    this.assertEvmExecution();
    throw new Error('getRelayerOptionsComponent not yet implemented');
  }

  getTypeMappingInfo(): TypeMappingInfo {
    this.assertEvmExecution();
    throw new Error('getTypeMappingInfo not yet implemented');
  }

  getExplorerTxUrl(_txHash: string): string {
    this.assertEvmExecution();
    throw new Error('getExplorerTxUrl not yet implemented');
  }

  getExplorerUrl(_address: string): string | null {
    this.assertEvmExecution();
    throw new Error('getExplorerUrl not yet implemented');
  }

  async getCurrentBlock(): Promise<number> {
    this.assertEvmExecution();
    throw new Error('getCurrentBlock not yet implemented');
  }

  async getAvailableUiKits(): Promise<AvailableUiKit[]> {
    this.assertEvmExecution();
    throw new Error('getAvailableUiKits not yet implemented');
  }

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
