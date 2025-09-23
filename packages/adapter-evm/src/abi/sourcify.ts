import type { ContractSchema } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import type { AbiItem, TypedEvmNetworkConfig } from '../types';
import { transformAbiToSchema } from './transformer';

export interface SourcifyAbiResult {
  schema: ContractSchema;
  originalAbi: string;
}

const SOURCIFY_BASE = 'https://repo.sourcify.dev';

function buildSourcifyAbiUrlCandidates(chainId: number, address: string): string[] {
  // Sourcify stores addresses in lowercase on disk, but be defensive and try both
  const addrLower = address.toLowerCase();
  const addrOriginal = address;

  // The repo host supports explicit match types only: full_match and partial_match.
  // The "any" route is not valid on repo.sourcify.dev and triggers OpenAPI validation errors.
  const categories = ['full_match', 'partial_match'] as const;
  const addrs = [addrLower, addrOriginal];

  const urls: string[] = [];
  for (const category of categories) {
    for (const addr of addrs) {
      urls.push(`${SOURCIFY_BASE}/contracts/${category}/${chainId}/${addr}/metadata.json`);
    }
  }
  return urls;
}

/**
 * Builds the canonical Sourcify repo URL for a contract page (chainId/address).
 * This is used for provenance links in metadata.
 */
export function getSourcifyRepoContractUrl(chainId: number, address: string): string {
  return `${SOURCIFY_BASE}/${chainId}/${address}`;
}

export async function loadAbiFromSourcify(
  address: string,
  networkConfig: TypedEvmNetworkConfig,
  timeoutMs = 4000
): Promise<SourcifyAbiResult> {
  const candidates = buildSourcifyAbiUrlCandidates(networkConfig.chainId, address);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let lastError: Error | null = null;
    for (const url of candidates) {
      try {
        logger.info('loadAbiFromSourcify', `Fetching metadata from ${url}`);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          lastError = new Error(
            `Sourcify request failed: ${response.status} ${response.statusText} (${url})`
          );
          continue; // try next candidate
        }
        const metadata = (await response.json()) as {
          output?: { abi?: AbiItem[] };
          contractName?: string;
        };

        const abi = metadata?.output?.abi;
        if (!abi || !Array.isArray(abi)) {
          lastError = new Error('Sourcify metadata did not include a valid ABI array');
          continue; // try next candidate
        }

        const contractName = metadata.contractName || `Contract_${address.substring(0, 6)}`;
        const schema = transformAbiToSchema(abi, contractName, address);
        return { schema, originalAbi: JSON.stringify(abi) };
      } catch (inner) {
        lastError = inner as Error;
        continue;
      }
    }
    throw lastError ?? new Error('Sourcify metadata not found for any candidate URL');
  } catch (error) {
    logger.warn('loadAbiFromSourcify', `Failed to fetch ABI from Sourcify: ${String(error)}`);
    throw error as Error;
  } finally {
    clearTimeout(timeout);
  }
}
