import { describe, expect, it } from 'vitest';

import { SOLANA_TYPE_TO_FIELD_TYPE } from '../constants';
import { getSolanaCompatibleFieldTypes, mapSolanaParamTypeToFieldType } from '../type-mapper';

describe('Solana Type Mapper', () => {
  describe('mapSolanaParamTypeToFieldType', () => {
    it('should map string to text', () => {
      expect(mapSolanaParamTypeToFieldType('string')).toBe('text');
    });

    it('should map u64 to number', () => {
      expect(mapSolanaParamTypeToFieldType('u64')).toBe('number');
    });

    it('should map publicKey to blockchain-address', () => {
      expect(mapSolanaParamTypeToFieldType('publicKey')).toBe('blockchain-address');
    });

    it('should default to text for unknown types', () => {
      expect(mapSolanaParamTypeToFieldType('unknown')).toBe('text');
    });
  });

  describe('getSolanaCompatibleFieldTypes', () => {
    it('should return compatible field types for known types', () => {
      const result = getSolanaCompatibleFieldTypes('u64');
      expect(result).toContain('number');
      expect(result).toContain('text');
    });

    it('should default to text for unknown types', () => {
      const result = getSolanaCompatibleFieldTypes('unknown');
      expect(result).toContain('text');
    });
  });
});

describe('SOLANA_TYPE_TO_FIELD_TYPE constant', () => {
  it('should be an object with primitive types', () => {
    const primitiveTypes = Object.keys(SOLANA_TYPE_TO_FIELD_TYPE);
    expect(Array.isArray(primitiveTypes)).toBe(true);
    expect(primitiveTypes.length).toBeGreaterThan(0);
  });

  it('should contain expected Solana primitive types', () => {
    const primitiveTypes = Object.keys(SOLANA_TYPE_TO_FIELD_TYPE);
    expect(primitiveTypes).toContain('string');
    expect(primitiveTypes).toContain('u64');
    expect(primitiveTypes).toContain('publicKey');
  });

  it('should map all types to valid FieldType values', () => {
    const validFieldTypes = [
      'text',
      'textarea',
      'number',
      'bigint',
      'checkbox',
      'select',
      'radio',
      'blockchain-address',
      'bytes',
      'array',
      'array-object',
      'object',
      'map',
    ];

    Object.values(SOLANA_TYPE_TO_FIELD_TYPE).forEach((fieldType) => {
      expect(validFieldTypes).toContain(fieldType);
    });
  });
});
