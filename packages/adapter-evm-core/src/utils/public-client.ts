/**
 * Shared Viem Public Client Factory
 *
 * Creates a viem `PublicClient` for on-chain reads. Consolidates client creation
 * logic that was previously duplicated across query/handler.ts, access-control/onchain-reader.ts,
 * and access-control/role-discovery.ts.
 *
 * @module utils/public-client
 */

import { createPublicClient, http, type Chain, type PublicClient, type Transport } from 'viem';

import { logger } from '@openzeppelin/ui-utils';

const LOG_SYSTEM = 'createEvmPublicClient';

/**
 * Default minimal chain config used when no `viemChain` is provided.
 * Sufficient for `readContract()` calls where chain metadata is not needed.
 */
function buildMinimalChain(rpcUrl: string): Chain {
  return {
    id: 1,
    name: 'Unknown',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl] },
    },
  };
}

/**
 * Creates a viem `PublicClient` for on-chain reads.
 *
 * If `viemChain` is provided, it is used directly. Otherwise a minimal chain
 * config is built from the RPC URL — this is sufficient for `readContract()`
 * calls where chain metadata (block explorers, native currency, etc.) is not required.
 *
 * @param rpcUrl - The RPC endpoint URL
 * @param viemChain - Optional viem Chain object with full chain metadata
 * @returns A viem PublicClient ready for on-chain reads
 * @throws If client creation fails (e.g. invalid RPC URL)
 */
export function createEvmPublicClient(
  rpcUrl: string,
  viemChain?: Chain
): PublicClient<Transport, Chain> {
  if (!viemChain) {
    logger.debug(LOG_SYSTEM, 'No viemChain provided, using minimal chain config');
  }

  const chain = viemChain ?? buildMinimalChain(rpcUrl);

  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  }) as PublicClient<Transport, Chain>;
}
