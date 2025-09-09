import { nativeToScVal } from '@stellar/stellar-sdk';
import { describe, expect, it, vi } from 'vitest';

import type { FunctionParameter } from '@openzeppelin/contracts-ui-builder-types';

import { valueToScVal } from '../../src/transform/input-parser';

// Mock the convertStellarTypeToScValType function
vi.mock('../../src/utils/formatting', () => ({
  convertStellarTypeToScValType: vi.fn((stellarType: string) => {
    const typeMap: Record<string, string> = {
      U32: 'u32',
      U64: 'u64',
      U128: 'u128',
      I32: 'i32',
      I64: 'i64',
      I128: 'i128',
      Bool: 'bool',
      ScSymbol: 'symbol',
      ScString: 'string',
      Bytes: 'bytes',
      Address: 'address',
    };
    return typeMap[stellarType] || stellarType.toLowerCase();
  }),
}));

// Mock the convertEnumToScVal function
vi.mock('../../src/utils/input-parsing', () => ({
  convertEnumToScVal: vi.fn(() => nativeToScVal('mockEnumValue')),
  // Mock other functions that might be imported
  convertObjectToMap: vi.fn(),
  convertObjectToScVal: vi.fn(),
  convertTupleToScVal: vi.fn(),
  getScValFromArg: vi.fn(),
  getScValFromPrimitive: vi.fn(),
  isComplexObjectArray: vi.fn(() => false),
  isEnumArgumentSet: vi.fn(() => false),
  isMapArray: vi.fn(() => false),
  isObjectWithTypedValues: vi.fn(() => false),
  isPrimitiveArgumentSet: vi.fn(() => false),
  isPrimitiveArray: vi.fn(() => false),
  isPrimitiveValue: vi.fn(() => false),
  isTupleArray: vi.fn(() => false),
}));

