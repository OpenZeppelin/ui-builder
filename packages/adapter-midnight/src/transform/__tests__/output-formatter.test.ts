import { describe, expect, it } from 'vitest';

import type { ContractFunction } from '@openzeppelin/ui-builder-types';

import { formatMidnightFunctionResult } from '../output-formatter';

// Helper function to create a mock ContractFunction
function createMockFunction(
  name: string,
  outputs: Array<{ name: string; type: string }>
): ContractFunction {
  return {
    id: `query_${name}`,
    name,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    type: 'query',
    modifiesState: false,
    inputs: [],
    outputs,
  };
}

describe('formatMidnightFunctionResult', () => {
  describe('Primitive Types - Numbers', () => {
    it('should format u64 numbers without quotes', () => {
      const func = createMockFunction('balance', [{ name: 'result', type: 'u64' }]);
      const result = formatMidnightFunctionResult(42, func);
      expect(result).toBe('42');
      expect(result).not.toMatch(/"/);
    });

    it('should format large numbers', () => {
      const func = createMockFunction('bigNumber', [{ name: 'result', type: 'u64' }]);
      const result = formatMidnightFunctionResult(999999999, func);
      expect(result).toBe('999999999');
    });

    it('should format zero', () => {
      const func = createMockFunction('zero', [{ name: 'result', type: 'u64' }]);
      const result = formatMidnightFunctionResult(0, func);
      expect(result).toBe('0');
    });

    it('should format negative numbers', () => {
      const func = createMockFunction('negative', [{ name: 'result', type: 'i64' }]);
      const result = formatMidnightFunctionResult(-42, func);
      expect(result).toBe('-42');
    });

    it('should format floats', () => {
      const func = createMockFunction('pi', [{ name: 'result', type: 'f64' }]);
      const result = formatMidnightFunctionResult(3.14, func);
      expect(result).toBe('3.14');
    });
  });

  describe('Primitive Types - Strings', () => {
    it('should format strings without quotes', () => {
      const func = createMockFunction('name', [{ name: 'result', type: 'string' }]);
      const result = formatMidnightFunctionResult('hello', func);
      expect(result).toBe('hello');
      expect(result).not.toMatch(/^"/);
    });

    it('should format empty strings', () => {
      const func = createMockFunction('empty', [{ name: 'result', type: 'string' }]);
      const result = formatMidnightFunctionResult('', func);
      expect(result).toBe('');
    });

    it('should format strings with spaces', () => {
      const func = createMockFunction('greeting', [{ name: 'result', type: 'string' }]);
      const result = formatMidnightFunctionResult('hello world', func);
      expect(result).toBe('hello world');
    });

    it('should preserve string content exactly', () => {
      const func = createMockFunction('address', [{ name: 'result', type: 'string' }]);
      const testString = 'Contract: 0x123';
      const result = formatMidnightFunctionResult(testString, func);
      expect(result).toBe(testString);
    });
  });

  describe('Primitive Types - Booleans', () => {
    it('should format true without quotes', () => {
      const func = createMockFunction('isActive', [{ name: 'result', type: 'bool' }]);
      const result = formatMidnightFunctionResult(true, func);
      expect(result).toBe('true');
      expect(result).not.toMatch(/"/);
    });

    it('should format false without quotes', () => {
      const func = createMockFunction('isActive', [{ name: 'result', type: 'bool' }]);
      const result = formatMidnightFunctionResult(false, func);
      expect(result).toBe('false');
      expect(result).not.toMatch(/"/);
    });
  });

  describe('BigInt Types', () => {
    it('should format BigInt values', () => {
      const func = createMockFunction('balance', [{ name: 'result', type: 'u256' }]);
      const bigValue = 123456789123456789n;
      const result = formatMidnightFunctionResult(bigValue, func);
      expect(result).toBe('123456789123456789');
    });

    it('should format large BigInt values', () => {
      const func = createMockFunction('huge', [{ name: 'result', type: 'u512' }]);
      const hugeBigInt = 99999999999999999999999999n;
      const result = formatMidnightFunctionResult(hugeBigInt, func);
      expect(result).toBe('99999999999999999999999999');
    });

    it('should format BigInt zero', () => {
      const func = createMockFunction('zero', [{ name: 'result', type: 'u256' }]);
      const result = formatMidnightFunctionResult(0n, func);
      expect(result).toBe('0');
    });

    it('should format negative BigInt', () => {
      const func = createMockFunction('negative', [{ name: 'result', type: 'i256' }]);
      const result = formatMidnightFunctionResult(-123n, func);
      expect(result).toBe('-123');
    });
  });

  describe('Null and Undefined', () => {
    it('should handle null values', () => {
      const func = createMockFunction('optional', [{ name: 'result', type: 'Option<u64>' }]);
      const result = formatMidnightFunctionResult(null, func);
      expect(result).toBe('(null)');
    });

    it('should handle undefined values', () => {
      const func = createMockFunction('optional', [{ name: 'result', type: 'Option<string>' }]);
      const result = formatMidnightFunctionResult(undefined, func);
      expect(result).toBe('(null)');
    });
  });

  describe('Complex Types - Arrays', () => {
    it('should format simple arrays as JSON', () => {
      const func = createMockFunction('numbers', [{ name: 'result', type: 'Vec<u64>' }]);
      const array = [1, 2, 3];
      const result = formatMidnightFunctionResult(array, func);
      expect(JSON.parse(result)).toEqual(array);
    });

    it('should format arrays of strings', () => {
      const func = createMockFunction('items', [{ name: 'result', type: 'Vec<string>' }]);
      const array = ['a', 'b', 'c'];
      const result = formatMidnightFunctionResult(array, func);
      expect(JSON.parse(result)).toEqual(array);
    });

    it('should format empty arrays', () => {
      const func = createMockFunction('empty', [{ name: 'result', type: 'Vec<u64>' }]);
      const array: unknown[] = [];
      const result = formatMidnightFunctionResult(array, func);
      expect(JSON.parse(result)).toEqual([]);
    });

    it('should format nested arrays', () => {
      const func = createMockFunction('nested', [{ name: 'result', type: 'Vec<Vec<u64>>' }]);
      const array = [
        [1, 2],
        [3, 4],
      ];
      const result = formatMidnightFunctionResult(array, func);
      expect(JSON.parse(result)).toEqual(array);
    });

    it('should format arrays with mixed types', () => {
      const func = createMockFunction('mixed', [{ name: 'result', type: 'Vec<Any>' }]);
      const array = [1, 'two', true];
      const result = formatMidnightFunctionResult(array, func);
      expect(JSON.parse(result)).toEqual(array);
    });
  });

  describe('Complex Types - Objects', () => {
    it('should format simple objects as JSON', () => {
      const func = createMockFunction('account', [
        { name: 'balance', type: 'u64' },
        { name: 'owner', type: 'Address' },
      ]);
      const obj = { balance: 100, owner: 'alice' };
      const result = formatMidnightFunctionResult(obj, func);
      expect(JSON.parse(result)).toEqual(obj);
    });

    it('should format empty objects', () => {
      const func = createMockFunction('empty', [{ name: 'result', type: 'Struct' }]);
      const obj = {};
      const result = formatMidnightFunctionResult(obj, func);
      expect(JSON.parse(result)).toEqual({});
    });

    it('should format nested objects', () => {
      const func = createMockFunction('profile', [{ name: 'result', type: 'Struct' }]);
      const obj = {
        user: { name: 'alice', age: 30 },
        balance: 100,
      };
      const result = formatMidnightFunctionResult(obj, func);
      expect(JSON.parse(result)).toEqual(obj);
    });

    it('should format objects with array values', () => {
      const func = createMockFunction('collection', [{ name: 'result', type: 'Struct' }]);
      const obj = {
        id: 1,
        items: [1, 2, 3],
        active: true,
      };
      const result = formatMidnightFunctionResult(obj, func);
      expect(JSON.parse(result)).toEqual(obj);
    });

    it('should format objects with null values', () => {
      const func = createMockFunction('user', [{ name: 'result', type: 'Struct' }]);
      const obj = {
        name: 'alice',
        email: null,
      };
      const result = formatMidnightFunctionResult(obj, func);
      expect(JSON.parse(result)).toEqual(obj);
    });
  });

  describe('BigInt in Complex Types', () => {
    it('should handle BigInt in arrays', () => {
      const func = createMockFunction('balances', [{ name: 'result', type: 'Vec<u256>' }]);
      const array = [1n, 2n, 3n];
      const result = formatMidnightFunctionResult(array, func);
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    it('should handle BigInt in objects', () => {
      const func = createMockFunction('amounts', [
        { name: 'balance', type: 'u256' },
        { name: 'amount', type: 'u256' },
      ]);
      const obj = {
        balance: 123456789123456789n,
        amount: 987654321987654321n,
      };
      const result = formatMidnightFunctionResult(obj, func);
      expect(result).toContain('123456789123456789');
      expect(result).toContain('987654321987654321');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long strings', () => {
      const func = createMockFunction('data', [{ name: 'result', type: 'string' }]);
      const longString = 'a'.repeat(10000);
      const result = formatMidnightFunctionResult(longString, func);
      expect(result).toBe(longString);
    });

    it('should handle objects with many properties', () => {
      const func = createMockFunction('data', [{ name: 'result', type: 'Struct' }]);
      const obj: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        obj[`field${i}`] = i;
      }
      const result = formatMidnightFunctionResult(obj, func);
      const parsed = JSON.parse(result);
      expect(Object.keys(parsed)).toHaveLength(100);
    });
  });

  describe('Missing Output Definition', () => {
    it('should handle function with empty outputs array', () => {
      const func: ContractFunction = {
        id: 'no_output',
        name: 'noOutput',
        displayName: 'No Output',
        type: 'query',
        modifiesState: false,
        inputs: [],
        outputs: [],
      };
      const result = formatMidnightFunctionResult(42, func);
      // Empty outputs array is still processed (not missing)
      expect(result).toBe('42');
    });

    it('should handle function with undefined outputs', () => {
      const func: ContractFunction = {
        id: 'undefined_output',
        name: 'undefinedOutput',
        displayName: 'Undefined Output',
        type: 'query',
        modifiesState: false,
        inputs: [],
        outputs: undefined as unknown as Array<{ name: string; type: string }>,
      };
      const result = formatMidnightFunctionResult(42, func);
      expect(result).toBe('[Error: Output definition missing]');
    });
  });

  describe('Output Quality', () => {
    it('should use consistent formatting for all values', () => {
      const func = createMockFunction('test', [{ name: 'result', type: 'Any' }]);
      const values = [42, 'hello', true, null];
      const results = values.map((v) => formatMidnightFunctionResult(v, func));
      expect(results[0]).toBe('42');
      expect(results[1]).toBe('hello');
      expect(results[2]).toBe('true');
      expect(results[3]).toBe('(null)');
    });

    it('should return string output for all inputs', () => {
      const func = createMockFunction('test', [{ name: 'result', type: 'Any' }]);
      const values = [42, 'hello', true, null, [1, 2], { a: 1 }];
      values.forEach((v) => {
        const result = formatMidnightFunctionResult(v, func);
        expect(typeof result).toBe('string');
      });
    });

    it('should handle errors gracefully', () => {
      const func = createMockFunction('test', [{ name: 'result', type: 'Circular' }]);
      // Create a circular reference - JSON.stringify will throw
      const obj: Record<string, unknown> = { a: 1 };
      obj.self = obj;
      const result = formatMidnightFunctionResult(obj, func);
      // Should not throw, just return error message
      expect(result).toContain('Error');
    });
  });
});
