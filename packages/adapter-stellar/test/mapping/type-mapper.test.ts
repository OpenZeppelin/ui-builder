import { describe, expect, it } from 'vitest';

import { STELLAR_TYPE_TO_FIELD_TYPE } from '../../src/mapping/constants';
import {
  getStellarCompatibleFieldTypes,
  mapStellarParameterTypeToFieldType,
} from '../../src/mapping/type-mapper';

describe('mapStellarParameterTypeToFieldType', () => {
  // Test primitive Soroban types
  describe('primitive types', () => {
    it('should map Address to blockchain-address', () => {
      expect(mapStellarParameterTypeToFieldType('Address')).toBe('blockchain-address');
    });

    it('should map ScString to text', () => {
      expect(mapStellarParameterTypeToFieldType('ScString')).toBe('text');
    });

    it('should map ScSymbol to text', () => {
      expect(mapStellarParameterTypeToFieldType('ScSymbol')).toBe('text');
    });

    it('should map Bool to checkbox', () => {
      expect(mapStellarParameterTypeToFieldType('Bool')).toBe('checkbox');
    });

    it('should map U32 to number', () => {
      expect(mapStellarParameterTypeToFieldType('U32')).toBe('number');
    });

    it('should map U64 to bigint', () => {
      expect(mapStellarParameterTypeToFieldType('U64')).toBe('bigint');
    });

    it('should map U128 to bigint', () => {
      expect(mapStellarParameterTypeToFieldType('U128')).toBe('bigint');
    });

    it('should map U256 to bigint', () => {
      expect(mapStellarParameterTypeToFieldType('U256')).toBe('bigint');
    });

    it('should map I32 to number', () => {
      expect(mapStellarParameterTypeToFieldType('I32')).toBe('number');
    });

    it('should map I64 to bigint', () => {
      expect(mapStellarParameterTypeToFieldType('I64')).toBe('bigint');
    });

    it('should map I128 to bigint', () => {
      expect(mapStellarParameterTypeToFieldType('I128')).toBe('bigint');
    });

    it('should map I256 to bigint', () => {
      expect(mapStellarParameterTypeToFieldType('I256')).toBe('bigint');
    });

    it('should map Bytes to bytes', () => {
      expect(mapStellarParameterTypeToFieldType('Bytes')).toBe('bytes');
    });

    it('should map DataUrl to bytes', () => {
      expect(mapStellarParameterTypeToFieldType('DataUrl')).toBe('bytes');
    });
  });

  // Test complex types
  describe('complex types', () => {
    it('should map Vec to array', () => {
      expect(mapStellarParameterTypeToFieldType('Vec')).toBe('array');
    });

    it('should map Map to map', () => {
      expect(mapStellarParameterTypeToFieldType('Map')).toBe('map');
    });

    it('should map custom struct types to object', () => {
      expect(mapStellarParameterTypeToFieldType('CustomStruct')).toBe('object');
    });

    it('should map Tuple to object', () => {
      expect(mapStellarParameterTypeToFieldType('Tuple')).toBe('object');
    });

    it('should map Enum types to select', () => {
      expect(mapStellarParameterTypeToFieldType('Enum')).toBe('select');
    });
  });

  // Test array types
  describe('array types', () => {
    it('should map Vec<U32> to array', () => {
      expect(mapStellarParameterTypeToFieldType('Vec<U32>')).toBe('array');
    });

    it('should map Vec<Address> to array', () => {
      expect(mapStellarParameterTypeToFieldType('Vec<Address>')).toBe('array');
    });

    it('should map Vec<CustomType> to array-object', () => {
      expect(mapStellarParameterTypeToFieldType('Vec<CustomStruct>')).toBe('array-object');
    });
  });

  // Test unknown/default types
  describe('unknown types', () => {
    it('should default to text for unknown types', () => {
      expect(mapStellarParameterTypeToFieldType('UnknownType')).toBe('text');
    });

    it('should default to text for empty string', () => {
      expect(mapStellarParameterTypeToFieldType('')).toBe('text');
    });
  });
});

