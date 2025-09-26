import type { ContractSchema } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import type { AbiItem, TypedEvmNetworkConfig } from '../types';
import { transformAbiToSchema } from './transformer';

export interface SourcifyAbiResult {
  schema: ContractSchema;
  originalAbi: string;
}

const SOURCIFY_APP_BASE = 'https://sourcify.dev';

export function getSourcifyContractAppUrl(chainId: number, address: string): string {
  const normalizedAddress = address.toLowerCase();
  return `${SOURCIFY_APP_BASE}/status/${chainId}/${normalizedAddress}`;
}

const SOURCIFY_API_BASE = 'https://sourcify.dev/server/v2';

interface SourcifyApiContractResponse {
  abi?: AbiItem[];
  metadata?: {
    contractName?: string;
    output?: {
      abi?: AbiItem[];
    };
  };
}

function buildSourcifyApiUrl(chainId: number, address: string): string {
  const normalizedAddress = address.toLowerCase();
  const url = new URL(
    `${SOURCIFY_API_BASE}/contract/${chainId}/${normalizedAddress}?fields=abi,metadata`
  );
  return url.toString();
}

export async function loadAbiFromSourcify(
  address: string,
  networkConfig: TypedEvmNetworkConfig,
  timeoutMs = 4000
): Promise<SourcifyAbiResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = buildSourcifyApiUrl(networkConfig.chainId, address);
    logger.info('loadAbiFromSourcify', `Fetching contract from ${url}`);

    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Sourcify request failed: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as SourcifyApiContractResponse;
    const abi = payload.abi ?? payload.metadata?.output?.abi;

    if (!abi || !Array.isArray(abi)) {
      throw new Error('Sourcify metadata did not include a valid ABI array');
    }

    const contractName =
      payload.metadata?.contractName || `Contract_${address.substring(0, 6).toUpperCase()}`;
    const schema = transformAbiToSchema(abi, contractName, address);

    return { schema, originalAbi: JSON.stringify(abi) };
  } catch (error) {
    logger.warn('loadAbiFromSourcify', `Failed to fetch ABI from Sourcify: ${String(error)}`);
    throw error as Error;
  } finally {
    clearTimeout(timeout);
  }
}
