import type {
  AdapterExportBootstrap,
  AdapterExportContext,
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
  FunctionDecorationsMap,
  FunctionParameter,
  MidnightNetworkConfig,
  RelayerDetails,
  RelayerDetailsRich,
  TransactionStatusUpdate,
  UiKitConfiguration,
  UserRpcProviderConfig,
} from '@openzeppelin/ui-builder-types';
import { isMidnightNetworkConfig } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { FunctionDecorationsService } from './analysis/function-decorations-service';
import { getMidnightExportBootstrapFiles } from './export/bootstrap';
import { prepareArtifactsForFunction as prepareArtifacts } from './utils/artifact-preparation';
import { CustomAccountDisplay } from './wallet/components/account/AccountDisplay';
import { ConnectButton } from './wallet/components/connect/ConnectButton';
import { MidnightWalletUiRoot } from './wallet/components/MidnightWalletUiRoot';
import * as connection from './wallet/connection';
import { midnightFacadeHooks } from './wallet/hooks/facade-hooks';

import { testMidnightRpcConnection, validateMidnightRpcEndpoint } from './configuration';
import { loadMidnightContract, loadMidnightContractWithMetadata } from './contract';
import { formatMidnightTransactionData } from './transaction';
import { formatMidnightFunctionResult } from './transform';
import type { MidnightContractArtifacts } from './types';
import { validateAndConvertMidnightArtifacts } from './utils';
import { isValidAddress } from './validation';

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
  private artifacts: MidnightContractArtifacts | null = null;
  private functionDecorationsService: FunctionDecorationsService;

  constructor(networkConfig: MidnightNetworkConfig) {
    if (!isMidnightNetworkConfig(networkConfig)) {
      throw new Error('MidnightAdapter requires a valid Midnight network configuration.');
    }
    this.networkConfig = networkConfig;
    this.initialAppServiceKitName = 'custom';
    this.functionDecorationsService = new FunctionDecorationsService();
    logger.info(
      'MidnightAdapter',
      `Adapter initialized for network: ${networkConfig.name} (ID: ${networkConfig.id})`
    );
  }

  public getEcosystemReactUiContextProvider(): React.FC<EcosystemReactUiProviderProps> {
    return MidnightWalletUiRoot;
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
    const status = connection.getMidnightWalletConnectionStatus();
    return {
      isConnected: !!status.isConnected,
      address: status.address,
      chainId: this.networkConfig.id,
    };
  }

  public getContractDefinitionInputs(): FormFieldType[] {
    return [
      {
        id: 'contractAddress',
        name: 'contractAddress',
        label: 'Contract Address',
        type: 'blockchain-address',
        validation: { required: true },
        placeholder: '0200326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6',
        helperText:
          'Enter the deployed Midnight contract address (68-character hex string starting with 0200).',
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
        id: 'contractArtifactsZip',
        name: 'contractArtifactsZip',
        label: 'Contract Build Artifacts (ZIP)',
        type: 'file-upload',
        validation: { required: true },
        accept: '.zip',
        helperText:
          "Select a ZIP file containing your compiled Midnight contract artifacts. The ZIP should include: contract module (.cjs), TypeScript definitions (.d.ts), witness code (witnesses.js), and ZK proof files (.prover, .verifier, .bzkir). Typically created by zipping your project's dist/ directory after running `compact build`. All processing happens locally in your browser.",
        convertToBase64: true, // Convert to base64 for storage
        maxSize: 10 * 1024 * 1024, // 10MB limit
      },
    ];
  }

  public async loadContract(source: string | Record<string, unknown>): Promise<ContractSchema> {
    const artifacts = await validateAndConvertMidnightArtifacts(source);

    this.artifacts = artifacts;
    logger.info('MidnightAdapter', 'Contract artifacts stored.', this.artifacts);

    const result = await loadMidnightContract(artifacts, this.networkConfig);
    return result.schema;
  }

  public async loadContractWithMetadata(source: string | Record<string, unknown>): Promise<{
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
    proxyInfo?: undefined;
    contractDefinitionArtifacts?: Record<string, unknown>;
  }> {
    const artifacts = await validateAndConvertMidnightArtifacts(source);

    this.artifacts = artifacts;
    logger.info('MidnightAdapter', 'Contract artifacts stored.', this.artifacts);

    const result = await loadMidnightContractWithMetadata(artifacts, this.networkConfig);

    return {
      schema: result.schema,
      source: result.source,
      contractDefinitionOriginal: result.contractDefinitionOriginal,
      metadata: result.metadata,
      contractDefinitionArtifacts: result.contractDefinitionArtifacts,
      proxyInfo: result.proxyInfo,
    };
  }

  public getWritableFunctions(contractSchema: ContractSchema): ContractFunction[] {
    return contractSchema.functions.filter((fn: ContractFunction): boolean => fn.modifiesState);
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
    contractSchema: ContractSchema,
    functionId: string,
    submittedInputs: Record<string, unknown>,
    fields: FormFieldType[]
  ): unknown {
    return formatMidnightTransactionData(
      contractSchema,
      functionId,
      submittedInputs,
      fields,
      this.artifacts
    );
  }

  public async signAndBroadcast(
    transactionData: unknown,
    executionConfig: ExecutionConfig,
    onStatusChange: (status: string, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string,
    runtimeSecret?: string
  ): Promise<{ txHash: string }> {
    // Orchestrate transaction execution by delegating to the transaction module
    const { signAndBroadcastMidnightTransaction } = await import('./transaction');

    return signAndBroadcastMidnightTransaction(
      transactionData,
      executionConfig,
      this.networkConfig,
      this.artifacts,
      onStatusChange,
      runtimeApiKey,
      runtimeSecret // Use runtimeSecret only for organizer key (Midnight doesn't support relayers yet)
    );
  }

  public async getFunctionDecorations(): Promise<FunctionDecorationsMap | undefined> {
    if (!this.artifacts) {
      logger.debug('MidnightAdapter', 'No artifacts loaded; skipping function decorations.');
      return undefined;
    }

    return this.functionDecorationsService.analyzeFunctionDecorations(this.artifacts);
  }

  public getRuntimeFieldBinding() {
    return {
      key: 'organizerSecret',
      label: 'Organizer Secret',
      helperText: 'Hex-encoded organizer secret; used for organizer-only circuits and never stored',
    };
  }

  public isViewFunction(functionDetails: ContractFunction): boolean {
    return !functionDetails.modifiesState;
  }

  public async queryViewFunction(
    contractAddress: string,
    functionId: string,
    params: unknown[],
    contractSchema?: ContractSchema
  ): Promise<unknown> {
    // Query Midnight contracts using the indexer public data provider
    const { queryMidnightViewFunction } = await import('./query');
    return queryMidnightViewFunction(
      contractAddress,
      functionId,
      this.networkConfig,
      params,
      contractSchema,
      this.artifacts?.contractModule // Pass the contract module for ledger() access
    );
  }

  public formatFunctionResult(decodedValue: unknown, functionDetails: ContractFunction): string {
    return formatMidnightFunctionResult(decodedValue, functionDetails);
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

  public isValidAddress(address: string): boolean {
    // Validates both contract addresses (68-char hex) and user addresses (Bech32m)
    return isValidAddress(address);
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
    logger.warn('MidnightAdapter', 'getRelayers is not implemented for the Midnight adapter yet.');
    return Promise.resolve([]);
  }

  public async getRelayer(
    _serviceUrl: string,
    _accessToken: string,
    _relayerId: string
  ): Promise<RelayerDetailsRich> {
    logger.warn('MidnightAdapter', 'getRelayer is not implemented for the Midnight adapter yet.');
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

  /**
   * @inheritdoc
   */
  public async getExportBootstrapFiles(
    context: AdapterExportContext
  ): Promise<AdapterExportBootstrap | null> {
    return getMidnightExportBootstrapFiles(context);
  }

  /**
   * @inheritdoc
   */
  public getArtifactPersistencePolicy():
    | {
        mode: 'immediate' | 'deferredUntilFunctionSelected';
        sizeThresholdBytes?: number;
      }
    | undefined {
    return {
      mode: 'deferredUntilFunctionSelected',
      sizeThresholdBytes: 15 * 1024 * 1024, // 15MB
    };
  }

  /**
   * @inheritdoc
   */
  public async prepareArtifactsForFunction(args: {
    functionId: string;
    currentArtifacts: Record<string, unknown>;
    definitionOriginal?: string | null;
  }): Promise<{
    persistableArtifacts?: Record<string, unknown>;
    publicAssets?: Record<string, Uint8Array | Blob>;
    bootstrapSource?: Record<string, unknown>;
  }> {
    return prepareArtifacts(args.functionId, args.currentArtifacts);
  }
}

// Also export as default
export default MidnightAdapter;
