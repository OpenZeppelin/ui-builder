import type { FieldType } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { STELLAR_TYPE_TO_FIELD_TYPE } from './constants';
import { mapStellarParameterTypeToFieldType } from './type-mapper';

/**
 * Known Stellar/Soroban types that should have explicit mappings
 * This list should be updated when new types are added to the Stellar SDK
 */
export const KNOWN_STELLAR_TYPES = [
  // Primitives
  'Val',
  'Bool',
  'Void',
  'Error',
  'U32',
  'I32',
  'U64',
  'I64',
  'U128',
  'I128',
  'U256',
  'I256',
  'Timepoint',
  'Duration',

  // Strings & Bytes
  'ScString',
  'ScSymbol',
  'Bytes',

  // Addresses
  'Address',
  'MuxedAddress',

  // Note: Vec, Map, Tuple, Option, Result, BytesN are handled dynamically
] as const;

/**
 * Validate that all known Stellar types have appropriate field type mappings
 */
export function validateTypeMappingCompleteness(): {
  success: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check explicit mappings
  for (const stellarType of KNOWN_STELLAR_TYPES) {
    if (!STELLAR_TYPE_TO_FIELD_TYPE[stellarType]) {
      // Try the dynamic mapper
      try {
        const fieldType = mapStellarParameterTypeToFieldType(stellarType);
        if (
          fieldType === 'text' &&
          !stellarType.includes('String') &&
          !stellarType.includes('Symbol')
        ) {
          warnings.push(
            `Type "${stellarType}" defaults to 'text' - consider adding explicit mapping`
          );
        }
      } catch (error) {
        missing.push(stellarType);
        logger.warn('validateTypeMappingCompleteness', `No mapping for type: ${stellarType}`);
      }
    }
  }

  // Validate field type consistency
  const fieldTypes = Object.values(STELLAR_TYPE_TO_FIELD_TYPE) as FieldType[];
  const validFieldTypes: FieldType[] = [
    'text',
    'number',
    'textarea',
    'checkbox',
    'select',
    'radio',
    'blockchain-address',
    'object',
    'array',
    'array-object',
  ];

  for (const fieldType of fieldTypes) {
    if (!validFieldTypes.includes(fieldType)) {
      warnings.push(`Unknown field type used: ${fieldType}`);
    }
  }

  const success = missing.length === 0;

  if (!success) {
    logger.error('validateTypeMappingCompleteness', 'Missing type mappings found!', {
      missing,
      warnings,
      knownTypesCount: KNOWN_STELLAR_TYPES.length,
      explicitMappingsCount: Object.keys(STELLAR_TYPE_TO_FIELD_TYPE).length,
    });
  }

  return { success, missing, warnings };
}

/**
 * Runtime type discovery - tracks types encountered during contract loading
 */
class TypeTracker {
  private encounteredTypes = new Set<string>();
  private missedTypes = new Set<string>();

  trackType(type: string, wasHandled: boolean) {
    this.encounteredTypes.add(type);
    if (!wasHandled) {
      this.missedTypes.add(type);
    }
  }

  getReport() {
    return {
      totalTypes: this.encounteredTypes.size,
      encounteredTypes: Array.from(this.encounteredTypes).sort(),
      missedTypes: Array.from(this.missedTypes).sort(),
      coveragePercentage:
        ((this.encounteredTypes.size - this.missedTypes.size) / this.encounteredTypes.size) * 100,
    };
  }

  reset() {
    this.encounteredTypes.clear();
    this.missedTypes.clear();
  }
}

export const globalTypeTracker = new TypeTracker();

// Auto-validate on module load in development
if (process.env.NODE_ENV === 'development') {
  const validation = validateTypeMappingCompleteness();
  if (validation.warnings.length > 0) {
    console.warn('🟡 Stellar Type Mapping Warnings:', validation.warnings);
  }
  if (!validation.success) {
    console.error('🔴 Stellar Type Mapping Validation Failed:', validation);
  } else {
    console.log('✅ Stellar Type Mapping Validation Passed');
  }
}
