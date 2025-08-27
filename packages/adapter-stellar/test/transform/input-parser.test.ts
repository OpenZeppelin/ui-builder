import { describe, expect, it } from 'vitest';

import {
  getScValsFromArgs,
  parseStellarInput,
  valueToScVal,
  type SorobanArgumentValue,
  type SorobanEnumValue,
  type SorobanMapEntry,
} from '../../src/transform/input-parser';

describe('parseStellarInput', () => {
  describe('primitive types', () => {
    it('should parse boolean values', () => {
      expect(parseStellarInput(true, 'Bool')).toBe(true);
      expect(parseStellarInput(false, 'Bool')).toBe(false);
      expect(parseStellarInput('true', 'Bool')).toBe(true);
      expect(parseStellarInput('false', 'Bool')).toBe(false);
      expect(parseStellarInput('TRUE', 'Bool')).toBe(true);
    });

    it('should parse address values', () => {
      const validAddress = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
      expect(parseStellarInput(validAddress, 'Address')).toBe(validAddress);
    });

    it('should parse numeric types', () => {
      // U32/U64 should return strings for consistency
      expect(parseStellarInput('123', 'U32')).toBe('123');
      expect(parseStellarInput(123, 'U32')).toBe('123');
      expect(parseStellarInput('456', 'U64')).toBe('456');

      // U128/U256 should return strings for large numbers
      expect(parseStellarInput('999999999999999999', 'U128')).toBe('999999999999999999');
      expect(parseStellarInput(123, 'U128')).toBe('123');
    });

    it('should parse bytes values', () => {
      const result = parseStellarInput('0x48656c6c6f', 'Bytes');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result as Uint8Array)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should parse string types', () => {
      expect(parseStellarInput('hello', 'ScString')).toBe('hello');
      expect(parseStellarInput('symbol', 'ScSymbol')).toBe('symbol');
    });
  });

  describe('complex types', () => {
    it('should parse Vec types', () => {
      const result = parseStellarInput(['100', '200', '300'], 'Vec<U128>');
      expect(result).toEqual(['100', '200', '300']);
    });

    it('should parse Option types', () => {
      expect(parseStellarInput(null, 'Option<U128>')).toBe(null);
      expect(parseStellarInput('', 'Option<U128>')).toBe(null);
      expect(parseStellarInput('123', 'Option<U128>')).toBe('123');
    });

    it('should handle custom struct types', () => {
      const customObject = { name: 'test', value: 123 };
      const result = parseStellarInput(customObject, 'CustomStruct');
      expect(result).toEqual(customObject);
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid address', () => {
      expect(() => parseStellarInput('invalid', 'Address')).toThrow(
        'Invalid Stellar address format'
      );
    });

    it('should throw error for invalid boolean', () => {
      expect(() => parseStellarInput(123, 'Bool')).toThrow('Boolean parameter expected');
    });

    it('should throw error for invalid numeric format', () => {
      expect(() => parseStellarInput('abc', 'U32')).toThrow('Invalid number format');
    });
  });
});

describe('valueToScVal', () => {
  it('should convert primitives to ScVal with type hints', () => {
    // Just test that it calls nativeToScVal - actual ScVal testing requires SDK integration
    expect(() => valueToScVal('123', 'U32')).not.toThrow();
    expect(() => valueToScVal(true, 'Bool')).not.toThrow();
    expect(() => valueToScVal(new Uint8Array([1, 2, 3]), 'Bytes')).not.toThrow();
  });
});

