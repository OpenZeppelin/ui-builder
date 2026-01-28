// Barrel file for wallet module
export { EvmWalletUiRoot } from './components/EvmWalletUiRoot';
export * from './hooks';
export * from './types';
export * from './utils/index';
// Export specific functions from utils.ts to avoid conflicts
export { getResolvedWalletComponents } from './utils';
// Keep wagmi-implementation internal
