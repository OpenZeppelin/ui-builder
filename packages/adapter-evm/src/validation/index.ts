// Barrel file for validation module
// Re-export all validation functionality from core package
export {
  validateEoaConfig,
  validateEvmEoaConfig,
  validateRelayerConfig,
  validateEvmRelayerConfig,
  isValidEvmAddress,
  type EvmWalletStatus,
} from '@openzeppelin/ui-builder-adapter-evm-core';
