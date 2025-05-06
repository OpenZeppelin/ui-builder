import type { GetAccountReturnType } from '@wagmi/core';
import { type TransactionReceipt } from 'viem';

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

import { WagmiWalletImplementation } from './wallet-connect/wagmi-implementation';

import { loadEvmContract } from './abi';
import {
  getEvmExplorerAddressUrl,
  getEvmExplorerTxUrl,
  getEvmSupportedExecutionMethods,
  validateEvmExecutionConfig,
} from './configuration';
import {
  generateEvmDefaultField,
  getEvmCompatibleFieldTypes,
  mapEvmParamTypeToFieldType,
} from './mapping';
import { loadEvmMockContract } from './mocking';
import { isEvmViewFunction, queryEvmViewFunction } from './query';
import {
  formatEvmTransactionData,
  signAndBroadcastEvmTransaction,
  waitForEvmTransactionConfirmation,
} from './transaction';
import { formatEvmFunctionResult } from './transform';
import type { WriteContractParameters } from './types';
import { isValidEvmAddress } from './utils';
import {
  connectEvmWallet,
  disconnectEvmWallet,
  evmSupportsWalletConnection,
  getEvmAvailableConnectors,
  getEvmWalletConnectionStatus,
  onEvmWalletConnectionChange,
} from './wallet';

/**
 * EVM-specific adapter implementation
 */
export class EvmAdapter implements ContractAdapter {
  /**
   * Private implementation of wallet connection using Wagmi
   */
  private walletImplementation: WagmiWalletImplementation;

  constructor() {
    // Initialize the Wagmi wallet implementation
    this.walletImplementation = new WagmiWalletImplementation();
  }

  /**
   * @inheritdoc
   */
  async loadContract(source: string): Promise<ContractSchema> {
    return loadEvmContract(source);
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
  formatTransactionData(
    contractSchema: ContractSchema,
    functionId: string,
    submittedInputs: Record<string, unknown>,
    allFieldsConfig: FormFieldType[]
  ): unknown {
    // Return type is `WriteContractParameters`, but adapter method returns `unknown` for interface compatibility
    return formatEvmTransactionData(contractSchema, functionId, submittedInputs, allFieldsConfig);
  }

  /**
   * @inheritdoc
   */
  async signAndBroadcast(transactionData: unknown): Promise<{ txHash: string }> {
    // Type assertion needed as formatTransactionData returns unknown for interface compatibility
    return signAndBroadcastEvmTransaction(
      transactionData as WriteContractParameters,
      this.walletImplementation
    );
  }

  /**
   * @inheritdoc
   */
  getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'] {
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
    return validateEvmExecutionConfig(config);
  }

  /**
   * @inheritdoc
   */
  async loadMockContract(mockId?: string): Promise<ContractSchema> {
    return loadEvmMockContract(mockId);
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
    return queryEvmViewFunction(
      contractAddress,
      functionId,
      params,
      contractSchema,
      this.walletImplementation,
      this.loadContract // Pass the adapter's loadContract method
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
  supportsWalletConnection(): boolean {
    return evmSupportsWalletConnection();
  }

  /**
   * @inheritdoc
   */
  async getAvailableConnectors(): Promise<Connector[]> {
    return getEvmAvailableConnectors(this.walletImplementation);
  }

  /**
   * @inheritdoc
   */
  async connectWallet(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    return connectEvmWallet(connectorId, this.walletImplementation);
  }

  /**
   * @inheritdoc
   */
  async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    return disconnectEvmWallet(this.walletImplementation);
  }

  /**
   * @inheritdoc
   */
  getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
    return getEvmWalletConnectionStatus(this.walletImplementation);
  }

  /**
   * @inheritdoc
   */
  onWalletConnectionChange(
    callback: (account: GetAccountReturnType, prevAccount: GetAccountReturnType) => void
  ): () => void {
    return onEvmWalletConnectionChange(this.walletImplementation, callback);
  }

  /**
   * @inheritdoc
   */
  getExplorerUrl(address: string, _chainId?: string): string | null {
    return getEvmExplorerAddressUrl(address, _chainId);
  }

  /**
   * @inheritdoc
   */
  getExplorerTxUrl?(txHash: string): string | null {
    return getEvmExplorerTxUrl(txHash);
  }

  /**
   * @inheritdoc
   */
  async waitForTransactionConfirmation(txHash: string): Promise<{
    status: 'success' | 'error';
    receipt?: TransactionReceipt;
    error?: Error;
  }> {
    return waitForEvmTransactionConfirmation(txHash, this.walletImplementation);
  }
}

// Also export as default to ensure compatibility with various import styles
export default EvmAdapter;