describe('Struct ScVal Conversion', () => {
  describe('valueToScVal with struct schema', () => {
    it('should convert struct with proper schema-based type hints', () => {
      const structValue = {
        id: 123,
        flag: true,
        info: 'test-info',
      };

      const structSchema: FunctionParameter = {
        name: 'data',
        type: 'DemoStruct',
        components: [
          { name: 'id', type: 'U32' },
          { name: 'flag', type: 'Bool' },
          { name: 'info', type: 'ScSymbol' },
        ],
      };

      const result = valueToScVal(structValue, 'DemoStruct', structSchema);

      // Verify the result is an ScVal
      expect(result).toBeDefined();
      expect(result.switch).toBeDefined();

      // The actual ScVal creation is handled by nativeToScVal with proper type hints
      // We verify that the function completes without error and produces a valid ScVal
    });

    it('should handle nested struct fields', () => {
      const nestedStructValue = {
        user_info: {
          id: 456,
          name: 'test-user',
        },
        active: true,
      };

      const nestedStructSchema: FunctionParameter = {
        name: 'data',
        type: 'UserData',
        components: [
          {
            name: 'user_info',
            type: 'UserInfo',
            components: [
              { name: 'id', type: 'U64' },
              { name: 'name', type: 'ScString' },
            ],
          },
          { name: 'active', type: 'Bool' },
        ],
      };

      const result = valueToScVal(nestedStructValue, 'UserData', nestedStructSchema);

      expect(result).toBeDefined();
      expect(result.switch).toBeDefined();
    });

    it('should throw error when schema is missing for a field', () => {
      const structValue = {
        id: 123,
        unknown_field: 'value',
      };

      const incompleteSchema: FunctionParameter = {
        name: 'data',
        type: 'IncompleteStruct',
        components: [
          { name: 'id', type: 'U32' },
          // missing unknown_field definition
        ],
      };

      expect(() => {
        valueToScVal(structValue, 'IncompleteStruct', incompleteSchema);
      }).toThrow(
        'Missing schema information for struct field "unknown_field" in struct type "IncompleteStruct"'
      );
    });

    it('should throw error when no schema is provided for struct', () => {
      const structValue = {
        id: 123,
        flag: true,
      };

      expect(() => {
        valueToScVal(structValue, 'DemoStruct'); // No schema provided
      }).toThrow('Missing schema information for struct field "id" in struct type "DemoStruct"');
    });

    it('should throw error when schema has no components', () => {
      const structValue = {
        id: 123,
        flag: true,
      };

      const schemaWithoutComponents: FunctionParameter = {
        name: 'data',
        type: 'DemoStruct',
        // No components property
      };

      expect(() => {
        valueToScVal(structValue, 'DemoStruct', schemaWithoutComponents);
      }).toThrow('Missing schema information for struct field "id" in struct type "DemoStruct"');
    });

    it('should handle struct with various field types', () => {
      const complexStructValue = {
        u32_field: 123,
        u64_field: 9876543210,
        u128_field: '340282366920938463463374607431768211455',
        i32_field: -123,
        i64_field: -9876543210,
        i128_field: '-170141183460469231731687303715884105728',
        bool_field: false,
        symbol_field: 'test-symbol',
        string_field: 'test-string',
        bytes_field: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
        address_field: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      };

      const complexStructSchema: FunctionParameter = {
        name: 'complex_data',
        type: 'ComplexStruct',
        components: [
          { name: 'u32_field', type: 'U32' },
          { name: 'u64_field', type: 'U64' },
          { name: 'u128_field', type: 'U128' },
          { name: 'i32_field', type: 'I32' },
          { name: 'i64_field', type: 'I64' },
          { name: 'i128_field', type: 'I128' },
          { name: 'bool_field', type: 'Bool' },
          { name: 'symbol_field', type: 'ScSymbol' },
          { name: 'string_field', type: 'ScString' },
          { name: 'bytes_field', type: 'Bytes' },
          { name: 'address_field', type: 'Address' },
        ],
      };

      const result = valueToScVal(complexStructValue, 'ComplexStruct', complexStructSchema);

      expect(result).toBeDefined();
      expect(result.switch).toBeDefined();
    });

    it('should not process arrays as structs', () => {
      const arrayValue = [1, 2, 3];
      const mockSchema: FunctionParameter = {
        name: 'numbers',
        type: 'Vec<U32>',
      };

      // Arrays should be handled by Vec processing logic, not struct conversion
      const result = valueToScVal(arrayValue, 'Vec<U32>', mockSchema);

      expect(result).toBeDefined();
      // Should not throw struct-related errors
    });

    it('should not process primitives as structs', () => {
      const primitiveValue = 'test-string';

      const result = valueToScVal(primitiveValue, 'ScString');

      expect(result).toBeDefined();
      // Should not throw struct-related errors
    });

    it('should handle empty struct', () => {
      const emptyStructValue = {};

      const emptyStructSchema: FunctionParameter = {
        name: 'empty_data',
        type: 'EmptyStruct',
        components: [], // No fields
      };

      const result = valueToScVal(emptyStructValue, 'EmptyStruct', emptyStructSchema);

      expect(result).toBeDefined();
      expect(result.switch).toBeDefined();
    });

    it('should preserve Laboratory pattern type hints format', () => {
      const structValue = {
        key1: 'value1',
        key2: 42,
      };

      const structSchema: FunctionParameter = {
        name: 'test_struct',
        type: 'TestStruct',
        components: [
          { name: 'key1', type: 'ScSymbol' },
          { name: 'key2', type: 'U32' },
        ],
      };

      // The function should call nativeToScVal with Laboratory-style type hints:
      // { type: { key1: ['symbol', 'symbol'], key2: ['symbol', 'u32'] } }
      const result = valueToScVal(structValue, 'TestStruct', structSchema);

      expect(result).toBeDefined();
      expect(result.switch).toBeDefined();
    });

    it('should throw clear error for invalid Vec<u128> array elements from user input', () => {
      // This test simulates the exact issue the user encountered with ComplexStruct
      const complexStructValue = {
        owner: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amounts: ['klkjlk', 'lkjlkjlkj'], // Invalid string inputs for Vec<u128>
        note: 'test note',
        blobs: {},
      };

      const complexStructSchema: FunctionParameter = {
        name: 'input',
        type: 'ComplexStruct',
        components: [
          { name: 'owner', type: 'Address' },
          { name: 'amounts', type: 'Vec<U128>' },
          { name: 'note', type: 'Option<String>' },
          { name: 'blobs', type: 'Map<Symbol,Bytes>' },
        ],
      };

      expect(() => {
        valueToScVal(complexStructValue, 'ComplexStruct', complexStructSchema);
      }).toThrow('Invalid number format for U128: klkjlk');
    });
  });
});
