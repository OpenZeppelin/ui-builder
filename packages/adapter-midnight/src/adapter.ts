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
  MidnightNetworkConfig,
} from '@openzeppelin/transaction-form-types';
import { isMidnightNetworkConfig } from '@openzeppelin/transaction-form-types';

// Import functions from modules
import {
  getMidnightSupportedExecutionMethods,
  validateMidnightExecutionConfig,
} from './configuration/execution';
import { getMidnightExplorerAddressUrl, getMidnightExplorerTxUrl } from './configuration/explorer';

import { loadMidnightContract } from './definition';
import {
  generateMidnightDefaultField,
  getMidnightCompatibleFieldTypes,
  mapMidnightParameterTypeToFieldType,
} from './mapping';
import { loadMidnightMockContract } from './mocking';
import { isMidnightViewFunction, queryMidnightViewFunction } from './query';
import { formatMidnightTransactionData, signAndBroadcastMidnightTransaction } from './transaction';
import { formatMidnightFunctionResult } from './transform';
import { isValidAddress as isMidnightValidAddress } from './utils';
import {
  connectMidnightWallet,
  disconnectMidnightWallet,
  getMidnightAvailableConnectors,
  getMidnightWalletConnectionStatus,
  supportsMidnightWalletConnection,
} from './wallet';

/**
 * Midnight-specific adapter implementation using explicit method delegation.
 *
 * NOTE: Contains placeholder implementations for most functionalities.
 */
export class MidnightAdapter implements ContractAdapter {
  readonly networkConfig: MidnightNetworkConfig;

  constructor(networkConfig: MidnightNetworkConfig) {
    if (!isMidnightNetworkConfig(networkConfig)) {
      throw new Error('MidnightAdapter requires a valid Midnight network configuration.');
    }
    this.networkConfig = networkConfig;
    console.log(`MidnightAdapter initialized for network: ${this.networkConfig.name}`);
  }

  // --- Contract Loading --- //
  async loadContract(source: string): Promise<ContractSchema> {
    return loadMidnightContract(source);
  }
  async loadMockContract(mockId?: string): Promise<ContractSchema> {
    return loadMidnightMockContract(mockId);
  }

  getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'] {
    return contractSchema.functions.filter((fn) => fn.modifiesState);
  }

  // --- Type Mapping & Field Generation --- //
  mapParameterTypeToFieldType(parameterType: string): FieldType {
    return mapMidnightParameterTypeToFieldType(parameterType);
  }
  getCompatibleFieldTypes(parameterType: string): FieldType[] {
    return getMidnightCompatibleFieldTypes(parameterType);
  }
  generateDefaultField<T extends FieldType = FieldType>(
    parameter: FunctionParameter
  ): FormFieldType<T> {
    return generateMidnightDefaultField(parameter);
  }

  // --- Transaction Formatting & Execution --- //
  formatTransactionData(
    contractSchema: ContractSchema,
    functionId: string,
    submittedInputs: Record<string, unknown>,
    allFieldsConfig: FormFieldType[]
  ): unknown {
    return formatMidnightTransactionData(
      contractSchema,
      functionId,
      submittedInputs,
      allFieldsConfig
    );
  }
  async signAndBroadcast(transactionData: unknown): Promise<{ txHash: string }> {
    return signAndBroadcastMidnightTransaction(transactionData);
  }

  // Optional method: waitForTransactionConfirmation? is omitted as imported function is undefined

  // --- View Function Querying --- //
  isViewFunction(functionDetails: ContractFunction): boolean {
    return isMidnightViewFunction(functionDetails);
  }
  async queryViewFunction(
    contractAddress: string,
    functionId: string,
    params: unknown[] = [],
    contractSchema?: ContractSchema
  ): Promise<unknown> {
    return queryMidnightViewFunction(
      contractAddress,
      functionId,
      this.networkConfig,
      params,
      contractSchema
    );
  }
  formatFunctionResult(decodedValue: unknown, functionDetails: ContractFunction): string {
    return formatMidnightFunctionResult(decodedValue, functionDetails);
  }

  // --- Wallet Interaction --- //
  supportsWalletConnection(): boolean {
    return supportsMidnightWalletConnection();
  }
  async getAvailableConnectors(): Promise<Connector[]> {
    return getMidnightAvailableConnectors();
  }
  async connectWallet(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    return connectMidnightWallet(connectorId);
  }
  async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    return disconnectMidnightWallet();
  }
  getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
    return getMidnightWalletConnectionStatus();
  }
  // Optional method: onWalletConnectionChange? is omitted as imported function is undefined

  // --- Configuration & Metadata --- //
  async getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
    return getMidnightSupportedExecutionMethods();
  }
  async validateExecutionConfig(config: ExecutionConfig): Promise<true | string> {
    return validateMidnightExecutionConfig(config);
  }
  getExplorerUrl(address: string): string | null {
    return getMidnightExplorerAddressUrl(address, this.networkConfig);
  }
  getExplorerTxUrl?(txHash: string): string | null {
    if (getMidnightExplorerTxUrl) {
      return getMidnightExplorerTxUrl(txHash, this.networkConfig);
    }
    return null;
  }

  // --- Validation --- //
  isValidAddress(address: string): boolean {
    return isMidnightValidAddress(address);
  }
}

// Also export as default
export default MidnightAdapter;
