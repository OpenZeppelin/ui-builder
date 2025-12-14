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
  NetworkServiceForm,
  RelayerDetails,
  RelayerDetailsRich,
  RuntimeSecretPropertyInput,
  TransactionStatusUpdate,
  UiKitConfiguration,
} from '@openzeppelin/ui-builder-types';
import { isMidnightNetworkConfig } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { FunctionDecorationsService } from './analysis/function-decorations-service';
import {
  getMidnightNetworkServiceForms,
  testMidnightNetworkServiceConnection,
  validateMidnightNetworkServiceConfig,
} from './configuration/network-services';
import { getMidnightCurrentBlock } from './configuration/rpc';
import { getMidnightExportBootstrapFiles } from './export/bootstrap';
import { generateMidnightDefaultField } from './mapping/field-generator';
import {
  getMidnightCompatibleFieldTypes,
  mapMidnightParameterTypeToFieldType,
} from './mapping/type-mapper';
import type { WriteContractParameters } from './types/transaction';
import { prepareArtifactsForFunction as prepareArtifacts } from './utils/artifact-preparation';
import { deriveIdentitySecretPropertyName } from './utils/identity-secret-derivation';
import { CustomAccountDisplay } from './wallet/components/account/AccountDisplay';
import { ConnectButton } from './wallet/components/connect/ConnectButton';
import { MidnightWalletUiRoot } from './wallet/components/MidnightWalletUiRoot';
import * as connection from './wallet/connection';
import { midnightFacadeHooks } from './wallet/hooks/facade-hooks';

