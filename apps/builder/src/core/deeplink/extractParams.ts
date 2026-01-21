/**
 * Deep link parameter extraction utilities
 *
 * Helper functions to extract and normalize parameters from deep link URLs
 */

/**
 * Extracts and normalizes deep link parameters according to the aliasing contract
 * described in the deep-link documentation.
 */
export function extractDeepLinkParams(params: Record<string, string>) {
  return {
    ecosystem: (params.ecosystem || '').trim(),
    networkId: params.networkId || params.networkid || null,
    address: params.contractAddress || params.address || params.identifier || null,
    forcedService: typeof params.service === 'string' ? params.service : null,
    chainId: params.chainId || null,
  };
}
