// Static metadata imports — these are tiny (~500 B each, just display strings
// + an SVG icon reference). Importing them statically means ecosystem pickers
// render with proper names and icons on the very first frame, with zero
// loading state. The heavy adapter runtime is still lazy-loaded below.
import { ecosystemMetadata as evmMetadata } from '@openzeppelin/adapter-evm/metadata';
import { ecosystemMetadata as midnightMetadata } from '@openzeppelin/adapter-midnight/metadata';
import { ecosystemMetadata as polkadotMetadata } from '@openzeppelin/adapter-polkadot/metadata';
import { ecosystemMetadata as solanaMetadata } from '@openzeppelin/adapter-solana/metadata';
import { ecosystemMetadata as stellarMetadata } from '@openzeppelin/adapter-stellar/metadata';
import type {
  AdapterConfig,
  ContractAdapter,
  Ecosystem,
  EcosystemExport,
  EcosystemMetadata,
  NetworkConfig,
} from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

// =============================================================================
// Metadata Registry (synchronous — available from first render)
// =============================================================================

const ecosystemMetadataRegistry: Record<Ecosystem, EcosystemMetadata> = {
  evm: evmMetadata,
  stellar: stellarMetadata,
  polkadot: polkadotMetadata,
  midnight: midnightMetadata,
  solana: solanaMetadata,
};

// =============================================================================
// Full Adapter Module Loading (lazy — static switch required by Vite)
// =============================================================================

const adapterPromiseCache: Partial<Record<Ecosystem, Promise<EcosystemExport>>> = {};

/**
 * Loads the full adapter module (networks, createAdapter, adapterConfig).
 * This is the "heavy" import — only called when the adapter is actually needed.
 * Caches the in-flight promise to deduplicate concurrent calls and clears the
 * cache entry on failure so transient errors can be retried.
 */
async function loadAdapterModule(ecosystem: Ecosystem): Promise<EcosystemExport> {
  const cached = adapterPromiseCache[ecosystem];
  if (cached) return cached;

  const promise = (async (): Promise<EcosystemExport> => {
    let mod: { ecosystemDefinition: EcosystemExport };
    switch (ecosystem) {
      case 'evm':
        mod = await import('@openzeppelin/adapter-evm');
        break;
      case 'solana':
        mod = await import('@openzeppelin/adapter-solana');
        break;
      case 'stellar':
        mod = await import('@openzeppelin/adapter-stellar');
        break;
      case 'midnight':
        mod = await import('@openzeppelin/adapter-midnight');
        break;
      case 'polkadot':
        mod = await import('@openzeppelin/adapter-polkadot');
        break;
      default: {
        const _exhaustiveCheck: never = ecosystem;
        throw new Error(
          `Adapter package module not defined for ecosystem: ${String(_exhaustiveCheck)}`
        );
      }
    }
    return mod.ecosystemDefinition;
  })();

  adapterPromiseCache[ecosystem] = promise;
  promise.catch(() => {
    delete adapterPromiseCache[ecosystem];
  });

  return promise;
}

// =============================================================================
// Lightweight Network Loading (lazy — only loads network configs, not adapters)
// =============================================================================

const networksByEcosystemCache: Partial<Record<Ecosystem, NetworkConfig[]>> = {};
const networkPromiseCache: Partial<Record<Ecosystem, Promise<NetworkConfig[]>>> = {};

const ALL_ECOSYSTEMS: Ecosystem[] = ['evm', 'solana', 'stellar', 'midnight', 'polkadot'];

/**
 * Loads only the network config array for an ecosystem. This is much lighter
 * than `loadAdapterModule` because it imports from the `/networks` subpath,
 * which only pulls in static config objects + icons — no adapter runtime,
 * wallet libraries, or SDK code.
 *
 * Caches the in-flight promise to deduplicate concurrent calls. Resolved
 * values are stored in `networksByEcosystemCache` for synchronous lookups.
 * On failure the promise cache entry is cleared so the next call retries.
 */
