/**
 * Centralized Adapter Registry
 *
 * Provides mappings and accessors for different blockchain ecosystem adapters.
 */
// Import adapter implementations
import { EvmAdapter } from '@openzeppelin/transaction-form-adapter-evm';
import { MidnightAdapter } from '@openzeppelin/transaction-form-adapter-midnight';
import { SolanaAdapter } from '@openzeppelin/transaction-form-adapter-solana';
import { StellarAdapter } from '@openzeppelin/transaction-form-adapter-stellar';
import type { ContractAdapter, Ecosystem } from '@openzeppelin/transaction-form-types';

import type { AdapterConfig } from '../core/types/AdapterTypes';

// --- Adapter Instance Map ---
const adapterInstances: Record<Ecosystem, ContractAdapter> = {
  evm: new EvmAdapter(),
  solana: new SolanaAdapter(),
  stellar: new StellarAdapter(),
  midnight: new MidnightAdapter(),
};

// --- Adapter Package Name Map ---
export const adapterPackageMap: Record<Ecosystem, string> = {
  evm: '@openzeppelin/transaction-form-adapter-evm',
  solana: '@openzeppelin/transaction-form-adapter-solana',
  stellar: '@openzeppelin/transaction-form-adapter-stellar',
  midnight: '@openzeppelin/transaction-form-adapter-midnight',
};

// --- Adapter Config Path Map ---
// Defines the path within each adapter package where the config file resides.
// Assumes a consistent build output structure (`dist/config.js`).
export const adapterConfigPathMap: Record<Ecosystem, string> = {
  evm: `${adapterPackageMap.evm}/dist/config.js`,
  solana: `${adapterPackageMap.solana}/dist/config.js`,
  stellar: `${adapterPackageMap.stellar}/dist/config.js`,
  midnight: `${adapterPackageMap.midnight}/dist/config.js`,
};

// --- Adapter Config Export Name Map ---
// Defines the name of the exported configuration variable within each adapter's config module.
export const adapterConfigExportMap: Record<Ecosystem, string> = {
  evm: 'evmAdapterConfig',
  solana: 'solanaAdapterConfig',
  stellar: 'stellarAdapterConfig',
  midnight: 'midnightAdapterConfig',
};

// --- Adapter Config Loaders Map ---
// Provides async functions to load the specific config module for each ecosystem.
// Using functions with static imports avoids dynamic import analysis issues.
// REF: https://github.com/vitejs/vite/issues/14102
export const adapterConfigLoaders: Record<
  Ecosystem,
  () => Promise<Record<string, AdapterConfig | unknown>>
> = {
  evm: () => import('@openzeppelin/transaction-form-adapter-evm/dist/config.js'),
  solana: () => import('@openzeppelin/transaction-form-adapter-solana/dist/config.js'),
  stellar: () => import('@openzeppelin/transaction-form-adapter-stellar/dist/config.js'),
  midnight: () => import('@openzeppelin/transaction-form-adapter-midnight/dist/config.js'),
};

/**
 * Gets the singleton adapter instance for a given ecosystem.
 *
 * @param ecosystem The blockchain ecosystem (e.g., 'evm', 'solana')
 * @returns The corresponding ContractAdapter instance.
 * @throws If no adapter is available for the specified ecosystem.
 */
export function getAdapter(ecosystem: Ecosystem): ContractAdapter {
  const adapter = adapterInstances[ecosystem];
  if (!adapter) {
    throw new Error(`No adapter instance available for ecosystem: ${ecosystem}`);
  }
  return adapter;
}
