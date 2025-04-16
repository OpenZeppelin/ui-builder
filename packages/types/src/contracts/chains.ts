/**
 * Supported blockchain types in the transaction form builder ecosystem
 */
export type ChainType = 'evm' | 'midnight' | 'stellar' | 'solana';

/**
 * Chain metadata for UI display and configuration
 */
export interface ChainDefinition {
  /**
   * Unique identifier for the chain type
   */
  id: ChainType;

  /**
   * Human-readable name of the chain
   */
  name: string;

  /**
   * Description of the chain's purpose or characteristics
   */
  description: string;

  /**
   * Optional icon for UI display
   * Note: This uses a generic type as we don't want to introduce React dependencies
   */
  icon?: unknown;
}
