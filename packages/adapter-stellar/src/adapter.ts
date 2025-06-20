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
  StellarNetworkConfig,
} from '@openzeppelin/transaction-form-types';
import { isStellarNetworkConfig } from '@openzeppelin/transaction-form-types';

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
  readonly networkConfig: StellarNetworkConfig;

  constructor(networkConfig: StellarNetworkConfig) {
    if (!isStellarNetworkConfig(networkConfig)) {
      throw new Error('StellarAdapter requires a valid Stellar network configuration.');
    }
    this.networkConfig = networkConfig;
    console.log(`StellarAdapter initialized for network: ${this.networkConfig.name}`);
  }

  // --- Contract Loading --- //
  async loadContract(source: string): Promise<ContractSchema> {
    return loadStellarContract(source);
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
  isValidAddress(address: string): boolean {
    return isStellarValidAddress(address);
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
}

// Also export as default to ensure compatibility with various import styles
export default StellarAdapter;
