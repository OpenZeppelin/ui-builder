/**
 * Network Configuration Validation
 *
 * This file contains utilities for validating network configurations to ensure they have
 * all required fields and properly typed values for each ecosystem.
 */
import {
  EvmNetworkConfig,
  isEvmNetworkConfig,
  isMidnightNetworkConfig,
  isSolanaNetworkConfig,
  isStellarNetworkConfig,
  MidnightNetworkConfig,
  NetworkConfig,
  SolanaNetworkConfig,
  StellarNetworkConfig,
} from './config';

/**
 * Validate a network configuration
 * @param config The network configuration to validate
 * @returns True if the configuration is valid
 */
export function validateNetworkConfig(config: NetworkConfig): boolean {
  // Validate common fields required for all networks
  if (!validateBaseNetworkConfig(config)) {
    return false;
  }

  // Ecosystem-specific validation
  if (isEvmNetworkConfig(config)) {
    return validateEvmNetworkConfig(config);
  } else if (isSolanaNetworkConfig(config)) {
    return validateSolanaNetworkConfig(config);
  } else if (isStellarNetworkConfig(config)) {
    return validateStellarNetworkConfig(config);
  } else if (isMidnightNetworkConfig(config)) {
    return validateMidnightNetworkConfig(config);
  }

  // Unknown ecosystem
  return false;
}

/**
 * Validate the base fields common to all network configurations
 * @param config The network configuration to validate
 * @returns True if the base configuration is valid
 */
function validateBaseNetworkConfig(config: NetworkConfig): boolean {
  return (
    typeof config.id === 'string' &&
    config.id.trim().length > 0 &&
    typeof config.name === 'string' &&
    config.name.trim().length > 0 &&
    typeof config.network === 'string' &&
    config.network.trim().length > 0 &&
    ['mainnet', 'testnet', 'devnet'].includes(config.type) &&
    typeof config.isTestnet === 'boolean' &&
    (config.explorerUrl === undefined || typeof config.explorerUrl === 'string')
  );
}

/**
 * Validate an EVM network configuration
 * @param config The EVM network configuration to validate
 * @returns True if the configuration is valid
 */
function validateEvmNetworkConfig(config: EvmNetworkConfig): boolean {
  return (
    typeof config.chainId === 'number' &&
    config.chainId > 0 &&
    typeof config.rpcUrl === 'string' &&
    config.rpcUrl.trim().length > 0 &&
    validateEvmNativeCurrency(config.nativeCurrency)
  );
}

/**
 * Validate the native currency object in an EVM network configuration
 * @param currency The native currency object to validate
 * @returns True if the native currency is valid
 */
function validateEvmNativeCurrency(currency: EvmNetworkConfig['nativeCurrency']): boolean {
  return (
    typeof currency === 'object' &&
    currency !== null &&
    typeof currency.name === 'string' &&
    currency.name.trim().length > 0 &&
    typeof currency.symbol === 'string' &&
    currency.symbol.trim().length > 0 &&
    typeof currency.decimals === 'number' &&
    currency.decimals >= 0
  );
}

/**
 * Validate a Solana network configuration
 * @param config The Solana network configuration to validate
 * @returns True if the configuration is valid
 */
function validateSolanaNetworkConfig(config: SolanaNetworkConfig): boolean {
  return (
    typeof config.rpcEndpoint === 'string' &&
    config.rpcEndpoint.trim().length > 0 &&
    ['confirmed', 'finalized'].includes(config.commitment)
  );
}

/**
 * Validate a Stellar network configuration
 * @param config The Stellar network configuration to validate
 * @returns True if the configuration is valid
 */
function validateStellarNetworkConfig(config: StellarNetworkConfig): boolean {
  return (
    typeof config.horizonUrl === 'string' &&
    config.horizonUrl.trim().length > 0 &&
    typeof config.networkPassphrase === 'string' &&
    config.networkPassphrase.trim().length > 0
  );
}

/**
 * Validate a Midnight network configuration
 * @param config The Midnight network configuration to validate
 * @returns True if the configuration is valid
 */
function validateMidnightNetworkConfig(_config: MidnightNetworkConfig): boolean {
  // Currently just validates the base fields
  // Add more validation as Midnight-specific fields are added
  return true;
}