describe('getScValsFromArgs', () => {
  describe('primitive arguments', () => {
    it('should handle primitive argument sets', () => {
      const args = {
        amount: { value: '1000', type: 'U128' } as SorobanArgumentValue,
        recipient: {
          value: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          type: 'Address',
        } as SorobanArgumentValue,
        enabled: { value: 'true', type: 'bool' } as SorobanArgumentValue,
      };

      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(3);
      expect(result).toBeDefined();
    });

    it('should handle array of primitives', () => {
      const args = [
        { value: '100', type: 'U32' } as SorobanArgumentValue,
        {
          value: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          type: 'Address',
        } as SorobanArgumentValue,
      ];

      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(2);
    });
  });

  describe('enum arguments', () => {
    it('should handle unit enum variants', () => {
      const args = {
        status: { tag: 'Active' } as SorobanEnumValue,
      };

      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(1);
    });

    it('should handle tuple enum variants', () => {
      const args = {
        transfer: {
          tag: 'Transfer',
          values: [
            { value: '1000', type: 'U128' } as SorobanArgumentValue,
            {
              value: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
              type: 'Address',
            } as SorobanArgumentValue,
          ],
        } as SorobanEnumValue,
      };

      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(1);
    });

    it('should handle integer enum variants', () => {
      const args = {
        priority: { enum: 1 } as SorobanEnumValue,
      };

      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(1);
    });
  });

  describe('map arguments', () => {
    it('should handle map structures', () => {
      const mapEntries: SorobanMapEntry[] = [
        {
          '0': { value: 'key1', type: 'ScSymbol' } as SorobanArgumentValue,
          '1': { value: '100', type: 'U128' } as SorobanArgumentValue,
        },
        {
          '0': { value: 'key2', type: 'ScSymbol' } as SorobanArgumentValue,
          '1': { value: '200', type: 'U128' } as SorobanArgumentValue,
        },
      ];

      const args = {
        userBalances: mapEntries,
      };

      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(1);
    });
  });

  describe('vector arguments', () => {
    it('should handle homogeneous primitive arrays', () => {
      const primitiveArray = [
        { value: '100', type: 'U128' } as SorobanArgumentValue,
        { value: '200', type: 'U128' } as SorobanArgumentValue,
        { value: '300', type: 'U128' } as SorobanArgumentValue,
      ];

      const args = {
        amounts: primitiveArray,
      };

      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(1);
    });

    it('should handle complex object arrays', () => {
      const complexArray = [
        {
          name: { value: 'Alice', type: 'ScString' } as SorobanArgumentValue,
          amount: { value: '1000', type: 'U128' } as SorobanArgumentValue,
        },
        {
          name: { value: 'Bob', type: 'ScString' } as SorobanArgumentValue,
          amount: { value: '2000', type: 'U128' } as SorobanArgumentValue,
        },
      ];

      const args = {
        users: complexArray,
      };

      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(1);
    });

    it('should handle tuple arrays', () => {
      const tupleArray = [
        { value: 'first', type: 'ScString' } as SorobanArgumentValue,
        { value: '42', type: 'U32' } as SorobanArgumentValue,
        { value: 'true', type: 'bool' } as SorobanArgumentValue,
      ];

      const args = {
        mixedTuple: tupleArray,
      };

      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(1);
    });
  });

  describe('object arguments', () => {
    it('should handle structured objects', () => {
      const args = {
        userInfo: {
          name: { value: 'Alice', type: 'ScString' } as SorobanArgumentValue,
          age: { value: '25', type: 'U32' } as SorobanArgumentValue,
          active: { value: 'true', type: 'bool' } as SorobanArgumentValue,
        },
      };

      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(1);
    });
  });

  describe('mixed complex scenarios', () => {
    it('should handle combination of different argument types', () => {
      // Test each type separately first to isolate issues

      // Test primitive only
      const primitiveArgs = {
        amount: { value: '1000', type: 'U128' } as SorobanArgumentValue,
      };
      const primitiveResult = getScValsFromArgs(primitiveArgs);
      expect(primitiveResult).toHaveLength(1);

      // Test enum only (unit variant)
      const enumArgs = {
        operation: { tag: 'Transfer' } as SorobanEnumValue,
      };
      const enumResult = getScValsFromArgs(enumArgs);
      expect(enumResult).toHaveLength(1);

      // Test map only
      const mapArgs = {
        metadata: [
          {
            '0': { value: 'version', type: 'ScSymbol' } as SorobanArgumentValue,
            '1': { value: '1', type: 'U32' } as SorobanArgumentValue,
          },
        ] as SorobanMapEntry[],
      };
      const mapResult = getScValsFromArgs(mapArgs);
      expect(mapResult).toHaveLength(1);

      // Test object only
      const objectArgs = {
        config: {
          enabled: { value: 'true', type: 'bool' } as SorobanArgumentValue,
          threshold: { value: '100', type: 'U64' } as SorobanArgumentValue,
        },
      };
      const objectResult = getScValsFromArgs(objectArgs);
      expect(objectResult).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should handle empty arrays gracefully', () => {
      const result = getScValsFromArgs([]);
      expect(result).toHaveLength(0);
    });

    it('should handle empty objects gracefully', () => {
      const result = getScValsFromArgs({});
      expect(result).toHaveLength(0);
    });
  });

  describe('bytes handling in complex structures', () => {
    it('should handle bytes in primitive arrays', () => {
      const bytesArray = [
        { value: '48656c6c6f', type: 'bytes' } as SorobanArgumentValue,
        { value: '576f726c64', type: 'bytes' } as SorobanArgumentValue,
      ];

      const args = {
        dataChunks: bytesArray,
      };

      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(1);
    });

    it('should handle bytes in tuples', () => {
      const tupleWithBytes = [
        { value: 'prefix', type: 'ScString' } as SorobanArgumentValue,
        { value: '48656c6c6f', type: 'bytes' } as SorobanArgumentValue,
        { value: '42', type: 'U32' } as SorobanArgumentValue,
      ];

      const args = {
        mixedData: tupleWithBytes,
      };

      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(1);
    });
  });

  describe('nested structure handling', () => {
    it('should handle nested maps with different value types', () => {
      const complexMap: SorobanMapEntry[] = [
        {
          '0': { value: 'stringKey', type: 'ScSymbol' } as SorobanArgumentValue,
          '1': { value: 'stringValue', type: 'ScString' } as SorobanArgumentValue,
        },
        {
          '0': { value: 'numberKey', type: 'ScSymbol' } as SorobanArgumentValue,
          '1': { value: '123', type: 'U128' } as SorobanArgumentValue,
        },
        {
          '0': { value: 'boolKey', type: 'ScSymbol' } as SorobanArgumentValue,
          '1': { value: 'true', type: 'bool' } as SorobanArgumentValue,
        },
      ];

      const args = {
        complexMap,
      };

      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(1);
    });

    it('should handle arrays containing nested arrays', () => {
      const nestedArrays = [
        [
          { value: '1', type: 'U32' } as SorobanArgumentValue,
          { value: '2', type: 'U32' } as SorobanArgumentValue,
        ],
        [
          { value: '3', type: 'U32' } as SorobanArgumentValue,
          { value: '4', type: 'U32' } as SorobanArgumentValue,
        ],
      ];

      // Note: This tests the recursive handling of nested structures
      expect(() => getScValsFromArgs({ matrix: nestedArrays })).not.toThrow();
    });
  });

  describe('type validation edge cases', () => {
    it('should handle malformed enum structures gracefully', () => {
      const malformedEnum = { invalidProperty: 'test' } as unknown as SorobanEnumValue;

      const args = {
        badEnum: malformedEnum,
      };

      // Should not crash and should skip malformed enums gracefully
      expect(() => getScValsFromArgs(args)).not.toThrow();
      const result = getScValsFromArgs(args);
      expect(result).toHaveLength(0); // No valid ScVals generated
    });

    it('should validate map entry structure', () => {
      const invalidMapEntry = {
        key: { value: 'test', type: 'ScSymbol' },
        // Missing proper '0' and '1' keys
      } as unknown as SorobanMapEntry[];

      const args = {
        invalidMap: [invalidMapEntry],
      };

      // Should handle invalid map structures
      expect(() => getScValsFromArgs(args)).not.toThrow();
    });
  });
});

describe('integration tests', () => {
  it('should work with parseStellarInput for preprocessing', () => {
    // Test the integration between parseStellarInput and getScValsFromArgs
    const preprocessedValue = parseStellarInput('1000', 'U128');
    const argumentValue: SorobanArgumentValue = {
      value: preprocessedValue as string,
      type: 'U128',
    };

    const result = getScValsFromArgs([argumentValue]);
    expect(result).toHaveLength(1);
  });

  it('should handle real-world contract call scenario', () => {
    // Simulate a realistic token transfer call
    const transferArgs = {
      from: {
        value: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        type: 'Address',
      } as SorobanArgumentValue,
      to: {
        value: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        type: 'Address',
      } as SorobanArgumentValue,
      amount: { value: '1000000', type: 'U128' } as SorobanArgumentValue,
      memo: { value: 'Transfer memo', type: 'ScString' } as SorobanArgumentValue,
    };

    const result = getScValsFromArgs(transferArgs);
    expect(result).toHaveLength(4);
    expect(result).toBeDefined();
  });
});
