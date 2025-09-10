/**
 * Type definitions for Stellar/Soroban contract argument parsing.
 * These types support both simple form inputs and complex structures.
 */

/**
 * Enhanced argument structure for complex Soroban contract calls.
 * Supports both simple form inputs and complex structures.
 */
export interface SorobanArgumentValue {
  value: string | number | boolean | SorobanArgumentValue | SorobanArgumentValue[];
  type: string;
}

export interface SorobanEnumValue {
  tag?: string;
  values?: SorobanArgumentValue[];
  enum?: string | number;
}

export interface SorobanMapEntry {
  '0': SorobanArgumentValue; // key
  '1': SorobanArgumentValue; // value
}

export type SorobanComplexValue =
  | SorobanArgumentValue
  | SorobanArgumentValue[]
  | SorobanArgumentValue[][]
  | SorobanEnumValue
  | SorobanMapEntry[]
  | SorobanMapEntry[][]
  | SorobanMapEntry
  | Record<string, SorobanArgumentValue>
  | Record<string, SorobanArgumentValue>[];
