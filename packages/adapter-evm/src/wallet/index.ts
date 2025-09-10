// Barrel file for wallet module
export * from './components';
export * from './context';
export * from './hooks';
export * from './types';
export * from './utils/index';
// Export specific functions from utils.ts to avoid conflicts
export { getResolvedWalletComponents, resolveAndInitializeKitConfig } from './utils';
// Keep wagmi-implementation internal
