import type {
  AddressingCapability,
  ComposerEcosystemRuntime,
  ContractLoadingCapability,
  ExecutionCapability,
  ExplorerCapability,
  NetworkCatalogCapability,
  QueryCapability,
  RelayerCapability,
  SchemaCapability,
  TypeMappingCapability,
  UiKitCapability,
  UiLabelsCapability,
  WalletCapability,
} from '@openzeppelin/ui-types';

export type BuilderRuntime = ComposerEcosystemRuntime;

export type BuilderAdapter = BuilderRuntime & {
  isValidAddress: AddressingCapability['isValidAddress'];
  getExplorerUrl: ExplorerCapability['getExplorerUrl'];
  getExplorerTxUrl?: ExplorerCapability['getExplorerTxUrl'];
  getNetworks: NetworkCatalogCapability['getNetworks'];
  getUiLabels: UiLabelsCapability['getUiLabels'];
  loadContract: ContractLoadingCapability['loadContract'];
  loadContractWithMetadata?: ContractLoadingCapability['loadContractWithMetadata'];
  getContractDefinitionInputs: ContractLoadingCapability['getContractDefinitionInputs'];
  getSupportedContractDefinitionProviders?: ContractLoadingCapability['getSupportedContractDefinitionProviders'];
  compareContractDefinitions?: ContractLoadingCapability['compareContractDefinitions'];
  validateContractDefinition?: ContractLoadingCapability['validateContractDefinition'];
  hashContractDefinition?: ContractLoadingCapability['hashContractDefinition'];
  getArtifactPersistencePolicy?: ContractLoadingCapability['getArtifactPersistencePolicy'];
  prepareArtifactsForFunction?: ContractLoadingCapability['prepareArtifactsForFunction'];
  getWritableFunctions: SchemaCapability['getWritableFunctions'];
  isViewFunction: SchemaCapability['isViewFunction'];
  filterAutoQueryableFunctions?: SchemaCapability['filterAutoQueryableFunctions'];
  getFunctionDecorations?: SchemaCapability['getFunctionDecorations'];
  mapParameterTypeToFieldType: TypeMappingCapability['mapParameterTypeToFieldType'];
  getCompatibleFieldTypes: TypeMappingCapability['getCompatibleFieldTypes'];
  generateDefaultField: TypeMappingCapability['generateDefaultField'];
  getTypeMappingInfo: TypeMappingCapability['getTypeMappingInfo'];
  getRuntimeFieldBinding?: TypeMappingCapability['getRuntimeFieldBinding'];
  queryViewFunction: QueryCapability['queryViewFunction'];
  formatFunctionResult: QueryCapability['formatFunctionResult'];
  getCurrentBlock: QueryCapability['getCurrentBlock'];
  formatTransactionData: ExecutionCapability['formatTransactionData'];
  signAndBroadcast: ExecutionCapability['signAndBroadcast'];
  waitForTransactionConfirmation?: ExecutionCapability['waitForTransactionConfirmation'];
  getSupportedExecutionMethods: ExecutionCapability['getSupportedExecutionMethods'];
  validateExecutionConfig: ExecutionCapability['validateExecutionConfig'];
  supportsWalletConnection: WalletCapability['supportsWalletConnection'];
  getAvailableConnectors: WalletCapability['getAvailableConnectors'];
  connectWallet: WalletCapability['connectWallet'];
  disconnectWallet: WalletCapability['disconnectWallet'];
  getWalletConnectionStatus: WalletCapability['getWalletConnectionStatus'];
  onWalletConnectionChange: WalletCapability['onWalletConnectionChange'];
  getAvailableUiKits: UiKitCapability['getAvailableUiKits'];
  configureUiKit: UiKitCapability['configureUiKit'];
  getEcosystemReactUiContextProvider?: UiKitCapability['getEcosystemReactUiContextProvider'];
  getEcosystemReactHooks?: UiKitCapability['getEcosystemReactHooks'];
  getEcosystemWalletComponents?: UiKitCapability['getEcosystemWalletComponents'];
  getRelayerOptionsComponent?: UiKitCapability['getRelayerOptionsComponent'];
  getExportableWalletConfigFiles?: UiKitCapability['getExportableWalletConfigFiles'];
  getRelayers: RelayerCapability['getRelayers'];
  getRelayer: RelayerCapability['getRelayer'];
  getNetworkServiceForms: RelayerCapability['getNetworkServiceForms'];
  getDefaultServiceConfig: RelayerCapability['getDefaultServiceConfig'];
  validateNetworkServiceConfig?: RelayerCapability['validateNetworkServiceConfig'];
  testNetworkServiceConnection?: RelayerCapability['testNetworkServiceConnection'];
  validateRpcEndpoint?: RelayerCapability['validateRpcEndpoint'];
  testRpcConnection?: RelayerCapability['testRpcConnection'];
  validateExplorerConfig?: RelayerCapability['validateExplorerConfig'];
  testExplorerConnection?: RelayerCapability['testExplorerConnection'];
};

