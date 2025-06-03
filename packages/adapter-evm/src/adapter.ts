import type { GetAccountReturnType } from '@wagmi/core';
import { type TransactionReceipt } from 'viem';

import React from 'react';

import type {
  Connector,
  ContractAdapter,
  ContractFunction,
  ContractSchema,
  EcosystemReactUiProviderProps,
  EcosystemSpecificReactHooks,
  EcosystemWalletComponents,
  EvmNetworkConfig,
  ExecutionConfig,
  ExecutionMethodDetail,
  FieldType,
  FormFieldType,
  FunctionParameter,
  NativeConfigLoader,
  UiKitConfiguration,
} from '@openzeppelin/transaction-form-types';
import { isEvmNetworkConfig } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { EvmWalletUiRoot } from './wallet/components/EvmWalletUiRoot';
import { evmUiKitManager } from './wallet/evmUiKitManager';
import { evmFacadeHooks } from './wallet/hooks/facade-hooks';
import { loadInitialConfigFromAppService } from './wallet/hooks/useUiKitConfig';
import type { WagmiWalletImplementation } from './wallet/implementation/wagmi-implementation';
import { resolveFullUiKitConfiguration } from './wallet/services/configResolutionService';
import { getResolvedWalletComponents } from './wallet/utils';
import {
  connectAndEnsureCorrectNetwork,
  disconnectEvmWallet,
  evmSupportsWalletConnection,
  getEvmAvailableConnectors,
  getEvmWalletConnectionStatus,
} from './wallet/utils/connection';
import {
  getEvmWalletImplementation,
  getInitializedEvmWalletImplementation,
} from './wallet/utils/walletImplementationManager';

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
import { isEvmViewFunction, queryEvmViewFunction } from './query';
import {
  formatEvmTransactionData,
  signAndBroadcastEvmTransaction,
  waitForEvmTransactionConfirmation,
} from './transaction';
import { formatEvmFunctionResult } from './transform';
import type { WriteContractParameters } from './types';
import { isValidEvmAddress } from './utils';

/**
 * EVM-specific adapter implementation
 */
export class EvmAdapter implements ContractAdapter {
  readonly networkConfig: EvmNetworkConfig;
  private initialAppServiceKitName: UiKitConfiguration['kitName'];

  constructor(networkConfig: EvmNetworkConfig) {
    if (!isEvmNetworkConfig(networkConfig)) {
      throw new Error('EvmAdapter requires a valid EVM network configuration.');
    }
    this.networkConfig = networkConfig;
    logger.info(
      'EvmAdapter',
      `Adapter initialized for network: ${networkConfig.name} (ID: ${networkConfig.id})`
    );

    // Determine the initial kitName from AppConfigService at the time of adapter construction.
    // This provides a baseline kitName preference from the application's static/global configuration.
    // It defaults to 'custom' if no specific kitName is found in AppConfigService.
    // This value is stored on the instance to inform the first call to configureUiKit if no programmatic overrides are given.
    const initialGlobalConfig = loadInitialConfigFromAppService();
    this.initialAppServiceKitName =
      (initialGlobalConfig.kitName as UiKitConfiguration['kitName']) || 'custom';

    logger.info(
      'EvmAdapter:constructor',
      'Initial kitName from AppConfigService noted:',
      this.initialAppServiceKitName
    );
    // The actual EvmUiKitManager.configure call (which drives UI setup) is deferred.
    // It's typically triggered by WalletStateProvider after this adapter instance is fully initialized and provided to it,
    // ensuring that loadConfigModule (for user native configs) is available.
  }

