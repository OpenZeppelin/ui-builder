/**
 * Validation Module
 *
 * Execution configuration validation for EVM transactions.
 *
 * @module validation
 */

export { validateEoaConfig, validateEvmEoaConfig, type EvmWalletStatus } from './eoa';
export { validateRelayerConfig, validateEvmRelayerConfig } from './relayer';

// Re-export address validation from utils for convenience
export { isValidEvmAddress } from '../utils/validation';
