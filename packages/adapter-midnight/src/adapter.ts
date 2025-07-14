import {
  testMidnightRpcConnection,
  validateMidnightRpcEndpoint,
} from 'packages/adapter-midnight/src/configuration';

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
  FormValues,
  FunctionParameter,
  MidnightNetworkConfig,
  RelayerDetails,
  RelayerDetailsRich,
  UiKitConfiguration,
  UserRpcProviderConfig,
} from '@openzeppelin/transaction-form-types';
import { isMidnightNetworkConfig } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { parseMidnightContractInterface } from './utils/schema-parser';
import { MidnightWalletProvider } from './wallet/components/MidnightWalletProvider';
import { CustomAccountDisplay } from './wallet/components/account/AccountDisplay';
import { ConnectButton } from './wallet/components/connect/ConnectButton';
import * as connection from './wallet/connection';
import { midnightFacadeHooks } from './wallet/hooks/facade-hooks';

/**
 * Midnight-specific adapter.
 *
 * Implements the full ContractAdapter interface to integrate with the builder application.
 * Wallet-related functionalities are implemented, while contract-specific methods
 * are placeholders to be built out in later phases.
 */
export class MidnightAdapter implements ContractAdapter {
  readonly networkConfig: MidnightNetworkConfig;
  readonly initialAppServiceKitName: UiKitConfiguration['kitName'];
  private artifacts: FormValues = {};

  constructor(networkConfig: MidnightNetworkConfig) {
    if (!isMidnightNetworkConfig(networkConfig)) {
      throw new Error('MidnightAdapter requires a valid Midnight network configuration.');
    }
    this.networkConfig = networkConfig;
    this.initialAppServiceKitName = 'custom';
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

  public getContractDefinitionInputs(): FormFieldType[] {
    return [
      {
        id: 'contractAddress',
        name: 'contractAddress',
        label: 'Contract Address',
        type: 'text',
        validation: { required: true },
        placeholder: 'ct1q8ej4px...',
        helperText: 'Enter the deployed Midnight contract address (Bech32m format).',
      },
      {
        id: 'privateStateId',
        name: 'privateStateId',
        label: 'Private State ID',
        type: 'text',
        validation: { required: true },
        placeholder: 'my-unique-state-id',
        helperText:
          'A unique identifier for your private state instance. This ID is used to manage your personal encrypted data.',
      },
      {
        id: 'contractInterface',
        name: 'contractInterface',
        label: 'Contract Interface (.d.ts)',
        type: 'textarea',
        validation: { required: true },
        placeholder:
          'export interface MyContract {\n  myMethod(param: string): Promise<void>;\n  // ... other methods\n}',
        helperText:
          "Paste the TypeScript interface definition from your contract.d.ts file. This defines the contract's available methods.",
      },
      {
        id: 'contractModule',
        name: 'contractModule',
        label: 'Compiled Contract Module (.cjs)',
        type: 'textarea',
        validation: { required: true },
        placeholder: 'module.exports = { /* compiled contract code */ };',
        helperText:
          "Paste the compiled contract code from your contract.cjs file. This contains the contract's implementation.",
      },
      {
        id: 'witnessCode',
        name: 'witnessCode',
        label: 'Witness Functions (Optional)',
        type: 'textarea',
        validation: { required: false },
        placeholder:
          '// Define witness functions for zero-knowledge proofs\nexport const witnesses = {\n  myWitness: (ctx) => {\n    return [ctx.privateState.myField, []];\n  }\n};',
        helperText:
          'Optional: Define witness functions that generate zero-knowledge proofs for your contract interactions. These functions determine what private data is used in proofs.',
      },
    ];
  }

  public async loadContract(source: string | Record<string, unknown>): Promise<ContractSchema> {
    if (typeof source !== 'object' || source === null) {
      throw new Error('Invalid source provided to MidnightAdapter.loadContract.');
    }

    const artifacts = source as FormValues;
    const { contractAddress, contractInterface } = artifacts;

    if (typeof contractAddress !== 'string' || !this.isValidAddress(contractAddress)) {
      throw new Error('A valid contract address must be provided.');
    }
    if (typeof contractInterface !== 'string' || !contractInterface.trim()) {
      throw new Error('A contract interface must be provided.');
    }

    this.artifacts = artifacts;
    logger.info('MidnightAdapter', 'Contract artifacts stored.', this.artifacts);

    const { functions, events } = parseMidnightContractInterface(contractInterface);

    const schema: ContractSchema = {
      name: 'MyMidnightContract', // TODO: Extract from artifacts if possible
      ecosystem: 'midnight',
      address: contractAddress,
      functions,
      events,
    };

    return schema;
  }

  public getWritableFunctions(contractSchema: ContractSchema): ContractFunction[] {
    return contractSchema.functions.filter((fn) => fn.modifiesState);
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

  async getAvailableUiKits(): Promise<AvailableUiKit[]> {
    return [
      {
        id: 'custom',
        name: 'OpenZeppelin Custom',
        configFields: [],
      },
    ];
  }

  public async getRelayers(_serviceUrl: string, _accessToken: string): Promise<RelayerDetails[]> {
    console.warn('getRelayers is not implemented for the Midnight adapter yet.');
    return Promise.resolve([]);
  }

  public async getRelayer(
    _serviceUrl: string,
    _accessToken: string,
    _relayerId: string
  ): Promise<RelayerDetailsRich> {
    console.warn('getRelayer is not implemented for the Midnight adapter yet.');
    return Promise.resolve({} as RelayerDetailsRich);
  }

  /**
   * @inheritdoc
   */
  public async validateRpcEndpoint(rpcConfig: UserRpcProviderConfig): Promise<boolean> {
    // TODO: Implement Midnight-specific RPC validation when needed
    return validateMidnightRpcEndpoint(rpcConfig);
  }

  /**
   * @inheritdoc
   */
  public async testRpcConnection(rpcConfig: UserRpcProviderConfig): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    // TODO: Implement Midnight-specific RPC validation when needed
    return testMidnightRpcConnection(rpcConfig);
  }
}

// Also export as default
export default MidnightAdapter;
