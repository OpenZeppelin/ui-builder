// Re-export types from core
export type {
  AppInfo,
  RainbowKitConnectButtonProps,
  RainbowKitProviderProps,
  RainbowKitKitConfig,
  RainbowKitCustomizations,
} from '@openzeppelin/ui-builder-adapter-evm-core';

export {
  isRainbowKitCustomizations,
  extractRainbowKitCustomizations,
  validateRainbowKitConfig,
  getRawUserNativeConfig,
} from '@openzeppelin/ui-builder-adapter-evm-core';

// EVM-specific components
export { RainbowKitConnectButton } from './components';

// EVM-specific factory functions
export { createRainbowKitComponents } from './componentFactory';

// EVM-specific config service (creates RainbowKit wagmi config)
export { createRainbowKitWagmiConfig, getWagmiConfigForRainbowKit } from './config-service';
