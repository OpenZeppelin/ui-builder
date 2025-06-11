import type {
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
  MidnightNetworkConfig,
} from '@openzeppelin/transaction-form-types';
import { isMidnightNetworkConfig } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

// Import functions from modules

import { MidnightWalletProvider } from './wallet/components/MidnightWalletProvider';
import { CustomAccountDisplay } from './wallet/components/account/AccountDisplay';
import { ConnectButton } from './wallet/components/connect/ConnectButton';
import * as connection from './wallet/connection';
import { midnightFacadeHooks } from './wallet/hooks/facade-hooks';

/**
 * Midnight-specific adapter.
 *
 * Implements the full ContractAdapter interface to integrate with the core application.
 * Wallet-related functionalities are implemented, while contract-specific methods
 * are placeholders to be built out in later phases.
 */
export class MidnightAdapter implements ContractAdapter {
  readonly networkConfig: MidnightNetworkConfig;

  constructor(networkConfig: MidnightNetworkConfig) {
    if (!isMidnightNetworkConfig(networkConfig)) {
      throw new Error('MidnightAdapter requires a valid Midnight network configuration.');
    }
    this.networkConfig = networkConfig;
    logger.info(
      'MidnightAdapter',
      `Adapter initialized for network: ${networkConfig.name} (ID: ${networkConfig.id})`
    );
  }

  public getEcosystemReactUiContextProvider(): React.FC<EcosystemReactUiProviderProps> {
    return MidnightWalletProvider;
  }

  public getEcosystemReactHooks(): EcosystemSpecificReactHooks {
    return midnightFacadeHooks;
  }

  public getEcosystemWalletComponents(): EcosystemWalletComponents {
    return {
      ConnectButton,
      AccountDisplay: CustomAccountDisplay,
    };
  }

  public supportsWalletConnection(): boolean {
    return connection.supportsMidnightWalletConnection();
  }

  public async getAvailableConnectors(): Promise<Connector[]> {
    return connection.getMidnightAvailableConnectors();
  }

  public connectWallet(
    _connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    logger.warn(
      'MidnightAdapter',
      'The `connectWallet` method is not supported. Use the `ConnectButton` component from `getEcosystemWalletComponents()` instead.'
    );
    return Promise.resolve({ connected: false, error: 'Method not supported.' });
  }

  public disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    return connection.disconnectMidnightWallet();
  }

  public getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
    // This method is required by the ContractAdapter interface.
    // In our React-based UI, the connection status is managed reactively by the
    // MidnightWalletProvider. This function provides a non-reactive, one-time
    // status check, which is not the source of truth for the UI components.
    return {
      isConnected: false,
      address: undefined,
      chainId: this.networkConfig.id,
    };
  }

  // --- Placeholder Implementations ---

  public async loadContract(_source: string): Promise<ContractSchema> {
    throw new Error('loadContract not implemented for MidnightAdapter.');
  }

  public getWritableFunctions(contractSchema: ContractSchema): ContractFunction[] {
    return contractSchema.functions.filter((fn) => !fn.modifiesState);
  }

  public mapParameterTypeToFieldType(_parameterType: string): FieldType {
    return 'text';
  }

  public getCompatibleFieldTypes(_parameterType: string): FieldType[] {
    return ['text'];
  }

  public generateDefaultField(parameter: FunctionParameter): FormFieldType {
    return {
      id: parameter.name,
      name: parameter.name,
      label: parameter.name,
      type: this.mapParameterTypeToFieldType(parameter.type),
      validation: {},
    };
  }

  public formatTransactionData(
    _contractSchema: ContractSchema,
    _functionId: string,
    _submittedInputs: Record<string, unknown>,
    _fields: FormFieldType[]
  ): unknown {
    throw new Error('formatTransactionData not implemented for MidnightAdapter.');
  }

  public async signAndBroadcast(
    _transactionData: unknown,
    _executionConfig?: ExecutionConfig
  ): Promise<{ txHash: string }> {
    throw new Error('signAndBroadcast not implemented for MidnightAdapter.');
  }

  public isViewFunction(functionDetails: ContractFunction): boolean {
    return !functionDetails.modifiesState;
  }

  public async queryViewFunction(
    _contractAddress: string,
    _functionId: string,
    _params: unknown[],
    _contractSchema?: ContractSchema
  ): Promise<unknown> {
    throw new Error('queryViewFunction not implemented for MidnightAdapter.');
  }

  public formatFunctionResult(decodedValue: unknown): string {
    return JSON.stringify(decodedValue, null, 2);
  }

  public async getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
    return []; // Placeholder
  }

  public async validateExecutionConfig(_config: ExecutionConfig): Promise<true | string> {
    return true; // No config to validate yet
  }

  public getExplorerUrl(_address: string): string | null {
    return null; // No official explorer yet
  }

  public getExplorerTxUrl(_txHash: string): string | null {
    return null; // No official explorer yet
  }

  public isValidAddress(_address: string): boolean {
    // Placeholder - add real Bech32m validation later
    return true;
  }
}

// Also export as default
export default MidnightAdapter;
