import { EvmAdapter } from '@openzeppelin/transaction-form-adapter-evm';
import { MidnightAdapter } from '@openzeppelin/transaction-form-adapter-midnight';
import { SolanaAdapter } from '@openzeppelin/transaction-form-adapter-solana';
import { StellarAdapter } from '@openzeppelin/transaction-form-adapter-stellar';
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

type AnyAdapterConstructor = new (networkConfig: NetworkConfig) => ContractAdapter;

// Define the structure for each ecosystem's metadata
interface EcosystemMetadata {
  networksExportName: string; // e.g., 'evmNetworks'
  AdapterClass: AnyAdapterConstructor;
  adapterConfigPackagePath?: string; // e.g., '@openzeppelin/transaction-form-adapter-evm/dist/config.js'
  adapterConfigExportName?: string; // e.g., 'evmAdapterConfig'
}

// Centralized configuration for each ecosystem
const ecosystemRegistry: Record<Ecosystem, EcosystemMetadata> = {
  evm: {
    networksExportName: 'evmNetworks',
    AdapterClass: EvmAdapter as AnyAdapterConstructor,
    adapterConfigPackagePath: '@openzeppelin/transaction-form-adapter-evm/dist/config.js',
    adapterConfigExportName: 'evmAdapterConfig',
  },
  solana: {
    networksExportName: 'solanaNetworks',
    AdapterClass: SolanaAdapter as AnyAdapterConstructor,
    adapterConfigPackagePath: '@openzeppelin/transaction-form-adapter-solana/dist/config.js',
    adapterConfigExportName: 'solanaAdapterConfig',
  },
  stellar: {
    networksExportName: 'stellarNetworks',
    AdapterClass: StellarAdapter as AnyAdapterConstructor,
    adapterConfigPackagePath: '@openzeppelin/transaction-form-adapter-stellar/dist/config.js',
    adapterConfigExportName: 'stellarAdapterConfig',
  },
  midnight: {
    networksExportName: 'midnightNetworks',
    AdapterClass: MidnightAdapter as AnyAdapterConstructor,
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

// --- Adapter Instantiation Logic (adapted from adapterRegistry.ts) ---
export function getAdapter(networkConfig: NetworkConfig): ContractAdapter {
  const meta = ecosystemRegistry[networkConfig.ecosystem];
  if (!meta) {
    throw new Error(`No adapter metadata registered for ecosystem: ${networkConfig.ecosystem}`);
  }

  // The switch statement handles the specific type casting for networkConfig
  // The AdapterClass is cast to AnyAdapterConstructor in the registry, which is compatible.
  switch (networkConfig.ecosystem) {
    case 'evm':
      return new meta.AdapterClass(networkConfig as EvmNetworkConfig);
    case 'solana':
      return new meta.AdapterClass(networkConfig as SolanaNetworkConfig);
    case 'stellar':
      return new meta.AdapterClass(networkConfig as StellarNetworkConfig);
    case 'midnight':
      return new meta.AdapterClass(networkConfig as MidnightNetworkConfig);
    default:
      const unhandledEcosystem = (networkConfig as NetworkConfig).ecosystem;
      throw new Error(
        `No adapter constructor available for unhandled ecosystem: ${String(unhandledEcosystem)}`
      );
  }
}

// --- Adapter Package Name Map ---
export const adapterPackageMap: Record<Ecosystem, string> = {
  evm: '@openzeppelin/transaction-form-adapter-evm',
  solana: '@openzeppelin/transaction-form-adapter-solana',
  stellar: '@openzeppelin/transaction-form-adapter-stellar',
  midnight: '@openzeppelin/transaction-form-adapter-midnight',
};
