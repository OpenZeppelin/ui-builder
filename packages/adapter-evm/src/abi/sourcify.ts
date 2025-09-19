import type { ContractSchema } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import type { AbiItem, TypedEvmNetworkConfig } from '../types';
import { transformAbiToSchema } from './transformer';

export interface SourcifyAbiResult {
  schema: ContractSchema;
  originalAbi: string;
}

const SOURCIFY_BASE = 'https://repo.sourcify.dev';

function buildSourcifyAbiUrl(chainId: number, address: string): string {
  const checksum = address.toLowerCase();
  return `${SOURCIFY_BASE}/contracts/full_match/${chainId}/${checksum}/metadata.json`;
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
  const url = buildSourcifyAbiUrl(networkConfig.chainId, address);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    logger.info('loadAbiFromSourcify', `Fetching metadata from ${url}`);
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Sourcify request failed: ${response.status} ${response.statusText}`);
    }
    const metadata = (await response.json()) as {
      output?: { abi?: AbiItem[] };
      contractName?: string;
    };

    const abi = metadata?.output?.abi;
    if (!abi || !Array.isArray(abi)) {
      throw new Error('Sourcify metadata did not include a valid ABI array');
    }

    const contractName = metadata.contractName || `Contract_${address.substring(0, 6)}`;
    const schema = transformAbiToSchema(abi, contractName, address);
    return { schema, originalAbi: JSON.stringify(abi) };
  } catch (error) {
    logger.warn('loadAbiFromSourcify', `Failed to fetch ABI from Sourcify: ${String(error)}`);
    throw error as Error;
  } finally {
    clearTimeout(timeout);
  }
}