export function toBuilderAdapter(runtime: BuilderRuntime | null): BuilderAdapter | null {
  if (!runtime) {
    return null;
  }

  const {
    addressing,
    explorer,
    networkCatalog,
    uiLabels,
    contractLoading,
    schema,
    typeMapping,
    query,
    execution,
    wallet,
    uiKit,
    relayer,
  } = runtime;

  return {
    ...runtime,
    isValidAddress: addressing.isValidAddress.bind(addressing),
    getExplorerUrl: explorer.getExplorerUrl.bind(explorer),
    getExplorerTxUrl: explorer.getExplorerTxUrl?.bind(explorer),
    getNetworks: networkCatalog.getNetworks.bind(networkCatalog),
    getUiLabels: uiLabels.getUiLabels.bind(uiLabels),
    loadContract: contractLoading.loadContract.bind(contractLoading),
    loadContractWithMetadata: contractLoading.loadContractWithMetadata?.bind(contractLoading),
    getContractDefinitionInputs: contractLoading.getContractDefinitionInputs.bind(contractLoading),
    getSupportedContractDefinitionProviders:
      contractLoading.getSupportedContractDefinitionProviders?.bind(contractLoading),
    compareContractDefinitions: contractLoading.compareContractDefinitions?.bind(contractLoading),
    validateContractDefinition: contractLoading.validateContractDefinition?.bind(contractLoading),
    hashContractDefinition: contractLoading.hashContractDefinition?.bind(contractLoading),
    getArtifactPersistencePolicy:
      contractLoading.getArtifactPersistencePolicy?.bind(contractLoading),
    prepareArtifactsForFunction: contractLoading.prepareArtifactsForFunction?.bind(contractLoading),
    getWritableFunctions: schema.getWritableFunctions.bind(schema),
    isViewFunction: schema.isViewFunction.bind(schema),
    filterAutoQueryableFunctions: schema.filterAutoQueryableFunctions?.bind(schema),
    getFunctionDecorations: schema.getFunctionDecorations?.bind(schema),
    mapParameterTypeToFieldType: typeMapping.mapParameterTypeToFieldType.bind(typeMapping),
    getCompatibleFieldTypes: typeMapping.getCompatibleFieldTypes.bind(typeMapping),
    generateDefaultField: typeMapping.generateDefaultField.bind(typeMapping),
    getTypeMappingInfo: typeMapping.getTypeMappingInfo.bind(typeMapping),
    getRuntimeFieldBinding: typeMapping.getRuntimeFieldBinding?.bind(typeMapping),
    queryViewFunction: query.queryViewFunction.bind(query),
    formatFunctionResult: query.formatFunctionResult.bind(query),
    getCurrentBlock: query.getCurrentBlock.bind(query),
    formatTransactionData: execution.formatTransactionData.bind(execution),
    signAndBroadcast: execution.signAndBroadcast.bind(execution),
    waitForTransactionConfirmation: execution.waitForTransactionConfirmation?.bind(execution),
    getSupportedExecutionMethods: execution.getSupportedExecutionMethods.bind(execution),
    validateExecutionConfig: execution.validateExecutionConfig.bind(execution),
    supportsWalletConnection: wallet.supportsWalletConnection.bind(wallet),
    getAvailableConnectors: wallet.getAvailableConnectors.bind(wallet),
    connectWallet: wallet.connectWallet.bind(wallet),
    disconnectWallet: wallet.disconnectWallet.bind(wallet),
    getWalletConnectionStatus: wallet.getWalletConnectionStatus.bind(wallet),
    onWalletConnectionChange: wallet.onWalletConnectionChange?.bind(wallet),
    getAvailableUiKits: uiKit.getAvailableUiKits.bind(uiKit),
    configureUiKit: uiKit.configureUiKit?.bind(uiKit),
    getEcosystemReactUiContextProvider: uiKit.getEcosystemReactUiContextProvider?.bind(uiKit),
    getEcosystemReactHooks: uiKit.getEcosystemReactHooks?.bind(uiKit),
    getEcosystemWalletComponents: uiKit.getEcosystemWalletComponents?.bind(uiKit),
    getRelayerOptionsComponent: uiKit.getRelayerOptionsComponent?.bind(uiKit),
    getExportableWalletConfigFiles: uiKit.getExportableWalletConfigFiles?.bind(uiKit),
    getRelayers: relayer.getRelayers.bind(relayer),
    getRelayer: relayer.getRelayer.bind(relayer),
    getNetworkServiceForms: relayer.getNetworkServiceForms.bind(relayer),
    getDefaultServiceConfig: relayer.getDefaultServiceConfig.bind(relayer),
    validateNetworkServiceConfig: relayer.validateNetworkServiceConfig?.bind(relayer),
    testNetworkServiceConnection: relayer.testNetworkServiceConnection?.bind(relayer),
    validateRpcEndpoint: relayer.validateRpcEndpoint?.bind(relayer),
    testRpcConnection: relayer.testRpcConnection?.bind(relayer),
    validateExplorerConfig: relayer.validateExplorerConfig?.bind(relayer),
    testExplorerConnection: relayer.testExplorerConnection?.bind(relayer),
  };
}
