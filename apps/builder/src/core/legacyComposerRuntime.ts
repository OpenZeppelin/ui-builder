import type {
  AddressingCapability,
  ComposerEcosystemRuntime,
  ContractLoadingCapability,
  ExecutionCapability,
  ExplorerCapability,
  NetworkCatalogCapability,
  NetworkConfig,
  QueryCapability,
  RelayerCapability,
  SchemaCapability,
  TypeMappingCapability,
  UiKitCapability,
  WalletCapability,
} from '@openzeppelin/ui-types';

type LegacyContractLoadingAdapter = Pick<
  ContractLoadingCapability,
  | 'loadContract'
  | 'loadContractWithMetadata'
  | 'getContractDefinitionInputs'
  | 'getSupportedContractDefinitionProviders'
  | 'compareContractDefinitions'
  | 'validateContractDefinition'
  | 'hashContractDefinition'
  | 'getArtifactPersistencePolicy'
  | 'prepareArtifactsForFunction'
>;

type LegacyTypeMappingAdapter = Pick<
  TypeMappingCapability,
  | 'mapParameterTypeToFieldType'
  | 'getCompatibleFieldTypes'
  | 'generateDefaultField'
  | 'getTypeMappingInfo'
  | 'getRuntimeFieldBinding'
>;

type LegacyQueryAdapter = Pick<
  QueryCapability,
  'queryViewFunction' | 'formatFunctionResult' | 'getCurrentBlock'
>;

type LegacySchemaAdapter = Pick<
  SchemaCapability,
  | 'getWritableFunctions'
  | 'isViewFunction'
  | 'filterAutoQueryableFunctions'
  | 'getFunctionDecorations'
>;

type LegacyExecutionAdapter = Pick<
  ExecutionCapability,
  | 'formatTransactionData'
  | 'signAndBroadcast'
  | 'getSupportedExecutionMethods'
  | 'validateExecutionConfig'
  | 'waitForTransactionConfirmation'
>;

type LegacyRelayerAdapter = Pick<
  RelayerCapability,
  | 'getRelayers'
  | 'getRelayer'
  | 'getNetworkServiceForms'
  | 'getDefaultServiceConfig'
  | 'validateNetworkServiceConfig'
  | 'testNetworkServiceConnection'
  | 'validateRpcEndpoint'
  | 'testRpcConnection'
  | 'validateExplorerConfig'
  | 'testExplorerConnection'
>;

type LegacyWalletAdapter = Pick<
  WalletCapability,
  | 'supportsWalletConnection'
  | 'getAvailableConnectors'
  | 'connectWallet'
  | 'disconnectWallet'
  | 'getWalletConnectionStatus'
  | 'onWalletConnectionChange'
>;

type LegacyUiKitAdapter = Pick<
  UiKitCapability,
  | 'configureUiKit'
  | 'getEcosystemReactUiContextProvider'
  | 'getEcosystemReactHooks'
  | 'getEcosystemWalletComponents'
  | 'getAvailableUiKits'
  | 'getRelayerOptionsComponent'
  | 'getExportableWalletConfigFiles'
>;

type LegacyUiLabelsAdapter = {
  getUiLabels: () => Record<string, string> | undefined;
};

export interface LegacyComposerAdapter
  extends AddressingCapability,
    ExplorerCapability,
    LegacyContractLoadingAdapter,
    LegacyTypeMappingAdapter,
    LegacySchemaAdapter,
    LegacyQueryAdapter,
    LegacyExecutionAdapter,
    LegacyRelayerAdapter,
    LegacyWalletAdapter,
    LegacyUiKitAdapter,
    LegacyUiLabelsAdapter {
  readonly networkConfig: NetworkConfig;
  dispose?: () => void;
}

function bindMethod<T extends object, TMethod extends keyof T>(target: T, method: TMethod) {
  const value = target[method];

  if (typeof value !== 'function') {
    throw new Error(`Expected "${String(method)}" to be a function on the legacy adapter.`);
  }

  return value.bind(target) as T[TMethod];
}

function bindOptionalMethod<T extends object, TMethod extends keyof T>(target: T, method: TMethod) {
  const value = target[method];
  return typeof value === 'function' ? (value.bind(target) as T[TMethod]) : undefined;
}

