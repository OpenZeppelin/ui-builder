/**
 * Chain-Agnostic Enum Types
 *
 * This module defines standardized enum types that work across all blockchain adapters.
 * These types represent the UI layer's understanding of enums before they are converted
 * to blockchain-specific formats by individual adapters.
 */

/**
 * Chain-agnostic enum value representation.
 * This is the standardized format that enum fields produce, regardless of the target blockchain.
 * Each adapter transforms this generic format into its blockchain-specific representation.
 *
 * @example Basic Usage
 * ```typescript
 * Unit variant (no payload)
 * const unitEnum: EnumValue = { tag: "None" };
 *
 * Tuple variant (with payload)
 * const tupleEnum: EnumValue = {
 *   tag: "Some",
 *   values: ["hello", 42]
 * };
 * ```
 *
 * @example Cross-Chain Compatibility
 * ```typescript
 * Stellar/Soroban: Transforms to ScVec([Symbol("Active"), payload?])
 * const stellarEnum: EnumValue = { tag: "Active", values: [123] };
 * → ScVec([Symbol("Active"), ScU32(123)])
 *
 * EVM/Solidity: Transforms to integer or struct
 * const evmEnum: EnumValue = { tag: "Pending" };
 * → uint8(0) for simple enums
 * → { variant: 0, data: [...] } for complex enums
 *
 * Solana/Rust: Transforms to Borsh-encoded enum
 * const solanaEnum: EnumValue = { tag: "Ok", values: ["success"] };
 * → Result::Ok("success") via Borsh serialization
 *
 * Complex nested example
 * const complexEnum: EnumValue = {
 *   tag: "TransferResult",
 *   values: [
 *     { tag: "Success", values: ["0x123...", 1000] },
 *     { tag: "Error", values: ["Insufficient funds"] }
 *   ]
 * };
 * ```
 */
export interface EnumValue {
  /** The variant name (e.g., 'None', 'Some', 'Success', 'Error') */
  tag: string;
  /** Optional payload values for tuple variants */
  values?: unknown[];
}

/**
 * Type guard to check if a value is an EnumValue
 */
export function isEnumValue(value: unknown): value is EnumValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'tag' in value &&
    typeof (value as Record<string, unknown>).tag === 'string' &&
    (!('values' in value) || Array.isArray((value as Record<string, unknown>).values))
  );
}
