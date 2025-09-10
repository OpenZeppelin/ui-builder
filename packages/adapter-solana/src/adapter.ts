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
  RelayerDetails,
  RelayerDetailsRich,
  SolanaNetworkConfig,
  UiKitConfiguration,
  UserRpcProviderConfig,
  WalletConnectionStatus,
} from '@openzeppelin/contracts-ui-builder-types';
import { isSolanaNetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import {
  getSolanaExplorerAddressUrl,
  getSolanaExplorerTxUrl,
  getSolanaSupportedExecutionMethods,
  testSolanaRpcConnection,
  validateSolanaExecutionConfig,
  validateSolanaRpcEndpoint,
} from './configuration';
// Import implementations from modules
import {
  generateSolanaDefaultField,
  getSolanaCompatibleFieldTypes,
  mapSolanaParamTypeToFieldType,
} from './mapping';
import { isSolanaViewFunction, querySolanaViewFunction } from './query';
import {
  formatSolanaTransactionData,
  signAndBroadcastSolanaTransaction,
  waitForSolanaTransactionConfirmation,
} from './transaction';
import { formatSolanaFunctionResult } from './transform';
import { isValidSolanaAddress, validateAndConvertSolanaArtifacts } from './utils';
import {
  connectSolanaWallet,
  disconnectSolanaWallet,
  getSolanaAvailableConnectors,
  getSolanaWalletConnectionStatus,
  onSolanaWalletConnectionChange,
  solanaSupportsWalletConnection,
  SolanaWalletConnectionStatus,
} from './wallet';

/**
 * Solana-specific adapter implementation
 */
export class SolanaAdapter implements ContractAdapter {
  readonly networkConfig: SolanaNetworkConfig;
  readonly initialAppServiceKitName: UiKitConfiguration['kitName'];
  // private walletImplementation: SolanaWalletImplementation; // Example

  constructor(networkConfig: SolanaNetworkConfig) {
    if (!isSolanaNetworkConfig(networkConfig)) {
      throw new Error('SolanaAdapter requires a valid Solana network configuration.');
    }
    this.networkConfig = networkConfig;
    this.initialAppServiceKitName = 'custom';
    logger.info(
      'SolanaAdapter',
      `Adapter initialized for network: ${networkConfig.name} (ID: ${networkConfig.id})`
    );
  }

  async loadContract(source: string | Record<string, unknown>): Promise<ContractSchema> {
    // Solana contracts (programs) don't have a standardized on-chain ABI.
    // The 'source' would likely be an IDL JSON provided by the user.
    // This is a placeholder for a more complex implementation.
    const artifacts = validateAndConvertSolanaArtifacts(source);

    return {
      name: 'SolanaProgram',
      address: artifacts.contractAddress,
      ecosystem: 'solana',
      functions: [],
      events: [],
    };
  }

  getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'] {
    // Simple filtering can stay here or be moved to a query util if complex
    return contractSchema.functions.filter((fn) => fn.modifiesState);
  }

  mapParameterTypeToFieldType(parameterType: string): FieldType {
    return mapSolanaParamTypeToFieldType(parameterType);
  }

  getCompatibleFieldTypes(parameterType: string): FieldType[] {
    return getSolanaCompatibleFieldTypes(parameterType);
  }

  generateDefaultField<T extends FieldType = FieldType>(
    parameter: FunctionParameter
  ): FormFieldType<T> {
    return generateSolanaDefaultField(parameter);
  }

  public formatTransactionData(
    contractSchema: ContractSchema,
    functionId: string,
    submittedInputs: Record<string, unknown>,
    fields: FormFieldType[]
  ): unknown {
    return formatSolanaTransactionData(contractSchema, functionId, submittedInputs, fields);
  }

  async signAndBroadcast(
    transactionData: unknown,
    executionConfig?: ExecutionConfig
  ): Promise<{ txHash: string }> {
    return signAndBroadcastSolanaTransaction(transactionData, executionConfig);
  }

  isValidAddress(address: string): boolean {
    return isValidSolanaAddress(address);
  }

  async getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
    return getSolanaSupportedExecutionMethods();
  }

  async validateExecutionConfig(config: ExecutionConfig): Promise<true | string> {
    return validateSolanaExecutionConfig(config);
  }

  isViewFunction(functionDetails: ContractFunction): boolean {
    return isSolanaViewFunction(functionDetails);
  }

  async queryViewFunction(
    contractAddress: string,
    functionId: string,
    params: unknown[] = [],
    contractSchema?: ContractSchema
  ): Promise<unknown> {
    return querySolanaViewFunction(
      contractAddress,
      functionId,
      this.networkConfig,
      params,
      contractSchema,
      null, // walletContext is not needed for view functions
      (source: string) => this.loadContract({ contractAddress: source })
    );
  }

  formatFunctionResult(decodedValue: unknown, functionDetails: ContractFunction): string {
    return formatSolanaFunctionResult(decodedValue, functionDetails);
  }

  supportsWalletConnection(): boolean {
    return solanaSupportsWalletConnection();
  }

  async getAvailableConnectors(): Promise<Connector[]> {
    return getSolanaAvailableConnectors(/* this.walletImplementation */);
  }

  async connectWallet(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    return connectSolanaWallet(connectorId /*, undefined */);
  }

  async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    return disconnectSolanaWallet(/* undefined */);
  }

  getWalletConnectionStatus(): SolanaWalletConnectionStatus {
    return getSolanaWalletConnectionStatus(/* undefined */);
  }

  onWalletConnectionChange?(
    callback: (
      currentStatus: WalletConnectionStatus,
      previousStatus: WalletConnectionStatus
    ) => void
  ): () => void {
    // Optional methods need careful handling during delegation
    if (onSolanaWalletConnectionChange) {
      return onSolanaWalletConnectionChange(/* this.walletImplementation, */ callback);
    }
    return () => {}; // Default no-op cleanup
  }

  getExplorerUrl(address: string): string | null {
    return getSolanaExplorerAddressUrl(address, this.networkConfig);
  }

  getExplorerTxUrl?(txHash: string): string | null {
    if (getSolanaExplorerTxUrl) {
      return getSolanaExplorerTxUrl(txHash, this.networkConfig);
    }
    return null;
  }

  async waitForTransactionConfirmation?(txHash: string): Promise<{
    status: 'success' | 'error';
    receipt?: unknown;
    error?: Error;
  }> {
    // Optional methods need careful handling during delegation
    if (waitForSolanaTransactionConfirmation) {
      return waitForSolanaTransactionConfirmation(txHash /*, this.walletImplementation */);
    }
    // If function doesn't exist in module, maybe return success immediately or throw?
    // Throwing is safer if the interface implies support when implemented.
    // Let's return success for placeholder.
    return { status: 'success' };
  }

  public async getAvailableUiKits(): Promise<AvailableUiKit[]> {
    return [
      {
        id: 'custom',
        name: 'OpenZeppelin Custom',
        configFields: [],
      },
    ];
  }

  public getContractDefinitionInputs(): FormFieldType[] {
    return [
      {
        id: 'contractAddress',
        name: 'contractAddress',
        label: 'Program ID',
        type: 'blockchain-address',
        validation: { required: true },
        placeholder: 'Enter Solana program ID',
      },
    ];
  }

  public async getRelayers(_serviceUrl: string, _accessToken: string): Promise<RelayerDetails[]> {
    logger.warn('SolanaAdapter', 'getRelayers is not implemented for the Solana adapter yet.');
    return Promise.resolve([]);
  }

  public async getRelayer(
    _serviceUrl: string,
    _accessToken: string,
    _relayerId: string
  ): Promise<RelayerDetailsRich> {
    logger.warn('SolanaAdapter', 'getRelayer is not implemented for the Solana adapter yet.');
    return Promise.resolve({} as RelayerDetailsRich);
  }

  /**
   * @inheritdoc
   */
  async validateRpcEndpoint(rpcConfig: UserRpcProviderConfig): Promise<boolean> {
    // TODO: Implement Solana-specific RPC validation when needed
    return validateSolanaRpcEndpoint(rpcConfig);
  }

  /**
   * @inheritdoc
   */
  async testRpcConnection(rpcConfig: UserRpcProviderConfig): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    // TODO: Implement Solana-specific RPC validation when needed
    return testSolanaRpcConnection(rpcConfig);
  }
}

export default SolanaAdapter;
