/**
 * EVM Access Control Role Discovery
 *
 * Scans contract ABI for role constant candidates (no inputs, single bytes32 output,
 * view/pure, name ending in _ROLE or Role) and calls them on-chain to build a
 * hash -> label map for human-readable role display.
 *
 * @module access-control/role-discovery
 */

import type { Abi, Chain } from 'viem';

import type { ContractFunction, ContractSchema } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { createEvmPublicClient } from '../utils/public-client';

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

  const client = createEvmPublicClient(rpcUrl, viemChain);

  const address = contractAddress as `0x${string}`;
  const result = new Map<string, string>();

  // Batch all RPC calls in parallel for reduced latency
  const callResults = await Promise.allSettled(
    candidates.map(async (fn) => {
      const abi: Abi = [
        {
          type: 'function',
          name: fn.name,
          inputs: [],
          outputs: [{ name: '', type: 'bytes32' }],
          stateMutability: (fn.stateMutability as 'view' | 'pure') || 'view',
        },
      ];

      const value = await client.readContract({
        address,
        abi,
        functionName: fn.name as string,
        args: [],
      });

      return { name: fn.name, value };
    })
  );

  for (const settled of callResults) {
    if (settled.status === 'rejected') {
      logger.debug(
        LOG_SYSTEM,
        `Skipping role constant on ${contractAddress}: ${(settled.reason as Error).message}`
      );
      continue;
    }

    const { name, value } = settled.value;

    // Normalize to 0x + 64 lowercase hex chars for consistent map keys.
    // viem returns bytes32 as a hex string, but we handle bigint defensively.
    const raw =
      typeof value === 'string'
        ? value.toLowerCase()
        : `0x${(value as bigint).toString(16).padStart(64, '0')}`;
    const normalizedHash = raw.startsWith('0x')
      ? `0x${raw.slice(2).padStart(64, '0')}`
      : `0x${raw.padStart(64, '0')}`;

    result.set(normalizedHash, name);
    logger.debug(LOG_SYSTEM, `Resolved role constant ${name} -> ${normalizedHash}`);
  }

  logger.info(
    LOG_SYSTEM,
    `Discovered ${result.size} role label(s) from ABI for ${contractAddress}`,
    { candidates: candidates.length }
  );

  return result;
}