describe('getStellarCompatibleFieldTypes', () => {
  describe('primitive types compatibility', () => {
    it('should return compatible types for Address', () => {
      const result = getStellarCompatibleFieldTypes('Address');
      expect(result).toContain('blockchain-address');
      expect(result).toContain('text');
    });

    it('should return compatible types for small numeric types', () => {
      const smallNumericTypes = ['U32', 'I32'];

      smallNumericTypes.forEach((type) => {
        const result = getStellarCompatibleFieldTypes(type);
        expect(result).toContain('number');
        expect(result).toContain('amount');
        expect(result).toContain('text');
      });
    });

    it('should return compatible types for large numeric types (64-bit+)', () => {
      const largeNumericTypes = ['U64', 'U128', 'U256', 'I64', 'I128', 'I256'];

      largeNumericTypes.forEach((type) => {
        const result = getStellarCompatibleFieldTypes(type);
        expect(result[0]).toBe('bigint'); // First (recommended) type
        expect(result).toContain('number');
        expect(result).toContain('text');
      });
    });

    it('should return compatible types for Bool', () => {
      const result = getStellarCompatibleFieldTypes('Bool');
      expect(result).toContain('checkbox');
      expect(result).toContain('select');
      expect(result).toContain('radio');
      expect(result).toContain('text');
    });

    it('should return compatible types for string types', () => {
      const stringTypes = ['ScString', 'ScSymbol'];

      stringTypes.forEach((type) => {
        const result = getStellarCompatibleFieldTypes(type);
        expect(result).toContain('text');
        expect(result).toContain('textarea');
      });
    });

    it('should return compatible types for byte types', () => {
      const byteTypes = ['Bytes', 'DataUrl'];

      byteTypes.forEach((type) => {
        const result = getStellarCompatibleFieldTypes(type);
        expect(result).toContain('textarea');
        expect(result).toContain('text');
      });
    });
  });

  describe('complex types compatibility', () => {
    it('should return compatible types for Vec', () => {
      const result = getStellarCompatibleFieldTypes('Vec');
      expect(result).toContain('array');
      expect(result).toContain('textarea');
      expect(result).toContain('text');
    });

    it('should return compatible types for Vec<CustomType>', () => {
      const result = getStellarCompatibleFieldTypes('Vec<CustomStruct>');
      expect(result).toContain('array-object');
      expect(result).toContain('textarea');
      expect(result).toContain('text');
    });

    it('should return compatible types for Map', () => {
      const result = getStellarCompatibleFieldTypes('Map');
      expect(result).toContain('map');
      expect(result).toContain('textarea');
      expect(result).toContain('text');
    });

    it('should return compatible types for custom struct', () => {
      const result = getStellarCompatibleFieldTypes('CustomStruct');
      expect(result).toContain('object');
      expect(result).toContain('textarea');
      expect(result).toContain('text');
    });
  });

  describe('unknown types compatibility', () => {
    it('should default to text for unknown types', () => {
      const result = getStellarCompatibleFieldTypes('UnknownType');
      expect(result).toEqual(['text']);
    });
  });
});

describe('STELLAR_TYPE_TO_FIELD_TYPE constant', () => {
  it('should contain expected Stellar primitive types', () => {
    const primitiveTypes = Object.keys(STELLAR_TYPE_TO_FIELD_TYPE);

    // Core Stellar/Soroban primitive types
    expect(primitiveTypes).toContain('Address');
    expect(primitiveTypes).toContain('Bool');
    expect(primitiveTypes).toContain('ScString');
    expect(primitiveTypes).toContain('ScSymbol');
    expect(primitiveTypes).toContain('Bytes');

    // Unsigned integers
    expect(primitiveTypes).toContain('U32');
    expect(primitiveTypes).toContain('U64');
    expect(primitiveTypes).toContain('U128');
    expect(primitiveTypes).toContain('U256');

    // Signed integers
    expect(primitiveTypes).toContain('I32');
    expect(primitiveTypes).toContain('I64');
    expect(primitiveTypes).toContain('I128');
    expect(primitiveTypes).toContain('I256');
  });

  it('should NOT include dynamic types like Vec or Map', () => {
    const primitiveTypes = Object.keys(STELLAR_TYPE_TO_FIELD_TYPE);

    primitiveTypes.forEach((type) => {
      // Should not include generic type wrappers
      expect(type).not.toMatch(/^Vec</);
      expect(type).not.toMatch(/^Map</);
      expect(type).not.toMatch(/^Option</);
    });
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

    Object.values(STELLAR_TYPE_TO_FIELD_TYPE).forEach((fieldType) => {
      expect(validFieldTypes).toContain(fieldType);
    });
  });
});