export function createLegacyComposerRuntime(
  adapter: LegacyComposerAdapter,
  networks: NetworkConfig[]
): ComposerEcosystemRuntime {
  const dispose = () => {
    adapter.dispose?.();
  };

  return {
    networkConfig: adapter.networkConfig,
    addressing: {
      isValidAddress: bindMethod(adapter, 'isValidAddress'),
    },
    explorer: {
      getExplorerUrl: bindMethod(adapter, 'getExplorerUrl'),
      getExplorerTxUrl: bindOptionalMethod(adapter, 'getExplorerTxUrl'),
    },
    networkCatalog: {
      getNetworks: () => networks,
    } satisfies NetworkCatalogCapability,
    uiLabels: {
      getUiLabels: () => adapter.getUiLabels() ?? {},
    },
    contractLoading: {
      networkConfig: adapter.networkConfig,
      dispose,
      loadContract: bindMethod(adapter, 'loadContract'),
      loadContractWithMetadata: bindOptionalMethod(adapter, 'loadContractWithMetadata'),
      getContractDefinitionInputs: bindMethod(adapter, 'getContractDefinitionInputs'),
      getSupportedContractDefinitionProviders: bindOptionalMethod(
        adapter,
        'getSupportedContractDefinitionProviders'
      ),
      compareContractDefinitions: bindOptionalMethod(adapter, 'compareContractDefinitions'),
      validateContractDefinition: bindOptionalMethod(adapter, 'validateContractDefinition'),
      hashContractDefinition: bindOptionalMethod(adapter, 'hashContractDefinition'),
      getArtifactPersistencePolicy: bindOptionalMethod(adapter, 'getArtifactPersistencePolicy'),
      prepareArtifactsForFunction: bindOptionalMethod(adapter, 'prepareArtifactsForFunction'),
    },
    schema: {
      networkConfig: adapter.networkConfig,
      dispose,
      getWritableFunctions: bindMethod(adapter, 'getWritableFunctions'),
      isViewFunction: bindMethod(adapter, 'isViewFunction'),
      filterAutoQueryableFunctions: bindOptionalMethod(adapter, 'filterAutoQueryableFunctions'),
      getFunctionDecorations: bindOptionalMethod(adapter, 'getFunctionDecorations'),
    },
    typeMapping: {
      networkConfig: adapter.networkConfig,
      dispose,
      mapParameterTypeToFieldType: bindMethod(adapter, 'mapParameterTypeToFieldType'),
      getCompatibleFieldTypes: bindMethod(adapter, 'getCompatibleFieldTypes'),
      generateDefaultField: bindMethod(adapter, 'generateDefaultField'),
      getTypeMappingInfo: bindMethod(adapter, 'getTypeMappingInfo'),
      getRuntimeFieldBinding: bindOptionalMethod(adapter, 'getRuntimeFieldBinding'),
    },
    query: {
      networkConfig: adapter.networkConfig,
      dispose,
      queryViewFunction: bindMethod(adapter, 'queryViewFunction'),
      formatFunctionResult: bindMethod(adapter, 'formatFunctionResult'),
      getCurrentBlock: bindMethod(adapter, 'getCurrentBlock'),
    },
    execution: {
      networkConfig: adapter.networkConfig,
      dispose,
      formatTransactionData: bindMethod(adapter, 'formatTransactionData'),
      signAndBroadcast: bindMethod(adapter, 'signAndBroadcast'),
      getSupportedExecutionMethods: bindMethod(adapter, 'getSupportedExecutionMethods'),
      validateExecutionConfig: bindMethod(adapter, 'validateExecutionConfig'),
      waitForTransactionConfirmation: bindOptionalMethod(adapter, 'waitForTransactionConfirmation'),
    },
    wallet: {
      networkConfig: adapter.networkConfig,
      dispose,
      supportsWalletConnection: bindMethod(adapter, 'supportsWalletConnection'),
      getAvailableConnectors: bindMethod(adapter, 'getAvailableConnectors'),
      connectWallet: bindMethod(adapter, 'connectWallet'),
      disconnectWallet: bindMethod(adapter, 'disconnectWallet'),
      getWalletConnectionStatus: bindMethod(adapter, 'getWalletConnectionStatus'),
      onWalletConnectionChange: bindOptionalMethod(adapter, 'onWalletConnectionChange'),
    },
    uiKit: {
      networkConfig: adapter.networkConfig,
      dispose,
      configureUiKit: bindOptionalMethod(adapter, 'configureUiKit'),
      getEcosystemReactUiContextProvider: bindOptionalMethod(
        adapter,
        'getEcosystemReactUiContextProvider'
      ),
      getEcosystemReactHooks: bindOptionalMethod(adapter, 'getEcosystemReactHooks'),
      getEcosystemWalletComponents: bindOptionalMethod(adapter, 'getEcosystemWalletComponents'),
      getAvailableUiKits: bindMethod(adapter, 'getAvailableUiKits'),
      getRelayerOptionsComponent: bindOptionalMethod(adapter, 'getRelayerOptionsComponent'),
      getExportableWalletConfigFiles: bindOptionalMethod(adapter, 'getExportableWalletConfigFiles'),
    },
    relayer: {
      networkConfig: adapter.networkConfig,
      dispose,
      getRelayers: bindMethod(adapter, 'getRelayers'),
      getRelayer: bindMethod(adapter, 'getRelayer'),
      getNetworkServiceForms: bindMethod(adapter, 'getNetworkServiceForms'),
      getDefaultServiceConfig: bindMethod(adapter, 'getDefaultServiceConfig'),
      validateNetworkServiceConfig: bindOptionalMethod(adapter, 'validateNetworkServiceConfig'),
      testNetworkServiceConnection: bindOptionalMethod(adapter, 'testNetworkServiceConnection'),
      validateRpcEndpoint: bindOptionalMethod(adapter, 'validateRpcEndpoint'),
      testRpcConnection: bindOptionalMethod(adapter, 'testRpcConnection'),
      validateExplorerConfig: bindOptionalMethod(adapter, 'validateExplorerConfig'),
      testExplorerConnection: bindOptionalMethod(adapter, 'testExplorerConnection'),
    },
    dispose,
  };
}
