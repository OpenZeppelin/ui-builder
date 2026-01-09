import type { FieldType, TypeMappingInfo } from '@openzeppelin/ui-types';

// Placeholder
export const SOLANA_TYPE_TO_FIELD_TYPE: Record<string, FieldType> = {
  string: 'text',
  u64: 'number',
  publicKey: 'blockchain-address',
  // Add more Solana types
};

/**
 * Solana dynamic type patterns from Anchor IDL.
 */
const SOLANA_DYNAMIC_PATTERNS: TypeMappingInfo['dynamicPatterns'] = [
  { name: 'vec', syntax: 'Vec<T>', mapsTo: 'array', description: 'Dynamic array from Anchor IDL' },
  {
    name: 'option',
    syntax: 'Option<T>',
    mapsTo: 'unwrap',
    description: 'Optional, resolves to inner type',
  },
  {
    name: 'defined',
    syntax: 'defined',
    mapsTo: 'object',
    description: 'Custom struct from Anchor IDL',
  },
];

/**
 * Returns complete type mapping information for Solana.
 */
export function getSolanaTypeMappingInfo(): TypeMappingInfo {
  return {
    primitives: { ...SOLANA_TYPE_TO_FIELD_TYPE },
    dynamicPatterns: SOLANA_DYNAMIC_PATTERNS,
  };
}
