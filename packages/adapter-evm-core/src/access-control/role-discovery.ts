/**
 * EVM Access Control Role Discovery
 *
 * Scans contract ABI for role constant candidates (no inputs, single bytes32 output,
 * view/pure, name ending in _ROLE or Role) and calls them on-chain to build a
 * hash -> label map for human-readable role display.
 *
 * @module access-control/role-discovery
 */

import { createPublicClient, http, type Abi, type Chain } from 'viem';

import type { ContractFunction, ContractSchema } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOG_SYSTEM = 'EvmRoleDiscovery';

/** Regex: function name ends with _ROLE or Role (OpenZeppelin role constant pattern) */
const ROLE_CONSTANT_NAME_PATTERN = /_ROLE$|Role$/;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Filters contract schema functions for role constant candidates.
 *
 * A candidate must have:
 * - No inputs
 * - Single bytes32 output
 * - stateMutability view or pure
 * - Name ending with _ROLE or Role
 *
 * @param contractSchema - Parsed contract schema with functions array
 * @returns Array of ContractFunction candidates
 */
export function findRoleConstantCandidates(contractSchema: ContractSchema): ContractFunction[] {
  return contractSchema.functions.filter((fn) => {
    if (fn.inputs.length !== 0) return false;
    const outputs = fn.outputs;
    if (!outputs || outputs.length !== 1 || outputs[0].type !== 'bytes32') return false;
    const mutability = fn.stateMutability?.toLowerCase();
    if (mutability !== 'view' && mutability !== 'pure') return false;
    return ROLE_CONSTANT_NAME_PATTERN.test(fn.name);
  });
}

/**
 * Discovers role labels by calling role constant candidates on-chain.
 *
 * For each candidate from findRoleConstantCandidates(), calls the function
 * on the contract and maps the returned bytes32 value to the function name.
 * Failed calls are skipped (graceful degradation).
 *
 * @param rpcUrl - RPC endpoint URL
 * @param contractAddress - The EVM contract address (0x-prefixed)
 * @param contractSchema - Parsed contract schema
 * @param viemChain - Optional viem Chain object
 * @returns Map of bytes32 hash (0x-prefixed, 64 hex chars) -> function name (label)
 */
export async function discoverRoleLabelsFromAbi(
  rpcUrl: string,
  contractAddress: string,
  contractSchema: ContractSchema,
  viemChain?: Chain
): Promise<Map<string, string>> {
  const candidates = findRoleConstantCandidates(contractSchema);
  if (candidates.length === 0) {
    logger.debug(LOG_SYSTEM, `No role constant candidates for ${contractAddress}`);
    return new Map();
  }

  const chain = viemChain ?? {
    id: 1,
    name: 'Unknown',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl] },
    },
  };

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const address = contractAddress as `0x${string}`;
  const result = new Map<string, string>();

  for (const fn of candidates) {
    const abi: Abi = [
      {
        type: 'function',
        name: fn.name,
        inputs: [],
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: (fn.stateMutability as 'view' | 'pure') || 'view',
      },
    ];

    try {
      const value = await client.readContract({
        address,
        abi,
        functionName: fn.name as string,
        args: [],
      });

      // Normalize to 0x + 64 hex chars for consistent map keys
      const hash =
        typeof value === 'string'
          ? value.toLowerCase().startsWith('0x')
            ? value.toLowerCase()
            : `0x${value}`
          : `0x${(value as bigint).toString(16).padStart(64, '0')}`;
      const normalizedHash = hash.length === 66 ? hash : `0x${hash.slice(2).padStart(64, '0')}`;

      result.set(normalizedHash, fn.name);
      logger.debug(LOG_SYSTEM, `Resolved role constant ${fn.name} -> ${normalizedHash}`);
    } catch (error) {
      logger.debug(
        LOG_SYSTEM,
        `Skipping role constant ${fn.name} on ${contractAddress}: ${(error as Error).message}`
      );
    }
  }

  logger.info(
    LOG_SYSTEM,
    `Discovered ${result.size} role label(s) from ABI for ${contractAddress}`,
    { candidates: candidates.length }
  );

  return result;
}
