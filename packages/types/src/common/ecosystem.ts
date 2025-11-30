/**
 * Blockchain Ecosystem Types
 *
 * This file defines core types related to blockchain ecosystems supported
 * by the UI Builder. It consolidates previously scattered
 * ecosystem-related types into a single source of truth.
 */

/**
 * Supported blockchain ecosystems
 */
export type Ecosystem = 'evm' | 'solana' | 'stellar' | 'midnight';

/**
 * Network environment types
 */
export type NetworkType = 'mainnet' | 'testnet' | 'devnet';

/**
 * Configuration for ecosystem feature flags
 */
export interface EcosystemFeatureConfig {
  /** Whether the ecosystem is enabled and functional */
  enabled: boolean;
  /** Whether to show the ecosystem in the UI (even if disabled) */
  showInUI: boolean;
  /** Label to display when the ecosystem is disabled */
  disabledLabel?: string;
  /** Description to show when the ecosystem is disabled */
  disabledDescription?: string;
}

/**
 * Interface for ecosystem-specific data in the registry
 */
export interface EcosystemInfo {
  /** Display name (e.g., 'Ethereum (EVM)') */
  name: string;

  /** Detailed description of the blockchain */
  description: string;

  /** Explorer/verification platform guidance */
  explorerGuidance: string;

  /** Address format example (if applicable) */
  addressExample?: string;

  /** Icon path for the ecosystem (if available) */
  iconPath?: string;

  /** Network icon name for @web3icons/react NetworkIcon component */
  networkIconName?: string;

  /** Background color class for UI elements */
  bgColorClass?: string;

  /** Text color class for UI elements */
  textColorClass?: string;

  /** Default feature flag configuration */
  defaultFeatureConfig: EcosystemFeatureConfig;
}

/**
 * Blockchain ecosystem metadata for UI display and configuration
 */
export interface EcosystemDefinition {
  /**
   * Unique identifier for the ecosystem
   */
  id: Ecosystem;

  /**
   * Human-readable name of the ecosystem
   */
  name: string;

  /**
   * Description of the ecosystem's purpose or characteristics
   */
  description: string;

  /**
   * Optional icon for UI display
   * Note: This uses a generic type as we don't want to introduce React dependencies
   */
  icon?: unknown;
}

/**
 * Type guards for ecosystem types
 */

export const isEvmEcosystem = (ecosystem: Ecosystem): ecosystem is 'evm' => ecosystem === 'evm';

export const isSolanaEcosystem = (ecosystem: Ecosystem): ecosystem is 'solana' =>
  ecosystem === 'solana';

export const isStellarEcosystem = (ecosystem: Ecosystem): ecosystem is 'stellar' =>
  ecosystem === 'stellar';

export const isMidnightEcosystem = (ecosystem: Ecosystem): ecosystem is 'midnight' =>
  ecosystem === 'midnight';
