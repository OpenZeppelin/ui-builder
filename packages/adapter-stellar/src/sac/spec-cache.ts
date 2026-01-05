import type { xdr } from '@stellar/stellar-sdk';

import { logger } from '@openzeppelin/ui-utils';

import type { SacSpecSourceConfig } from './spec-source';
import { fetchSacSpecJson, getSacSpecUrl } from './spec-source';
import { encodeSacSpecEntries, toScSpecEntries } from './xdr';

interface SacSpecCacheEntry {
  base64Entries: string[];
  specEntries: xdr.ScSpecEntry[];
}

const sacSpecCache = new Map<string, SacSpecCacheEntry>();
const sacSpecInflight = new Map<string, Promise<SacSpecCacheEntry>>();

/**
 * Returns cached SAC spec artifacts (base64 and decoded entries) for the given source config.
 * Ensures fetch/encode work is performed at most once per config.
 */
export async function getSacSpecArtifacts(
  cfg: SacSpecSourceConfig = {}
): Promise<SacSpecCacheEntry> {
  const cacheKey = getSacSpecUrl(cfg);

  const cached = sacSpecCache.get(cacheKey);
  if (cached) {
    logger.debug('stellar:sac:spec-cache', 'Returning cached SAC spec artifacts');
    return cached;
  }

  const inflight = sacSpecInflight.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const promise = (async () => {
    const json = await fetchSacSpecJson(cfg);
    const base64Entries = await encodeSacSpecEntries(json);
    const specEntries = toScSpecEntries(base64Entries);

    const entry: SacSpecCacheEntry = {
      base64Entries,
      specEntries,
    };

    sacSpecCache.set(cacheKey, entry);
    sacSpecInflight.delete(cacheKey);

    logger.debug('stellar:sac:spec-cache', 'Cached SAC spec artifacts for future re-use');

    return entry;
  })().catch((error) => {
    sacSpecInflight.delete(cacheKey);
    throw error;
  });

  sacSpecInflight.set(cacheKey, promise);
  return promise;
}

/**
 * Clears cached SAC spec artifacts. Intended for test environments.
 */
export function clearSacSpecArtifactsCache(): void {
  sacSpecCache.clear();
  sacSpecInflight.clear();
}
