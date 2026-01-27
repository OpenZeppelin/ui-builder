/**
 * RainbowKit utilities for EVM-compatible adapters
 */

// Config generation utilities
export {
  generateRainbowKitConfigFile,
  generateRainbowKitExportables,
  type RainbowKitConfigOptions,
} from './config-generator';

// RainbowKit types
export {
  type AppInfo,
  type RainbowKitConnectButtonProps,
  type RainbowKitProviderProps,
  type RainbowKitKitConfig,
  type RainbowKitCustomizations,
  isRainbowKitCustomizations,
  extractRainbowKitCustomizations,
} from './types';

// RainbowKit utility functions
export { validateRainbowKitConfig, getRawUserNativeConfig } from './utils';

// RainbowKit component factory
export { createRainbowKitConnectButton } from './components';
export { createRainbowKitComponents } from './componentFactory';
