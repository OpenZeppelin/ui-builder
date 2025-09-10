/**
 * Chain-Agnostic Map Types
 *
 * This module defines standardized map types that work across all blockchain adapters.
 * These types represent the UI layer's understanding of maps before they are converted
 * to blockchain-specific formats by individual adapters.
 */

/**
 * Chain-agnostic map entry representation.
 * This is the standardized format that map fields produce, regardless of the target blockchain.
 * Each adapter transforms this generic format into its blockchain-specific representation.
 *
 * @example Basic Usage
 * ```typescript
 * Simple key-value pairs
 * const stringMap: MapEntry[] = [
 *   { key: "name", value: "Alice" },
 *   { key: "age", value: 30 }
 * ];
 *
 * Mixed type pairs
 * const mixedMap: MapEntry[] = [
 *   { key: "config", value: { enabled: true, timeout: 5000 } },
 *   { key: "tags", value: ["production", "api"] }
 * ];
 * ```
 *
 * @example Cross-Chain Compatibility
 * ```typescript
 * Stellar/Soroban: Transforms to SorobanMapEntry[]
 * const stellarMap: MapEntry[] = [
 *   { key: "symbol", value: "USDC" },
 *   { key: "decimals", value: 6 }
 * ];
 * → [
 *   { key: ScSymbol("symbol"), value: ScSymbol("USDC") },
 *   { key: ScSymbol("decimals"), value: ScU32(6) }
 * ]
 *
 * EVM/Solidity: Transforms to struct array (mappings not supported in function params)
 * const evmMap: MapEntry[] = [
 *   { key: "0x123...", value: 1000 },
 *   { key: "0x456...", value: 2000 }
 * ];
 * → AddressAmount[] struct array for function parameters
 *
 * Complex nested maps
 * const nestedMap: MapEntry[] = [
 *   {
 *     key: "user_data",
 *     value: [
 *       { key: "balance", value: "1000" },
 *       { key: "permissions", value: ["read", "write"] }
 *     ]
 *   }
 * ];
 * ```
 */
export interface MapEntry {
  /** The map key (can be any serializable type) */
  key: unknown;
  /** The map value (can be any serializable type) */
  value: unknown;
}

/**
 * Type guard to check if a value is a MapEntry
 */
export function isMapEntry(value: unknown): value is MapEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'key' in value &&
    'value' in value &&
    Object.keys(value).length >= 2
  );
}

/**
 * Type guard to check if a value is an array of MapEntry objects
 */
export function isMapEntryArray(value: unknown): value is MapEntry[] {
  return Array.isArray(value) && value.every(isMapEntry);
}