  /**
   * @inheritdoc
   */
  async loadContract(source: string): Promise<ContractSchema> {
    return loadEvmContract(source, this.networkConfig);
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
  public formatTransactionData(
    contractSchema: ContractSchema,
    functionId: string,
    submittedInputs: Record<string, unknown>,
    fields: FormFieldType[]
  ): WriteContractParameters {
    return formatEvmTransactionData(contractSchema, functionId, submittedInputs, fields);
  }

  /**
   * @inheritdoc
   */
  async signAndBroadcast(
    transactionData: unknown,
    executionConfig?: ExecutionConfig
  ): Promise<{ txHash: string }> {
    const walletImplementation: WagmiWalletImplementation = await getEvmWalletImplementation();
    return signAndBroadcastEvmTransaction(
      transactionData as WriteContractParameters,
      walletImplementation,
      this.networkConfig.chainId,
      executionConfig
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
    const walletStatus = this.getWalletConnectionStatus();
    return validateEvmExecutionConfig(config, walletStatus);
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
    const walletImplementation = await getEvmWalletImplementation();
    return queryEvmViewFunction(
      contractAddress,
      functionId,
      this.networkConfig,
      params,
      contractSchema,
      walletImplementation,
      (src) => this.loadContract(src)
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
  public supportsWalletConnection(): boolean {
    return evmSupportsWalletConnection();
  }

  /**
   * @inheritdoc
   */
  public async getAvailableConnectors(): Promise<Connector[]> {
    return getEvmAvailableConnectors();
  }

  /**
   * @inheritdoc
   */
  public async connectWallet(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    const result = await connectAndEnsureCorrectNetwork(connectorId, this.networkConfig.chainId);

    if (result.connected && result.address) {
      return { connected: true, address: result.address };
    } else {
      return {
        connected: false,
        error: result.error || 'Connection failed for an unknown reason.',
      };
    }
  }

  /**
   * @inheritdoc
   */
  public async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    return disconnectEvmWallet();
  }

  /**
   * @inheritdoc
   */
  public getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
    const status = getEvmWalletConnectionStatus();
    return {
      isConnected: status.isConnected,
      address: status.address,
      chainId: status.chainId?.toString(),
    };
  }

  /**
   * @inheritdoc
   */
  public onWalletConnectionChange(
    callback: (account: GetAccountReturnType, prevAccount: GetAccountReturnType) => void
  ): () => void {
    const walletImplementation = getInitializedEvmWalletImplementation();
    if (!walletImplementation) {
      logger.warn(
        'EvmAdapter:onWalletConnectionChange',
        'Wallet implementation not ready. Subscription may not work.'
      );
      return () => {};
    }
    return walletImplementation.onWalletConnectionChange(callback);
  }

  /**
   * @inheritdoc
   */
  getExplorerUrl(address: string): string | null {
    return getEvmExplorerAddressUrl(address, this.networkConfig);
  }

  /**
   * @inheritdoc
   */
  getExplorerTxUrl?(txHash: string): string | null {
    if (getEvmExplorerTxUrl) {
      return getEvmExplorerTxUrl(txHash, this.networkConfig);
    }
    return null;
  }

  /**
   * @inheritdoc
   */
  async waitForTransactionConfirmation(txHash: string): Promise<{
    status: 'success' | 'error';
    receipt?: TransactionReceipt;
    error?: Error;
  }> {
    const walletImplementation = await getEvmWalletImplementation();
    return waitForEvmTransactionConfirmation(txHash, walletImplementation);
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

    // Delegate the entire configuration resolution to the service function.
    const finalFullConfig = await resolveFullUiKitConfiguration(
      programmaticOverrides,
      this.initialAppServiceKitName,
      currentAppServiceConfig,
      options
    );

    // Delegate the application of this configuration to the central EvmUiKitManager.
    await evmUiKitManager.configure(finalFullConfig);
    logger.info(
      'EvmAdapter:configureUiKit',
      'EvmUiKitManager configuration requested with final config:',
      finalFullConfig
    );
  }

  /**
   * @inheritdoc
   */
  public getEcosystemReactUiContextProvider():
    | React.ComponentType<EcosystemReactUiProviderProps>
    | undefined {
    // EvmWalletUiRoot is now the stable provider that subscribes to evmUiKitManager
    logger.info('EvmAdapter:getEcosystemReactUiContextProvider', 'Returning EvmWalletUiRoot.');
    return EvmWalletUiRoot;
  }

  /**
   * @inheritdoc
   */
  public getEcosystemReactHooks(): EcosystemSpecificReactHooks | undefined {
    // Always provide hooks for EVM adapter regardless of UI kit
    return evmFacadeHooks;
  }

  /**
   * @inheritdoc
   */
  public getEcosystemWalletComponents(): EcosystemWalletComponents | undefined {
    const currentManagerState = evmUiKitManager.getState();
    // Only attempt to resolve components if the manager has a configuration set.
    // During initial app load, currentFullUiKitConfig might be null until the first configure call completes.
    if (!currentManagerState.currentFullUiKitConfig) {
      logger.debug(
        // Changed from warn to debug, as this can be normal during init sequence
        'EvmAdapter:getEcosystemWalletComponents',
        'No UI kit configuration available in manager yet. Returning undefined components.'
      );
      return undefined; // Explicitly return undefined if manager isn't configured yet
    }
    // If manager has a config, use that for resolving components.
    return getResolvedWalletComponents(currentManagerState.currentFullUiKitConfig);
  }
}

// Also export as default to ensure compatibility with various import styles
export default EvmAdapter;