async function loadNetworksModule(ecosystem: Ecosystem): Promise<NetworkConfig[]> {
  const resolvedCache = networksByEcosystemCache[ecosystem];
  if (resolvedCache) return resolvedCache;

  const inflight = networkPromiseCache[ecosystem];
  if (inflight) return inflight;

  const promise = (async (): Promise<NetworkConfig[]> => {
    let mod: { networks: NetworkConfig[] };
    switch (ecosystem) {
      case 'evm':
        mod = await import('@openzeppelin/adapter-evm/networks');
        break;
      case 'solana':
        mod = await import('@openzeppelin/adapter-solana/networks');
        break;
      case 'stellar':
        mod = await import('@openzeppelin/adapter-stellar/networks');
        break;
      case 'midnight':
        mod = await import('@openzeppelin/adapter-midnight/networks');
        break;
      case 'polkadot':
        mod = await import('@openzeppelin/adapter-polkadot/networks');
        break;
      default: {
        const _exhaustiveCheck: never = ecosystem;
        throw new Error(`Networks module not defined for ecosystem: ${String(_exhaustiveCheck)}`);
      }
    }

    networksByEcosystemCache[ecosystem] = mod.networks;
    return mod.networks;
  })();

  networkPromiseCache[ecosystem] = promise;
  promise.catch(() => {
    delete networkPromiseCache[ecosystem];
  });

  return promise;
}

// =============================================================================
// Network Discovery
// =============================================================================

export async function getNetworksByEcosystem(ecosystem: Ecosystem): Promise<NetworkConfig[]> {
  try {
    return await loadNetworksModule(ecosystem);
  } catch (error) {
    logger.error('EcosystemManager', `Error loading networks for ${ecosystem}:`, error);
    return [];
  }
}

/**
 * Loads networks from all ecosystems in parallel. Uses the lightweight
 * `/networks` subpath so no full adapter modules are loaded.
 */
export async function getAllNetworks(): Promise<NetworkConfig[]> {
  const results = await Promise.allSettled(
    ALL_ECOSYSTEMS.map((eco) => getNetworksByEcosystem(eco))
  );

  const all: NetworkConfig[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') all.push(...result.value);
  }
  return all;
}

export async function getNetworkById(id: string): Promise<NetworkConfig | undefined> {
  logger.info('EcosystemManager(getNetworkById)', `Attempting to get network by ID: '${id}'`);

  for (const ecosystem of ALL_ECOSYSTEMS) {
    let networks = networksByEcosystemCache[ecosystem];
    if (!networks) {
      logger.info(
        'EcosystemManager(getNetworkById)',
        `Loading networks for ecosystem: ${ecosystem} to find ID '${id}'.`
      );
      try {
        networks = await getNetworksByEcosystem(ecosystem);
      } catch {
        continue;
      }
    }
    const found = networks?.find((n) => n.id === id);
    if (found) {
      logger.info(
        'EcosystemManager(getNetworkById)',
        `Network ID '${id}' found in ecosystem: ${ecosystem}.`
      );
      return found;
    }
  }

  logger.warn(
    'EcosystemManager(getNetworkById)',
    `Network with ID '${id}' not found after checking all ecosystems.`
  );
  return undefined;
}

// =============================================================================
// Adapter Config
// =============================================================================

export async function getAdapterConfig(ecosystem: Ecosystem): Promise<AdapterConfig | undefined> {
  const def = await loadAdapterModule(ecosystem);
  return def.adapterConfig;
}

// =============================================================================
// Adapter Instantiation
// =============================================================================

export async function getAdapter(networkConfig: NetworkConfig): Promise<ContractAdapter> {
  const logSystem = 'EcosystemManager(getAdapter)';
  logger.info(
    logSystem,
    `Creating adapter for network: ${networkConfig.name} (ID: ${networkConfig.id}).`
  );

  const def = await loadAdapterModule(networkConfig.ecosystem);
  return def.createAdapter(networkConfig);
}

// =============================================================================
// Ecosystem Metadata (synchronous — no loading required)
// =============================================================================

/**
 * Returns lightweight display metadata for an ecosystem. Always synchronous
 * because metadata is statically imported at module load time.
 */
export function getEcosystemMetadata(ecosystem: Ecosystem): EcosystemMetadata {
  return ecosystemMetadataRegistry[ecosystem];
}

/**
 * Returns the full ecosystem definition including networks and adapter factory.
 * Triggers full adapter module loading.
 */
export async function getEcosystemDefinition(ecosystem: Ecosystem): Promise<EcosystemExport> {
  return loadAdapterModule(ecosystem);
}

// =============================================================================
// Adapter Package Name Map (used by scaffolding/export features)
// =============================================================================

export const adapterPackageMap: Record<Ecosystem, string> = {
  evm: '@openzeppelin/adapter-evm',
  solana: '@openzeppelin/adapter-solana',
  stellar: '@openzeppelin/adapter-stellar',
  midnight: '@openzeppelin/adapter-midnight',
  polkadot: '@openzeppelin/adapter-polkadot',
};
