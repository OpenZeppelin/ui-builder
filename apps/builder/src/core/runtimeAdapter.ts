import type { ComposerEcosystemRuntime, TransactionFormCapabilities } from '@openzeppelin/ui-types';

export type BuilderRuntime = ComposerEcosystemRuntime;

/**
 * Flattens a {@link ComposerEcosystemRuntime} into the flat capability shape
 * expected by the renderer's {@link TransactionFormCapabilities} prop.
 *
 * Method references are bound so they work correctly when detached from
 * the originating capability object.
 */
export function toTransactionFormCapabilities(
  runtime: ComposerEcosystemRuntime
): TransactionFormCapabilities {
  const { addressing, explorer, schema, typeMapping, query, execution, relayer } = runtime;

  return {
    networkConfig: runtime.networkConfig,
    dispose: runtime.dispose.bind(runtime),
    isValidAddress: addressing.isValidAddress.bind(addressing),
    getExplorerUrl: explorer.getExplorerUrl.bind(explorer),
    getExplorerTxUrl: explorer.getExplorerTxUrl?.bind(explorer),
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
    getSupportedExecutionMethods: execution.getSupportedExecutionMethods.bind(execution),
    validateExecutionConfig: execution.validateExecutionConfig.bind(execution),
    waitForTransactionConfirmation: execution.waitForTransactionConfirmation?.bind(execution),
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
  } as TransactionFormCapabilities;
}
