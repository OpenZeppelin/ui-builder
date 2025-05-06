import type {
  Connector,
  ContractAdapter,
  ContractFunction,
  ContractSchema,
  ExecutionConfig,
  ExecutionMethodDetail,
  FieldType,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/transaction-form-types';

import {
  getSolanaExplorerAddressUrl,
  getSolanaExplorerTxUrl,
  getSolanaSupportedExecutionMethods,
  validateSolanaExecutionConfig,
} from './configuration';
// Import implementations from modules
import { loadSolanaContract } from './definition';
import {
  generateSolanaDefaultField,
  getSolanaCompatibleFieldTypes,
  mapSolanaParamTypeToFieldType,
} from './mapping';
import { loadSolanaMockContract } from './mocking';
import { isSolanaViewFunction, querySolanaViewFunction } from './query';
import {
  formatSolanaTransactionData,
  signAndBroadcastSolanaTransaction,
  waitForSolanaTransactionConfirmation,
} from './transaction';
import { formatSolanaFunctionResult } from './transform';
import { isValidSolanaAddress } from './utils';
import {
  connectSolanaWallet,
  disconnectSolanaWallet,
  getSolanaAvailableConnectors,
  getSolanaWalletConnectionStatus,
  onSolanaWalletConnectionChange,
  solanaSupportsWalletConnection,
} from './wallet';

/**
 * Solana-specific adapter implementation
 */
export class SolanaAdapter implements ContractAdapter {
  // private walletImplementation: SolanaWalletImplementation; // Example

  constructor() {
    // Initialize any internal state/implementation needed
    // this.walletImplementation = new SolanaWalletImplementation();
  }

  async loadContract(source: string): Promise<ContractSchema> {
    return loadSolanaContract(source);
  }

  async loadMockContract(mockId?: string): Promise<ContractSchema> {
    return loadSolanaMockContract(mockId);
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

  formatTransactionData(
    contractSchema: ContractSchema,
    functionId: string,
    submittedInputs: Record<string, unknown>,
    allFieldsConfig: FormFieldType[]
  ): unknown {
    return formatSolanaTransactionData(
      contractSchema,
      functionId,
      submittedInputs,
      allFieldsConfig
    );
  }

  async signAndBroadcast(transactionData: unknown): Promise<{ txHash: string }> {
    return signAndBroadcastSolanaTransaction(transactionData);
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
      params,
      contractSchema,
      undefined,
      this.loadContract
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

  getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
    return getSolanaWalletConnectionStatus(/* undefined */);
  }

  onWalletConnectionChange?(
    callback: (status: { isConnected: boolean; address?: string }) => void
  ): () => void {
    // Optional methods need careful handling during delegation
    if (onSolanaWalletConnectionChange) {
      return onSolanaWalletConnectionChange(/* this.walletImplementation, */ callback);
    }
    return () => {}; // Default no-op cleanup
  }

  getExplorerUrl(address: string, chainId?: string): string | null {
    return getSolanaExplorerAddressUrl(address, chainId);
  }

  getExplorerTxUrl?(txHash: string): string | null {
    // Optional methods need careful handling during delegation
    if (getSolanaExplorerTxUrl) {
      return getSolanaExplorerTxUrl(txHash);
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
}

export default SolanaAdapter;
