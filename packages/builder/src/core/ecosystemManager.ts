import type {
  AdapterConfig,
  ContractAdapter,
  Ecosystem,
  EvmNetworkConfig,
  MidnightNetworkConfig,
  NetworkConfig,
  SolanaNetworkConfig,
  StellarNetworkConfig,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

// Define specific constructor types for each adapter
type EvmAdapterConstructor = new (networkConfig: EvmNetworkConfig) => ContractAdapter;
type SolanaAdapterConstructor = new (networkConfig: SolanaNetworkConfig) => ContractAdapter;
type StellarAdapterConstructor = new (networkConfig: StellarNetworkConfig) => ContractAdapter;
type MidnightAdapterConstructor = new (networkConfig: MidnightNetworkConfig) => ContractAdapter;

// Union of all possible adapter constructor types
type AnySpecificAdapterConstructor =
  | EvmAdapterConstructor
  | SolanaAdapterConstructor
  | StellarAdapterConstructor
  | MidnightAdapterConstructor;

// Define the structure for each ecosystem's metadata
interface EcosystemMetadata {
  networksExportName: string; // e.g., 'evmNetworks'
  // Store a function that returns a promise of the Class constructor.
  // The constructor itself will be cast to 'any' before use in getAdapter due to varying specific NetworkConfig types.
  getAdapterClass: () => Promise<AnySpecificAdapterConstructor>;
  adapterConfigPackagePath?: string;
  adapterConfigExportName?: string;
}

// Centralized configuration for each ecosystem
const ecosystemRegistry: Record<Ecosystem, EcosystemMetadata> = {
  evm: {
    networksExportName: 'evmNetworks',
    getAdapterClass: async () =>
      (await import('@openzeppelin/contracts-ui-builder-adapter-evm'))
        .EvmAdapter as EvmAdapterConstructor,
    adapterConfigPackagePath: '@openzeppelin/contracts-ui-builder-adapter-evm',
    adapterConfigExportName: 'evmAdapterConfig',
  },
  solana: {
    networksExportName: 'solanaNetworks',
    getAdapterClass: async () =>
      (await import('@openzeppelin/contracts-ui-builder-adapter-solana'))
        .SolanaAdapter as SolanaAdapterConstructor,
    adapterConfigPackagePath: '@openzeppelin/contracts-ui-builder-adapter-solana',
    adapterConfigExportName: 'solanaAdapterConfig',
  },
  stellar: {
    networksExportName: 'stellarNetworks',
    getAdapterClass: async () =>
      (await import('@openzeppelin/contracts-ui-builder-adapter-stellar'))
        .StellarAdapter as StellarAdapterConstructor,
    adapterConfigPackagePath: '@openzeppelin/contracts-ui-builder-adapter-stellar',
    adapterConfigExportName: 'stellarAdapterConfig',
  },
  midnight: {
    networksExportName: 'midnightNetworks',
    getAdapterClass: async () =>
      (await import('@openzeppelin/contracts-ui-builder-adapter-midnight'))
        .MidnightAdapter as MidnightAdapterConstructor,
    adapterConfigPackagePath: '@openzeppelin/contracts-ui-builder-adapter-midnight',
    adapterConfigExportName: 'midnightAdapterConfig',
  },
};

// --- Network Discovery Logic (adapted from networks/registry.ts) ---
const networksByEcosystemCache: Partial<Record<Ecosystem, NetworkConfig[]>> = {};

async function loadAdapterPackageModule(ecosystem: Ecosystem): Promise<Record<string, unknown>> {
  // This robust switch is good for Vite compatibility
  switch (ecosystem) {
    case 'evm':
      return import('@openzeppelin/contracts-ui-builder-adapter-evm');
    case 'solana':
      return import('@openzeppelin/contracts-ui-builder-adapter-solana');
    case 'stellar':
      return import('@openzeppelin/contracts-ui-builder-adapter-stellar');
    case 'midnight':
      return import('@openzeppelin/contracts-ui-builder-adapter-midnight');
    default:
      const _exhaustiveCheck: never = ecosystem;
      throw new Error(
        `Adapter package module not defined for ecosystem: ${String(_exhaustiveCheck)}`
      );
  }
}

export async function getNetworksByEcosystem(ecosystem: Ecosystem): Promise<NetworkConfig[]> {
  // Check cache first
  if (networksByEcosystemCache[ecosystem]) {
    return networksByEcosystemCache[ecosystem]!;
  }

  const meta = ecosystemRegistry[ecosystem];
  if (!meta) {
    logger.warn('EcosystemManager', `No metadata registered for ecosystem: ${ecosystem}`);
    return [];
  }

  try {
    const module = await loadAdapterPackageModule(ecosystem);
    const networks = (module[meta.networksExportName] as NetworkConfig[]) || [];
    if (!Array.isArray(networks)) {
      logger.error(
        'EcosystemManager',
        `Expected an array for ${meta.networksExportName} in ${ecosystem}, received: ${typeof networks}`
      );
      networksByEcosystemCache[ecosystem] = [];
      return [];
    }
    // Cache the networks
    networksByEcosystemCache[ecosystem] = networks;
    return networks;
  } catch (error) {
    logger.error('EcosystemManager', `Error loading networks for ${ecosystem}:`, error);
    networksByEcosystemCache[ecosystem] = [];
    return [];
  }
}

/**
 * Retrieves a specific network configuration by its unique ID.
 *
 * This function employs a two-step caching and lookup strategy to efficiently find the network
 * configuration while ensuring adapters are loaded dynamically and only when necessary:
 *
 * 1.  **Ecosystem-Specific Cache Check (`networksByEcosystemCache`):**
 *     It first iterates through `networksByEcosystemCache`. This cache stores arrays of
 *     `NetworkConfig` objects, keyed by their `Ecosystem`. This cache is populated whenever
 *     `getNetworksByEcosystem` is called for a particular ecosystem (which involves dynamically
 *     importing the corresponding adapter package if it hasn't been loaded yet).
 *     If the network ID is found in any of these already-loaded ecosystem caches, the function
 *     returns the network config immediately, avoiding redundant lookups or module loading.
 *
 * 2.  **Sequential Ecosystem Iteration and On-Demand Loading:**
 *     If the network ID is not found in any pre-populated ecosystem-specific cache, the function
 *     iterates through all registered ecosystems defined in `ecosystemRegistry`.
 *     For each ecosystem in this list:
 *     a.  It first checks `networksByEcosystemCache` again for that specific ecosystem. This handles
 *         cases where the cache might have been populated by a concurrent operation or a previous
 *         step within the same broader application flow but wasn't iterated over in step 1 (e.g., if
 *         step 1 iterated `Object.keys(networksByEcosystemCache)` before this specific ecosystem was added).
 *     b.  If the networks for the current ecosystem are not in `networksByEcosystemCache`, it calls
 *         `await getNetworksByEcosystem(ecosystem)`. This function is responsible for:
 *         - Dynamically importing the adapter package for that ecosystem (e.g., `/adapter-evm`).
 *           This is the core of the dynamic loading behavior, ensuring adapter code is fetched only when
 *           its ecosystem is being actively queried.
 *         - Extracting the network configurations from the loaded module.
 *         - Populating `networksByEcosystemCache[ecosystem]` with these networks for future lookups.
 *     c.  Once the networks for the current ecosystem are available (either from cache or newly loaded),
 *         it searches for the target network ID within that list.
 *     d.  If found, the network configuration is returned, and the process stops.
 *
 * This approach ensures that:
 * - We leverage existing cached data as much as possible.
 * - We only load adapter modules (and their associated network lists) for ecosystems that are
 *   actually relevant to the `id` being searched, or for ecosystems whose networks have been
 *   explicitly requested elsewhere via `getNetworksByEcosystem`.
 */
export async function getNetworkById(id: string): Promise<NetworkConfig | undefined> {
  logger.info('EcosystemManager(getNetworkById)', `Attempting to get network by ID: '${id}'`);

  // 1. Check all existing populated ecosystem-specific caches
  // These caches are populated by calls to getNetworksByEcosystem
  for (const ecosystemKey of Object.keys(networksByEcosystemCache)) {
    const ecosystem = ecosystemKey as Ecosystem;
    const cachedNetworksForEcosystem = networksByEcosystemCache[ecosystem];
    if (cachedNetworksForEcosystem) {
      const network = cachedNetworksForEcosystem.find((n) => n.id === id);
      if (network) {
        logger.info(
          'EcosystemManager(getNetworkById)',
          `Network ID '${id}' found in already populated cache for ecosystem: ${ecosystem}.`
        );
        return network;
      }
    }
  }

  // 2. If not found in existing caches, iterate through all registered ecosystems.
  // For each ecosystem, load its networks if not already cached via networksByEcosystemCache, then search.
  logger.info(
    'EcosystemManager(getNetworkById)',
    `Network ID '${id}' not found in existing caches. Sequentially checking/loading ecosystems.`
  );
  const allEcosystems = Object.keys(ecosystemRegistry) as Ecosystem[];

  for (const ecosystem of allEcosystems) {
    // Attempt to retrieve from cache first for this specific ecosystem
    let networksForEcosystem = networksByEcosystemCache[ecosystem];

    if (!networksForEcosystem) {
      // If not in cache, load them. getNetworksByEcosystem will populate the cache.
      logger.info(
        'EcosystemManager(getNetworkById)',
        `Cache miss for ${ecosystem}. Loading networks for ecosystem: ${ecosystem} to find ID '${id}'.`
      );
      networksForEcosystem = await getNetworksByEcosystem(ecosystem);
    } else {
      // This case means the ecosystem's networks were already in networksByEcosystemCache,
      // but the ID wasn't found in the first loop. This can happen if the first loop iterated
      // over Object.keys(networksByEcosystemCache) which might not yet include this `ecosystem`
      // if it's being processed for the first time in this broader loop.
      // No need to re-log if already loaded, the first loop would have caught it if the ID was present.
      // However, it's crucial to use these already loaded networks for the search.
      logger.info(
        'EcosystemManager(getNetworkById)',
        `Using already loaded networks for ecosystem: ${ecosystem} (from networksByEcosystemCache) to find ID '${id}'.`
      );
    }

    const foundNetwork = networksForEcosystem?.find((n) => n.id === id);
    if (foundNetwork) {
      logger.info(
        'EcosystemManager(getNetworkById)',
        `Network ID '${id}' found in ecosystem: ${ecosystem}.`
      );
      return foundNetwork;
    }
  }

  logger.warn(
    'EcosystemManager(getNetworkById)',
    `Network with ID '${id}' not found after checking/loading all ecosystems.`
  );
  return undefined;
}

// --- Adapter Config Loaders Map ---
export function getAdapterConfigLoader(
  ecosystem: Ecosystem
): (() => Promise<Record<string, AdapterConfig | unknown>>) | undefined {
  const meta = ecosystemRegistry[ecosystem];
  if (!meta || !meta.adapterConfigPackagePath) return undefined;

  // The adapterConfigPackagePath in meta is for reference/documentation;
  // the switch uses static paths for Vite compatibility.
  switch (ecosystem) {
    case 'evm':
      return () => import('@openzeppelin/contracts-ui-builder-adapter-evm');
    case 'solana':
      return () => import('@openzeppelin/contracts-ui-builder-adapter-solana');
    case 'stellar':
      return () => import('@openzeppelin/contracts-ui-builder-adapter-stellar');
    case 'midnight':
      return () => import('@openzeppelin/contracts-ui-builder-adapter-midnight');
    default:
      return undefined;
  }
}

export function getAdapterConfigExportName(ecosystem: Ecosystem): string | undefined {
  return ecosystemRegistry[ecosystem]?.adapterConfigExportName;
}

// --- Adapter Instantiation Logic ---

export async function getAdapter(networkConfigInput: NetworkConfig): Promise<ContractAdapter> {
  const logSystem = 'EcosystemManager(getAdapter)';
  const networkId = networkConfigInput.id;

  logger.info(
    logSystem,
    `Creating new adapter for network: ${networkConfigInput.name} (ID: ${networkId}) using its default RPC.`
  );

  const meta = ecosystemRegistry[networkConfigInput.ecosystem];
  if (!meta) {
    throw new Error(
      `No adapter metadata registered for ecosystem: ${networkConfigInput.ecosystem}`
    );
  }

  const AdapterClass = await meta.getAdapterClass();

  // Instantiate with the original, static networkConfigInput
  // The adapter's constructor or client initialization logic will handle RPC overrides.
  switch (networkConfigInput.ecosystem) {
    case 'evm':
      return new (AdapterClass as EvmAdapterConstructor)(networkConfigInput as EvmNetworkConfig);
    case 'solana':
      return new (AdapterClass as SolanaAdapterConstructor)(
        networkConfigInput as SolanaNetworkConfig
      );
    case 'stellar':
      return new (AdapterClass as StellarAdapterConstructor)(
        networkConfigInput as StellarNetworkConfig
      );
    case 'midnight':
      return new (AdapterClass as MidnightAdapterConstructor)(
        networkConfigInput as MidnightNetworkConfig
      );
    default:
      const unhandledEcosystem = (networkConfigInput as NetworkConfig).ecosystem;
      throw new Error(`No adapter constructor logic for ${String(unhandledEcosystem)}`);
  }
}

// --- Adapter Package Name Map ---
export const adapterPackageMap: Record<Ecosystem, string> = {
  evm: '@openzeppelin/contracts-ui-builder-adapter-evm',
  solana: '@openzeppelin/contracts-ui-builder-adapter-solana',
  stellar: '@openzeppelin/contracts-ui-builder-adapter-stellar',
  midnight: '@openzeppelin/contracts-ui-builder-adapter-midnight',
};
