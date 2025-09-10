import { describe, expect, it } from 'vitest';

import {
  extractMapTypes,
  extractOptionElementType,
  extractVecElementType,
  isValidTypeString,
} from '../../src/utils/safe-type-parser';

describe('safe-type-parser', () => {
  describe('extractVecElementType', () => {
    describe('valid Vec types', () => {
      it('should extract simple element types', () => {
        expect(extractVecElementType('Vec<U32>')).toBe('U32');
        expect(extractVecElementType('Vec<Address>')).toBe('Address');
        expect(extractVecElementType('Vec<Bool>')).toBe('Bool');
        expect(extractVecElementType('Vec<ScString>')).toBe('ScString');
      });

      it('should extract nested Vec types', () => {
        expect(extractVecElementType('Vec<Vec<U32>>')).toBe('Vec<U32>');
        expect(extractVecElementType('Vec<Vec<Address>>')).toBe('Vec<Address>');
        expect(extractVecElementType('Vec<Option<U32>>')).toBe('Option<U32>');
      });

      it('should extract complex nested types', () => {
        expect(extractVecElementType('Vec<Map<Symbol,Bytes>>')).toBe('Map<Symbol,Bytes>');
        expect(extractVecElementType('Vec<Vec<Vec<U32>>>')).toBe('Vec<Vec<U32>>');
        expect(extractVecElementType('Vec<Option<Vec<Address>>>')).toBe('Option<Vec<Address>>');
      });

      it('should handle types with spaces', () => {
        expect(extractVecElementType('Vec< U32 >')).toBe('U32');
        expect(extractVecElementType('Vec< Map<Symbol, Bytes> >')).toBe('Map<Symbol, Bytes>');
      });
    });

    describe('invalid Vec types', () => {
      it('should return null for non-Vec types', () => {
        expect(extractVecElementType('U32')).toBeNull();
        expect(extractVecElementType('Address')).toBeNull();
        expect(extractVecElementType('Map<Symbol,Bytes>')).toBeNull();
        expect(extractVecElementType('Option<U32>')).toBeNull();
      });

      it('should return null for malformed Vec types', () => {
        expect(extractVecElementType('Vec<')).toBeNull();
        expect(extractVecElementType('Vec>')).toBeNull();
        expect(extractVecElementType('Vec')).toBeNull();
        expect(extractVecElementType('Vec<>')).toBeNull();
      });

      it('should return null for unbalanced brackets', () => {
        expect(extractVecElementType('Vec<U32')).toBeNull();
        expect(extractVecElementType('Vec<Vec<U32>')).toBeNull();
        expect(extractVecElementType('Vec<U32>>')).toBeNull();
        expect(extractVecElementType('Vec<<U32>')).toBeNull();
      });

      it('should return null for invalid characters', () => {
        expect(extractVecElementType('Vec<U32\n>')).toBeNull();
        expect(extractVecElementType('Vec<U32\r>')).toBeNull();
        expect(extractVecElementType('Vec<U32\x00>')).toBeNull();
      });
    });

    describe('security scenarios', () => {
      it('should handle potential ReDoS attack strings safely', () => {
        // These would have caused exponential backtracking with the old regex
        const maliciousStrings = [
          'Vec<' + 'Vec<'.repeat(100) + 'U32' + '>'.repeat(100),
          'Vec<' + 'a'.repeat(1000) + '>',
          'Vec<Vec<Vec<Vec<Vec<Vec<Vec<Vec<Vec<Vec<U32>>>>>>>>>>',
        ];

        maliciousStrings.forEach((str) => {
          expect(() => extractVecElementType(str)).not.toThrow();
          // Should return null or valid result, never hang
          const result = extractVecElementType(str);
          expect(result === null || typeof result === 'string').toBe(true);
        });
      });

      it('should reject extremely long input strings', () => {
        const longString = 'Vec<' + 'U'.repeat(2000) + '>';
        expect(extractVecElementType(longString)).toBeNull();
      });
    });
  });

  describe('extractMapTypes', () => {
    describe('valid Map types', () => {
      it('should extract simple key-value types', () => {
        expect(extractMapTypes('Map<U32,Address>')).toEqual({
          keyType: 'U32',
          valueType: 'Address',
        });
        expect(extractMapTypes('Map<Symbol,Bytes>')).toEqual({
          keyType: 'Symbol',
          valueType: 'Bytes',
        });
      });

      it('should extract types with spaces', () => {
        expect(extractMapTypes('Map< U32 , Address >')).toEqual({
          keyType: 'U32',
          valueType: 'Address',
        });
        expect(extractMapTypes('Map<Symbol, Bytes>')).toEqual({
          keyType: 'Symbol',
          valueType: 'Bytes',
        });
      });

      it('should extract nested generic types', () => {
        expect(extractMapTypes('Map<Symbol,Vec<U32>>')).toEqual({
          keyType: 'Symbol',
          valueType: 'Vec<U32>',
        });
        expect(extractMapTypes('Map<Vec<Symbol>,Address>')).toEqual({
          keyType: 'Vec<Symbol>',
          valueType: 'Address',
        });
        expect(extractMapTypes('Map<Option<Symbol>,Vec<Address>>')).toEqual({
          keyType: 'Option<Symbol>',
          valueType: 'Vec<Address>',
        });
      });

      it('should handle complex nested Maps', () => {
        expect(extractMapTypes('Map<Symbol,Map<U32,Address>>')).toEqual({
          keyType: 'Symbol',
          valueType: 'Map<U32,Address>',
        });
      });
    });

    describe('invalid Map types', () => {
      it('should return null for non-Map types', () => {
        expect(extractMapTypes('U32')).toBeNull();
        expect(extractMapTypes('Vec<U32>')).toBeNull();
        expect(extractMapTypes('Option<U32>')).toBeNull();
      });

      it('should return null for malformed Map types', () => {
        expect(extractMapTypes('Map<')).toBeNull();
        expect(extractMapTypes('Map>')).toBeNull();
        expect(extractMapTypes('Map')).toBeNull();
        expect(extractMapTypes('Map<>')).toBeNull();
        expect(extractMapTypes('Map<U32>')).toBeNull(); // Missing value type
        expect(extractMapTypes('Map<,U32>')).toBeNull(); // Missing key type
        expect(extractMapTypes('Map<U32,>')).toBeNull(); // Missing value type
      });

      it('should return null for unbalanced brackets', () => {
        expect(extractMapTypes('Map<U32,Address')).toBeNull();
        expect(extractMapTypes('Map<U32,Vec<Address>')).toBeNull();
        expect(extractMapTypes('Map<U32,Address>>')).toBeNull();
      });

      it('should return null for invalid characters', () => {
        expect(extractMapTypes('Map<U32\n,Address>')).toBeNull();
        expect(extractMapTypes('Map<U32,Address\r>')).toBeNull();
      });
    });

    describe('security scenarios', () => {
      it('should handle potential ReDoS attack strings safely', () => {
        const maliciousStrings = [
          'Map<' + 'Map<'.repeat(50) + 'U32,Address' + '>'.repeat(50),
          'Map<' + 'a'.repeat(500) + ',' + 'b'.repeat(500) + '>',
          'Map<Map<Map<U32,U32>,Map<U32,U32>>,Map<Map<U32,U32>,Map<U32,U32>>>',
        ];

        maliciousStrings.forEach((str) => {
          expect(() => extractMapTypes(str)).not.toThrow();
          const result = extractMapTypes(str);
          expect(
            result === null ||
              (result && typeof result.keyType === 'string' && typeof result.valueType === 'string')
          ).toBe(true);
        });
      });

      it('should reject extremely long input strings', () => {
        const longString = 'Map<' + 'U'.repeat(1500) + ',' + 'A'.repeat(1500) + '>';
        expect(extractMapTypes(longString)).toBeNull();
      });
    });
  });

  describe('extractOptionElementType', () => {
    describe('valid Option types', () => {
      it('should extract simple element types', () => {
        expect(extractOptionElementType('Option<U32>')).toBe('U32');
        expect(extractOptionElementType('Option<Address>')).toBe('Address');
        expect(extractOptionElementType('Option<Bool>')).toBe('Bool');
      });

      it('should extract nested Option types', () => {
        expect(extractOptionElementType('Option<Option<U32>>')).toBe('Option<U32>');
        expect(extractOptionElementType('Option<Vec<Address>>')).toBe('Vec<Address>');
        expect(extractOptionElementType('Option<Map<Symbol,Bytes>>')).toBe('Map<Symbol,Bytes>');
      });

      it('should handle types with spaces', () => {
        expect(extractOptionElementType('Option< U32 >')).toBe('U32');
        expect(extractOptionElementType('Option< Vec<Address> >')).toBe('Vec<Address>');
      });
    });

    describe('invalid Option types', () => {
      it('should return null for non-Option types', () => {
        expect(extractOptionElementType('U32')).toBeNull();
        expect(extractOptionElementType('Vec<U32>')).toBeNull();
        expect(extractOptionElementType('Map<Symbol,Bytes>')).toBeNull();
      });

      it('should return null for malformed Option types', () => {
        expect(extractOptionElementType('Option<')).toBeNull();
        expect(extractOptionElementType('Option>')).toBeNull();
        expect(extractOptionElementType('Option')).toBeNull();
        expect(extractOptionElementType('Option<>')).toBeNull();
      });

      it('should return null for unbalanced brackets', () => {
        expect(extractOptionElementType('Option<U32')).toBeNull();
        expect(extractOptionElementType('Option<Vec<U32>')).toBeNull();
        expect(extractOptionElementType('Option<U32>>')).toBeNull();
      });

      it('should return null for invalid characters', () => {
        expect(extractOptionElementType('Option<U32\n>')).toBeNull();
        expect(extractOptionElementType('Option<U32\r>')).toBeNull();
      });
    });

    describe('security scenarios', () => {
      it('should handle potential ReDoS attack strings safely', () => {
        const maliciousStrings = [
          'Option<' + 'Option<'.repeat(100) + 'U32' + '>'.repeat(100),
          'Option<' + 'a'.repeat(1000) + '>',
          'Option<Option<Option<Option<Option<U32>>>>>',
        ];

        maliciousStrings.forEach((str) => {
          expect(() => extractOptionElementType(str)).not.toThrow();
          const result = extractOptionElementType(str);
          expect(result === null || typeof result === 'string').toBe(true);
        });
      });

      it('should reject extremely long input strings', () => {
        const longString = 'Option<' + 'U'.repeat(2000) + '>';
        expect(extractOptionElementType(longString)).toBeNull();
      });
    });
  });

  describe('isValidTypeString', () => {
    describe('valid type strings', () => {
      it('should accept well-formed type strings', () => {
        expect(isValidTypeString('U32')).toBe(true);
        expect(isValidTypeString('Address')).toBe(true);
        expect(isValidTypeString('Vec<U32>')).toBe(true);
        expect(isValidTypeString('Map<Symbol,Bytes>')).toBe(true);
        expect(isValidTypeString('Option<Address>')).toBe(true);
        expect(isValidTypeString('Vec<Vec<U32>>')).toBe(true);
        expect(isValidTypeString('Map<Symbol,Vec<Address>>')).toBe(true);
      });

      it('should accept types with underscores', () => {
        expect(isValidTypeString('Custom_Type')).toBe(true);
        expect(isValidTypeString('Vec<User_Info>')).toBe(true);
      });

      it('should accept types with spaces', () => {
        expect(isValidTypeString('Vec< U32 >')).toBe(true);
        expect(isValidTypeString('Map< Symbol , Bytes >')).toBe(true);
      });
    });

    describe('invalid type strings', () => {
      it('should reject null, undefined, or non-string inputs', () => {
        expect(isValidTypeString(null as unknown as string)).toBe(false);
        expect(isValidTypeString(undefined as unknown as string)).toBe(false);
        expect(isValidTypeString(123 as unknown as string)).toBe(false);
        expect(isValidTypeString({} as unknown as string)).toBe(false);
      });

      it('should reject empty strings', () => {
        expect(isValidTypeString('')).toBe(false);
      });

      it('should reject strings that are too long', () => {
        const longString = 'U'.repeat(1001);
        expect(isValidTypeString(longString)).toBe(false);
      });

      it('should reject strings with control characters', () => {
        expect(isValidTypeString('U32\n')).toBe(false);
        expect(isValidTypeString('U32\r')).toBe(false);
        expect(isValidTypeString('U32\x00')).toBe(false);
        expect(isValidTypeString('U32\x1F')).toBe(false);
        expect(isValidTypeString('U32\x7F')).toBe(false);
      });

      it('should reject strings with invalid characters', () => {
        expect(isValidTypeString('U32!')).toBe(false);
        expect(isValidTypeString('U32@')).toBe(false);
        expect(isValidTypeString('U32#')).toBe(false);
        expect(isValidTypeString('U32$')).toBe(false);
        expect(isValidTypeString('U32%')).toBe(false);
        expect(isValidTypeString('U32&')).toBe(false);
        expect(isValidTypeString('U32*')).toBe(false);
        expect(isValidTypeString('U32+')).toBe(false);
        expect(isValidTypeString('U32=')).toBe(false);
        expect(isValidTypeString('U32|')).toBe(false);
        expect(isValidTypeString('U32\\')).toBe(false);
        expect(isValidTypeString('U32/')).toBe(false);
        expect(isValidTypeString('U32?')).toBe(false);
        expect(isValidTypeString('U32.')).toBe(false);
        expect(isValidTypeString('U32;')).toBe(false);
        expect(isValidTypeString('U32:')).toBe(false);
        expect(isValidTypeString('U32"')).toBe(false);
        expect(isValidTypeString("U32'")).toBe(false);
        expect(isValidTypeString('U32`')).toBe(false);
        expect(isValidTypeString('U32~')).toBe(false);
        expect(isValidTypeString('U32^')).toBe(false);
        expect(isValidTypeString('U32[')).toBe(false);
        expect(isValidTypeString('U32]')).toBe(false);
        expect(isValidTypeString('U32{')).toBe(false);
        expect(isValidTypeString('U32}')).toBe(false);
      });

      it('should reject unbalanced brackets', () => {
        expect(isValidTypeString('Vec<U32')).toBe(false);
        expect(isValidTypeString('VecU32>')).toBe(false);
        expect(isValidTypeString('Vec<<U32>')).toBe(false);
        expect(isValidTypeString('Vec<U32>>')).toBe(false);
        expect(isValidTypeString('Map<U32,Address')).toBe(false);
        expect(isValidTypeString('Map(U32,Address)')).toBe(false);
      });
    });

    describe('performance and security', () => {
      it('should handle deeply nested types efficiently', () => {
        const deepType = 'Option<'.repeat(9) + 'U32' + '>'.repeat(9);
        expect(isValidTypeString(deepType)).toBe(true);
      });

      it('should reject excessively deep nesting', () => {
        const tooDeepType = 'Option<'.repeat(15) + 'U32' + '>'.repeat(15);
        expect(isValidTypeString(tooDeepType)).toBe(false);
      });

      it('should handle malicious inputs quickly', () => {
        const start = performance.now();
        const maliciousInputs = [
          'Vec<' + 'Vec<'.repeat(50) + 'U32' + '>'.repeat(50),
          'Map<' + 'a'.repeat(500) + ',' + 'b'.repeat(500) + '>',
          'Option<' + 'Option<'.repeat(50) + 'U32' + '>'.repeat(50),
        ];

        maliciousInputs.forEach((input) => {
          isValidTypeString(input);
        });

        const end = performance.now();
        // Should complete in reasonable time (< 100ms even for malicious inputs)
        expect(end - start).toBeLessThan(100);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle realistic Stellar contract parameter types', () => {
      const stellarTypes = [
        'Address',
        'U32',
        'U64',
        'U128',
        'U256',
        'I32',
        'I64',
        'I128',
        'I256',
        'Bool',
        'ScString',
        'ScSymbol',
        'Bytes',
        'Vec<Address>',
        'Vec<U128>',
        'Map<Symbol,Bytes>',
        'Map<Address,U128>',
        'Option<Address>',
        'Option<U128>',
        'Vec<Option<Address>>',
        'Map<Symbol,Vec<U128>>',
        'Option<Map<Symbol,Bytes>>',
      ];

      stellarTypes.forEach((type) => {
        expect(isValidTypeString(type)).toBe(true);

        // Test Vec extraction
        if (type.startsWith('Vec<')) {
          const elementType = extractVecElementType(type);
          expect(elementType).not.toBeNull();
          expect(typeof elementType).toBe('string');
        }

        // Test Map extraction
        if (type.startsWith('Map<')) {
          const mapTypes = extractMapTypes(type);
          expect(mapTypes).not.toBeNull();
          expect(mapTypes).toHaveProperty('keyType');
          expect(mapTypes).toHaveProperty('valueType');
        }

        // Test Option extraction
        if (type.startsWith('Option<')) {
          const innerType = extractOptionElementType(type);
          expect(innerType).not.toBeNull();
          expect(typeof innerType).toBe('string');
        }
      });
    });
  });
});
