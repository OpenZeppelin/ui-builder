import { describe, expect, it } from 'vitest';

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

    it('should map U64 to number', () => {
      expect(mapStellarParameterTypeToFieldType('U64')).toBe('number');
    });

    it('should map U128 to number', () => {
      expect(mapStellarParameterTypeToFieldType('U128')).toBe('number');
    });

    it('should map U256 to number', () => {
      expect(mapStellarParameterTypeToFieldType('U256')).toBe('number');
    });

    it('should map I32 to number', () => {
      expect(mapStellarParameterTypeToFieldType('I32')).toBe('number');
    });

    it('should map I64 to number', () => {
      expect(mapStellarParameterTypeToFieldType('I64')).toBe('number');
    });

    it('should map I128 to number', () => {
      expect(mapStellarParameterTypeToFieldType('I128')).toBe('number');
    });

    it('should map I256 to number', () => {
      expect(mapStellarParameterTypeToFieldType('I256')).toBe('number');
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

    it('should return compatible types for numeric types', () => {
      const numericTypes = ['U32', 'U64', 'U128', 'U256', 'I32', 'I64', 'I128', 'I256'];

      numericTypes.forEach((type) => {
        const result = getStellarCompatibleFieldTypes(type);
        expect(result).toContain('number');
        expect(result).toContain('amount');
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
