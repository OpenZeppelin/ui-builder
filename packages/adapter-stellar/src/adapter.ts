import type {
  Connector,
  ContractAdapter,
  ExecutionConfig,
  ExecutionMethodDetail,
} from '@openzeppelin/transaction-form-types/adapters';
import type {
  ContractFunction,
  ContractSchema,
  FunctionParameter,
} from '@openzeppelin/transaction-form-types/contracts';
import type { FieldType, FormFieldType } from '@openzeppelin/transaction-form-types/forms';

// Import functions from modules
import {
  getStellarSupportedExecutionMethods,
  validateStellarExecutionConfig,
} from './configuration/execution';
import { getStellarExplorerAddressUrl, getStellarExplorerTxUrl } from './configuration/explorer';

import { loadStellarContract } from './definition';
import {
  generateStellarDefaultField,
  getStellarCompatibleFieldTypes,
  mapStellarParameterTypeToFieldType,
} from './mapping';
import { loadStellarMockContract } from './mocking';
import { isStellarViewFunction, queryStellarViewFunction } from './query';
import { formatStellarTransactionData, signAndBroadcastStellarTransaction } from './transaction';
import { formatStellarFunctionResult } from './transform';
import { isValidAddress as isStellarValidAddress } from './utils';
import {
  connectStellarWallet,
  disconnectStellarWallet,
  getStellarAvailableConnectors,
  getStellarWalletConnectionStatus,
  supportsStellarWalletConnection,
  // onStellarWalletConnectionChange, // Placeholder if needed later
} from './wallet';

/**
 * Stellar-specific adapter implementation using explicit method delegation.
 *
 * NOTE: Contains placeholder implementations for most functionalities.
 */
export class StellarAdapter implements ContractAdapter {
  // Optional: Constructor for initializing internal state (e.g., wallet implementations)
  // constructor() { }

  // --- Contract Loading --- //
  async loadContract(source: string): Promise<ContractSchema> {
    return loadStellarContract(source);
  }
  async loadMockContract(mockId?: string): Promise<ContractSchema> {
    return loadStellarMockContract(mockId);
  }

  getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'] {
    // Simple filtering logic, could be moved to a util if it grows
    return contractSchema.functions.filter((fn) => fn.modifiesState);
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
  formatTransactionData(
    contractSchema: ContractSchema,
    functionId: string,
    submittedInputs: Record<string, unknown>,
    allFieldsConfig: FormFieldType[]
  ): unknown {
    return formatStellarTransactionData(
      contractSchema,
      functionId,
      submittedInputs,
      allFieldsConfig
    );
  }
  async signAndBroadcast(transactionData: unknown): Promise<{ txHash: string }> {
    // Pass internal state like wallet implementation here if needed in the future
    return signAndBroadcastStellarTransaction(transactionData);
  }

  // NOTE: waitForTransactionConfirmation? is optional in the interface.
  // Since the imported function is currently undefined, we omit the method here.
  // If implemented in ./transaction/sender.ts later, add the method back:
  // async waitForTransactionConfirmation?(...) { ... }

  // --- View Function Querying --- //
  isViewFunction(functionDetails: ContractFunction): boolean {
    return isStellarViewFunction(functionDetails);
  }
  async queryViewFunction(
    contractAddress: string,
    functionId: string,
    params: unknown[] = [],
    contractSchema?: ContractSchema
  ): Promise<unknown> {
    // Pass internal state like wallet implementation or this.loadContract here if needed
    return queryStellarViewFunction(contractAddress, functionId, params, contractSchema);
  }
  formatFunctionResult(decodedValue: unknown, functionDetails: ContractFunction): string {
    return formatStellarFunctionResult(decodedValue, functionDetails);
  }

  // --- Wallet Interaction --- //
  supportsWalletConnection(): boolean {
    return supportsStellarWalletConnection();
  }
  async getAvailableConnectors(): Promise<Connector[]> {
    // Pass internal state like wallet implementation here if needed
    return getStellarAvailableConnectors();
  }
  async connectWallet(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    // Pass internal state like wallet implementation here if needed
    return connectStellarWallet(connectorId);
  }
  async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    // Pass internal state like wallet implementation here if needed
    return disconnectStellarWallet();
  }
  getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
    // Pass internal state like wallet implementation here if needed
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
  getExplorerUrl(address: string, chainId?: string): string | null {
    return getStellarExplorerAddressUrl(address, chainId);
  }

  // NOTE: getExplorerTxUrl? is optional in the interface.
  // Since the imported function exists, we can implement it.
  // However, if getStellarExplorerTxUrl were undefined in its module,
  // we would omit this method definition.
  getExplorerTxUrl?(txHash: string): string | null {
    // Check still needed in case the function exists but could return null/undefined
    if (getStellarExplorerTxUrl) {
      return getStellarExplorerTxUrl(txHash);
    }
    return null;
  }

  // --- Validation --- //
  isValidAddress(address: string): boolean {
    return isStellarValidAddress(address);
  }
}

// Also export as default to ensure compatibility with various import styles
export default StellarAdapter;
