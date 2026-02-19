// Static metadata imports — these are tiny (~500 B each, just display strings
// + an SVG icon reference). Importing them statically means ecosystem pickers
// render with proper names and icons on the very first frame, with zero
// loading state. The heavy adapter runtime is still lazy-loaded below.
import { ecosystemMetadata as evmMetadata } from '@openzeppelin/ui-builder-adapter-evm/metadata';
import { ecosystemMetadata as midnightMetadata } from '@openzeppelin/ui-builder-adapter-midnight/metadata';
import { ecosystemMetadata as polkadotMetadata } from '@openzeppelin/ui-builder-adapter-polkadot/metadata';
import { ecosystemMetadata as solanaMetadata } from '@openzeppelin/ui-builder-adapter-solana/metadata';
import { ecosystemMetadata as stellarMetadata } from '@openzeppelin/ui-builder-adapter-stellar/metadata';
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

const ecosystemCache: Partial<Record<Ecosystem, EcosystemExport>> = {};

/**
 * Loads the full adapter module (networks, createAdapter, adapterConfig).
 * This is the "heavy" import — only called when the adapter is actually needed.
 */
async function loadAdapterModule(ecosystem: Ecosystem): Promise<EcosystemExport> {
  const cached = ecosystemCache[ecosystem];
  if (cached) return cached;

  let mod: { ecosystemDefinition: EcosystemExport };
  switch (ecosystem) {
    case 'evm':
      mod = await import('@openzeppelin/ui-builder-adapter-evm');
      break;
    case 'solana':
      mod = await import('@openzeppelin/ui-builder-adapter-solana');
      break;
    case 'stellar':
      mod = await import('@openzeppelin/ui-builder-adapter-stellar');
      break;
    case 'midnight':
      mod = await import('@openzeppelin/ui-builder-adapter-midnight');
      break;
    case 'polkadot':
      mod = await import('@openzeppelin/ui-builder-adapter-polkadot');
      break;
    default: {
      const _exhaustiveCheck: never = ecosystem;
      throw new Error(
        `Adapter package module not defined for ecosystem: ${String(_exhaustiveCheck)}`
      );
    }
  }

  const def = mod.ecosystemDefinition;
  ecosystemCache[ecosystem] = def;
  return def;
}

// =============================================================================
// Network Discovery
// =============================================================================

const networksByEcosystemCache: Partial<Record<Ecosystem, NetworkConfig[]>> = {};

export async function getNetworksByEcosystem(ecosystem: Ecosystem): Promise<NetworkConfig[]> {
  if (networksByEcosystemCache[ecosystem]) {
    return networksByEcosystemCache[ecosystem]!;
  }

  try {
    const def = await loadAdapterModule(ecosystem);
    const networks = def.networks;
    if (!Array.isArray(networks)) {
      logger.error(
        'EcosystemManager',
        `Expected an array of networks for ${ecosystem}, received: ${typeof networks}`
      );
      networksByEcosystemCache[ecosystem] = [];
      return [];
    }
    networksByEcosystemCache[ecosystem] = networks;
    return networks;
  } catch (error) {
    logger.error('EcosystemManager', `Error loading networks for ${ecosystem}:`, error);
    networksByEcosystemCache[ecosystem] = [];
    return [];
  }
}

export async function getNetworkById(id: string): Promise<NetworkConfig | undefined> {
  logger.info('EcosystemManager(getNetworkById)', `Attempting to get network by ID: '${id}'`);

  for (const ecosystemKey of Object.keys(networksByEcosystemCache)) {
    const ecosystem = ecosystemKey as Ecosystem;
    const cached = networksByEcosystemCache[ecosystem];
    if (cached) {
      const network = cached.find((n) => n.id === id);
      if (network) {
        logger.info(
          'EcosystemManager(getNetworkById)',
          `Network ID '${id}' found in cache for ecosystem: ${ecosystem}.`
        );
        return network;
      }
    }
  }

  const allEcosystems: Ecosystem[] = ['evm', 'solana', 'stellar', 'midnight', 'polkadot'];
  for (const ecosystem of allEcosystems) {
    let networks = networksByEcosystemCache[ecosystem];
    if (!networks) {
      logger.info(
        'EcosystemManager(getNetworkById)',
        `Loading networks for ecosystem: ${ecosystem} to find ID '${id}'.`
      );
      networks = await getNetworksByEcosystem(ecosystem);
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
  evm: '@openzeppelin/ui-builder-adapter-evm',
  solana: '@openzeppelin/ui-builder-adapter-solana',
  stellar: '@openzeppelin/ui-builder-adapter-stellar',
  midnight: '@openzeppelin/ui-builder-adapter-midnight',
  polkadot: '@openzeppelin/ui-builder-adapter-polkadot',
};
