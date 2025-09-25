import { logger } from '@openzeppelin/ui-builder-utils';

export const DEFAULT_SPEC = {
  repo: 'stellar/stellar-asset-contract-spec',
  path: 'refs/heads/main',
  file: 'stellar-asset-spec.json',
};

export interface SacSpecSourceConfig {
  repo?: string;
  path?: string;
  file?: string;
}

export function getSacSpecUrl(cfg: SacSpecSourceConfig = {}): string {
  const repo = cfg.repo || DEFAULT_SPEC.repo;
  const path = cfg.path || DEFAULT_SPEC.path;
  const file = cfg.file || DEFAULT_SPEC.file;
  return `https://raw.githubusercontent.com/${repo}/${path}/${file}`;
}

/** Fetches the SAC JSON spec from GitHub raw. */
export async function fetchSacSpecJson(cfg: SacSpecSourceConfig = {}): Promise<string> {
  const url = getSacSpecUrl(cfg);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.text();
  } catch (error) {
    logger.error('stellar:sac:spec-source', 'Failed to fetch SAC spec:', url, error);
    throw new Error('Failed to load Stellar Asset Contract spec. Please try again later.');
  }
}