import { loadMidnightContract, loadMidnightContractWithMetadata } from './contract';
import {
  executeLocallyIfPossible,
  formatMidnightTransactionData,
  signAndBroadcastMidnightTransaction,
} from './transaction';
import { formatMidnightFunctionResult } from './transform';
import type { MidnightContractArtifacts } from './types';
import { isPureCircuit, validateAndConvertMidnightArtifacts } from './utils';
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

  /**
   * @inheritdoc
   */
  public getEcosystemReactUiContextProvider(): React.FC<EcosystemReactUiProviderProps> {
    return MidnightWalletUiRoot;
  }

  /**
   * @inheritdoc
   */
  public getEcosystemReactHooks(): EcosystemSpecificReactHooks {
    return midnightFacadeHooks;
  }

  /**
   * @inheritdoc
   */
  public getEcosystemWalletComponents(): EcosystemWalletComponents {
    return {
      ConnectButton,
      AccountDisplay: CustomAccountDisplay,
    };
  }

  /**
   * @inheritdoc
   */
  public supportsWalletConnection(): boolean {
    return connection.supportsMidnightWalletConnection();
  }

  /**
   * @inheritdoc
   */
  public async getAvailableConnectors(): Promise<Connector[]> {
    return connection.getMidnightAvailableConnectors();
  }

  /**
   * @inheritdoc
   */
  public connectWallet(
    _connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    logger.warn(
      'MidnightAdapter',
      'The `connectWallet` method is not supported. Use the `ConnectButton` component from `getEcosystemWalletComponents()` instead.'
    );
    return Promise.resolve({ connected: false, error: 'Method not supported.' });
  }

  /**
   * @inheritdoc
   */
  public disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    return connection.disconnectMidnightWallet();
  }

  /**
   * @inheritdoc
   */
  public getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
    const status = connection.getMidnightWalletConnectionStatus();
    return {
      isConnected: !!status.isConnected,
      address: status.address,
      chainId: this.networkConfig.id,
    };
  }

  /**
   * @inheritdoc
   */
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

  /**
   * @inheritdoc
   */
  public async loadContract(source: string | Record<string, unknown>): Promise<ContractSchema> {
    const artifacts = await validateAndConvertMidnightArtifacts(source);

    this.artifacts = artifacts;
    logger.info('MidnightAdapter', 'Contract artifacts stored.', this.artifacts);

    const result = await loadMidnightContract(artifacts, this.networkConfig);
    return result.schema;
  }

  /**
   * @inheritdoc
   */
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

  /**
   * @inheritdoc
   */
  public getWritableFunctions(contractSchema: ContractSchema): ContractFunction[] {
    return contractSchema.functions.filter((fn: ContractFunction): boolean => fn.modifiesState);
  }

  /**
   * @inheritdoc
   */
  public mapParameterTypeToFieldType(parameterType: string): FieldType {
    return mapMidnightParameterTypeToFieldType(parameterType);
  }

  /**
   * @inheritdoc
   */
  public getCompatibleFieldTypes(parameterType: string): FieldType[] {
    return getMidnightCompatibleFieldTypes(parameterType);
  }

  /**
   * @inheritdoc
   */
  public generateDefaultField(
    parameter: FunctionParameter,
    contractSchema?: ContractSchema
  ): FormFieldType {
    return generateMidnightDefaultField(parameter, contractSchema) as FormFieldType;
  }

  /**
   * @inheritdoc
   */
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

  /**
   * @inheritdoc
   */
  public async signAndBroadcast(
    transactionData: unknown,
    executionConfig: ExecutionConfig,
    onStatusChange: (status: string, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string,
    runtimeSecret?: string
  ): Promise<{ txHash: string; result?: unknown }> {
    const txData = transactionData as WriteContractParameters;

    // Try local execution first (for functions that can execute locally)
    const localResult = await executeLocallyIfPossible(txData, this.artifacts, onStatusChange);

    if (localResult) {
      return localResult;
    }

    // Otherwise, route to blockchain transaction execution

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

  /**
   * @inheritdoc
   */
  public async getFunctionDecorations(): Promise<FunctionDecorationsMap | undefined> {
    if (!this.artifacts) {
      logger.debug('MidnightAdapter', 'No artifacts loaded; skipping function decorations.');
      return undefined;
    }

    return this.functionDecorationsService.analyzeFunctionDecorations(this.artifacts);
  }

  /**
   * @inheritdoc
   */
  public getRuntimeFieldBinding(): {
    key: string;
    label: string;
    helperText?: string;
    metadata?: Record<string, unknown>;
    propertyNameInput?: RuntimeSecretPropertyInput;
  } {
    // Attempt to derive a sane default from artifacts; keep editable
    const derivedProp =
      this.artifacts?.identitySecretKeyPropertyName ||
      deriveIdentitySecretPropertyName(this.artifacts) ||
      undefined;

    // Build helper text with proper empty string handling
    const hasDetectedProperty = derivedProp && derivedProp.length > 0;
    const generalGuidance =
      'Midnight contracts differ: the identity secret may be stored under different private-state property names. You can find this in your generated types (PrivateState in .d.ts) or in witnesses code (privateState.<prop>). The secret is injected at runtime and never persisted.';

    return {
      key: 'organizerSecret',
      label: 'Identity Secret',
      helperText:
        'Hex-encoded identity secret; used for identity-restricted circuits and never stored',
      propertyNameInput: {
        metadataKey: 'identitySecretKeyPropertyName',
        label: 'Secret Key Property Name',
        placeholder: 'e.g., secretKey',
        defaultValue: derivedProp,
        visible: true,
        helperText: [
          hasDetectedProperty &&
            `Detected "${derivedProp}" in your artifacts. Change if your contract uses a different private-state property (e.g., organizerSecretKey, secretKey, ownerKey).`,
          generalGuidance,
        ]
          .filter(Boolean)
          .join(' '),
      },
    };
  }

  /**
   * @inheritdoc
   */
  public isViewFunction(functionDetails: ContractFunction): boolean {
    // Pure circuits are not view functions - they're computational functions that run locally
    // View functions are read-only state queries (ledger properties, queries)
    return !functionDetails.modifiesState && !isPureCircuit(functionDetails);
  }

  /**
   * @inheritdoc
   */
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

  /**
   * @inheritdoc
   */
  public formatFunctionResult(decodedValue: unknown, functionDetails: ContractFunction): string {
    return formatMidnightFunctionResult(decodedValue, functionDetails);
  }

  /**
   * @inheritdoc
   */
  public async getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
    const { getMidnightSupportedExecutionMethods } = await import('./configuration/execution');
    return getMidnightSupportedExecutionMethods();
  }

  /**
   * @inheritdoc
   */
  public async validateExecutionConfig(config: ExecutionConfig): Promise<true | string> {
    const { validateMidnightExecutionConfig } = await import('./configuration/execution');
    return validateMidnightExecutionConfig(config);
  }

  /**
   * @inheritdoc
   */
  public getExplorerUrl(_address: string): string | null {
    return null; // No official explorer yet
  }

  /**
   * @inheritdoc
   */
  public getExplorerTxUrl(_txHash: string): string | null {
    return null; // No official explorer yet
  }

  /**
   * @inheritdoc
   */
  async getCurrentBlock(): Promise<number> {
    return getMidnightCurrentBlock();
  }

  /**
   * @inheritdoc
   */
  public isValidAddress(address: string): boolean {
    // Validates both contract addresses (68-char hex) and user addresses (Bech32m)
    return isValidAddress(address);
  }

  /**
   * @inheritdoc
   */
  async getAvailableUiKits(): Promise<AvailableUiKit[]> {
    return [
      {
        id: 'custom',
        name: 'OpenZeppelin Custom',
        configFields: [],
      },
    ];
  }

  /**
   * @inheritdoc
   */
  public async getRelayers(_serviceUrl: string, _accessToken: string): Promise<RelayerDetails[]> {
    logger.warn('MidnightAdapter', 'getRelayers is not implemented for the Midnight adapter yet.');
    return Promise.resolve([]);
  }

  /**
   * @inheritdoc
   */
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
  public getNetworkServiceForms(): NetworkServiceForm[] {
    return getMidnightNetworkServiceForms();
  }

  /**
   * @inheritdoc
   */
  public async validateNetworkServiceConfig(
    serviceId: string,
    values: Record<string, unknown>
  ): Promise<boolean> {
    return validateMidnightNetworkServiceConfig(serviceId, values);
  }

  /**
   * @inheritdoc
   */
  public async testNetworkServiceConnection(
    serviceId: string,
    values: Record<string, unknown>
  ): Promise<{ success: boolean; latency?: number; error?: string }> {
    return testMidnightNetworkServiceConnection(serviceId, values);
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
