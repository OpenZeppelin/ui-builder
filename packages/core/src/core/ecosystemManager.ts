import type {
  ContractAdapter,
  Ecosystem,
  EvmNetworkConfig,
  MidnightNetworkConfig,
  NetworkConfig,
  SolanaNetworkConfig,
  StellarNetworkConfig,
} from '@openzeppelin/transaction-form-types';

import type { AdapterConfig } from './types/AdapterTypes';

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
      (await import('@openzeppelin/transaction-form-adapter-evm'))
        .EvmAdapter as EvmAdapterConstructor,
    adapterConfigPackagePath: '@openzeppelin/transaction-form-adapter-evm/dist/config.js',
    adapterConfigExportName: 'evmAdapterConfig',
  },
  solana: {
    networksExportName: 'solanaNetworks',
    getAdapterClass: async () =>
      (await import('@openzeppelin/transaction-form-adapter-solana'))
        .SolanaAdapter as SolanaAdapterConstructor,
    adapterConfigPackagePath: '@openzeppelin/transaction-form-adapter-solana/dist/config.js',
    adapterConfigExportName: 'solanaAdapterConfig',
  },
  stellar: {
    networksExportName: 'stellarNetworks',
    getAdapterClass: async () =>
      (await import('@openzeppelin/transaction-form-adapter-stellar'))
        .StellarAdapter as StellarAdapterConstructor,
    adapterConfigPackagePath: '@openzeppelin/transaction-form-adapter-stellar/dist/config.js',
    adapterConfigExportName: 'stellarAdapterConfig',
  },
  midnight: {
    networksExportName: 'midnightNetworks',
    getAdapterClass: async () =>
      (await import('@openzeppelin/transaction-form-adapter-midnight'))
        .MidnightAdapter as MidnightAdapterConstructor,
    adapterConfigPackagePath: '@openzeppelin/transaction-form-adapter-midnight/dist/config.js',
    adapterConfigExportName: 'midnightAdapterConfig',
  },
};

// --- Network Discovery Logic (adapted from networks/registry.ts) ---
let cachedAllNetworks: NetworkConfig[] | null = null;
const networksByEcosystemCache: Partial<Record<Ecosystem, NetworkConfig[]>> = {};

async function loadAdapterPackageModule(ecosystem: Ecosystem): Promise<Record<string, unknown>> {
  // This robust switch is good for Vite compatibility
  switch (ecosystem) {
    case 'evm':
      return import('@openzeppelin/transaction-form-adapter-evm');
    case 'solana':
      return import('@openzeppelin/transaction-form-adapter-solana');
    case 'stellar':
      return import('@openzeppelin/transaction-form-adapter-stellar');
    case 'midnight':
      return import('@openzeppelin/transaction-form-adapter-midnight');
    default:
      const _exhaustiveCheck: never = ecosystem;
      throw new Error(
        `Adapter package module not defined for ecosystem: ${String(_exhaustiveCheck)}`
      );
  }
}

export async function getNetworksByEcosystem(ecosystem: Ecosystem): Promise<NetworkConfig[]> {
  if (networksByEcosystemCache[ecosystem]) {
    return networksByEcosystemCache[ecosystem] as NetworkConfig[];
  }
  const meta = ecosystemRegistry[ecosystem];
  if (!meta) {
    console.warn(`No metadata registered for ecosystem: ${ecosystem}`);
    return [];
  }

  try {
    const module = await loadAdapterPackageModule(ecosystem);
    const networks = (module[meta.networksExportName] as NetworkConfig[]) || [];
    if (!Array.isArray(networks)) {
      console.error(
        `Expected an array for ${meta.networksExportName} in adapter for ${ecosystem}, but received:`,
        typeof networks
      );
      networksByEcosystemCache[ecosystem] = [];
      return [];
    }
    networksByEcosystemCache[ecosystem] = networks;
    return networks;
  } catch (error) {
    console.error(`Error loading networks for ecosystem ${ecosystem}:`, error);
    networksByEcosystemCache[ecosystem] = [];
    return [];
  }
}

export async function getAllNetworks(): Promise<NetworkConfig[]> {
  if (cachedAllNetworks) return cachedAllNetworks;

  const ecosystems = Object.keys(ecosystemRegistry) as Ecosystem[];
  const promises = ecosystems.map(getNetworksByEcosystem);

  try {
    const results = await Promise.all(promises);
    const combinedNetworks = results.flat();
    cachedAllNetworks = combinedNetworks;
    return combinedNetworks;
  } catch (error) {
    console.error('Error loading networks from one or more adapters:', error);
    cachedAllNetworks = []; // Cache empty array on error to prevent re-fetching immediately
    return [];
  }
}

export async function getNetworkById(id: string): Promise<NetworkConfig | undefined> {
  for (const ecosystemNetworks of Object.values(networksByEcosystemCache)) {
    const network = ecosystemNetworks?.find((n) => n.id === id);
    if (network) return network;
  }
  if (cachedAllNetworks) {
    const network = cachedAllNetworks.find((n) => n.id === id);
    if (network) return network;
  }
  const allNetworks = await getAllNetworks(); // This will populate caches if empty
  return allNetworks.find((network) => network.id === id);
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
      return () => import('@openzeppelin/transaction-form-adapter-evm/dist/config.js');
    case 'solana':
      return () => import('@openzeppelin/transaction-form-adapter-solana/dist/config.js');
    case 'stellar':
      return () => import('@openzeppelin/transaction-form-adapter-stellar/dist/config.js');
    case 'midnight':
      return () => import('@openzeppelin/transaction-form-adapter-midnight/dist/config.js');
    default:
      return undefined;
  }
}

export function getAdapterConfigExportName(ecosystem: Ecosystem): string | undefined {
  return ecosystemRegistry[ecosystem]?.adapterConfigExportName;
}

// --- Adapter Instantiation Logic ---
export async function getAdapter(networkConfig: NetworkConfig): Promise<ContractAdapter> {
  const meta = ecosystemRegistry[networkConfig.ecosystem];
  if (!meta) {
    throw new Error(`No adapter metadata registered for ecosystem: ${networkConfig.ecosystem}`);
  }

  const AdapterClass = await meta.getAdapterClass();

  switch (networkConfig.ecosystem) {
    case 'evm':
      return new (AdapterClass as EvmAdapterConstructor)(networkConfig as EvmNetworkConfig);
    case 'solana':
      return new (AdapterClass as SolanaAdapterConstructor)(networkConfig as SolanaNetworkConfig);
    case 'stellar':
      return new (AdapterClass as StellarAdapterConstructor)(networkConfig as StellarNetworkConfig);
    case 'midnight':
      return new (AdapterClass as MidnightAdapterConstructor)(
        networkConfig as MidnightNetworkConfig
      );
    default:
      const unhandledEcosystem = (networkConfig as NetworkConfig).ecosystem;
      throw new Error(`No adapter constructor for ${String(unhandledEcosystem)}`);
  }
}

// --- Adapter Package Name Map ---
export const adapterPackageMap: Record<Ecosystem, string> = {
  evm: '@openzeppelin/transaction-form-adapter-evm',
  solana: '@openzeppelin/transaction-form-adapter-solana',
  stellar: '@openzeppelin/transaction-form-adapter-stellar',
  midnight: '@openzeppelin/transaction-form-adapter-midnight',
};
