import type {
  EoaExecutionConfig,
  ExecutionConfig,
  RelayerDetails,
  RelayerExecutionConfig,
} from '@openzeppelin/transaction-form-types';

/**
 * Helper to ensure the config object has the correct structure based on the method.
 * Returns undefined if the config is fundamentally incomplete (e.g., method not set).
 */
export function ensureCompleteConfig(
  partialConfig: Partial<ExecutionConfig> | undefined | null // Allow undefined/null input
): ExecutionConfig | undefined {
  if (!partialConfig || !partialConfig.method) return undefined;

  if (partialConfig.method === 'eoa') {
    const config = partialConfig as Partial<EoaExecutionConfig>;
    return {
      method: 'eoa',
      allowAny: config.allowAny ?? true, // Default to allowAny if not specified
      specificAddress: config.specificAddress,
    };
  } else if (partialConfig.method === 'relayer') {
    const config = partialConfig as Partial<RelayerExecutionConfig>;
    return {
      method: 'relayer',
      serviceUrl: config.serviceUrl || '',
      relayer: config.relayer || ({} as RelayerDetails), // Provide a default empty object
    };
  } else if (partialConfig.method === 'multisig') {
    // TODO: Implement structure for multisig
    return { method: 'multisig' };
  }

  // Handle potential invalid method types if ExecutionMethodType allows more
  console.warn(`ensureCompleteConfig: Unknown method type encountered: ${partialConfig.method}`);
  return undefined;
}
