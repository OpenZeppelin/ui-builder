import { Address, ScInt, xdr } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';

import type { ContractFunction } from '@openzeppelin/contracts-ui-builder-types';

import { formatStellarFunctionResult } from '../../src/transform/output-formatter';

describe('formatStellarFunctionResult', () => {
  const mockFunction: ContractFunction = {
    name: 'test_function',
    inputs: [],
    outputs: [{ name: 'result', type: 'U32' }],
    stateMutability: 'view',
  };

  describe('primitive types', () => {
    it('should format U32 ScVal', () => {
      const scVal = xdr.ScVal.scvU32(42);
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('42');
    });

    it('should format U64 ScVal', () => {
      const scVal = xdr.ScVal.scvU64(new xdr.Uint64('18446744073709551615'));
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('18446744073709551615');
    });

    it('should format I32 ScVal (positive)', () => {
      const scVal = xdr.ScVal.scvI32(2147483647);
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('2147483647');
    });

    it('should format I32 ScVal (negative)', () => {
      const scVal = xdr.ScVal.scvI32(-2147483648);
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('-2147483648');
    });

    it('should format I64 ScVal (positive)', () => {
      const scVal = xdr.ScVal.scvI64(new xdr.Int64('9223372036854775807'));
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('9223372036854775807');
    });

    it('should format I64 ScVal (negative)', () => {
      const scVal = xdr.ScVal.scvI64(new xdr.Int64('-9223372036854775808'));
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('-9223372036854775808');
    });

    it('should format I128 ScVal (positive)', () => {
      const scVal = new ScInt('123456789012345678901234567890', { type: 'i128' }).toScVal();
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('123456789012345678901234567890');
    });

    it('should format I128 ScVal (negative)', () => {
      const scVal = new ScInt('-123456789012345678901234567890', { type: 'i128' }).toScVal();
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('-123456789012345678901234567890');
    });

    it('should format U128 ScVal', () => {
      const scVal = new ScInt('340282366920938463463374607431768211455', {
        type: 'u128',
      }).toScVal();
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('340282366920938463463374607431768211455');
    });

    it('should format boolean ScVal (true)', () => {
      const scVal = xdr.ScVal.scvBool(true);
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('true');
    });

    it('should format boolean ScVal (false)', () => {
      const scVal = xdr.ScVal.scvBool(false);
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('false');
    });

    it('should format string ScVal', () => {
      const scVal = xdr.ScVal.scvString('Hello, Stellar!');
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('Hello, Stellar!');
    });

    it('should format symbol ScVal', () => {
      const scVal = xdr.ScVal.scvSymbol('SYMBOL');
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('SYMBOL');
    });

    it('should format bytes ScVal', () => {
      const buffer = Buffer.from('Hello World', 'utf8');
      const scVal = xdr.ScVal.scvBytes(buffer);
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toContain('48656c6c6f20576f726c64'); // hex representation
    });

    it('should format void ScVal', () => {
      const scVal = xdr.ScVal.scvVoid();
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('(void)');
    });
  });

  describe('address types', () => {
    it('should format account address ScVal', () => {
      const address = new Address('GBPIMUEJFYS7RT23QO2ACH2JMKGXLXZI4E5ACBSQMF32RKZ5H3SVNL5F');
      const scVal = address.toScVal();
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('GBPIMUEJFYS7RT23QO2ACH2JMKGXLXZI4E5ACBSQMF32RKZ5H3SVNL5F');
    });

    it('should format contract address ScVal', () => {
      const address = new Address('CBHQGTSBJWA54K67RSG3JPXSZY5IXIZ4FSLJM4PQ33FA3FYCU5YZV7MZ');
      const scVal = address.toScVal();
      const result = formatStellarFunctionResult(scVal, mockFunction);
      expect(result).toBe('CBHQGTSBJWA54K67RSG3JPXSZY5IXIZ4FSLJM4PQ33FA3FYCU5YZV7MZ');
    });
  });

  describe('complex types', () => {
    it('should format vector ScVal', () => {
      const vector = [xdr.ScVal.scvU32(1), xdr.ScVal.scvU32(2), xdr.ScVal.scvU32(3)];
      const scVal = xdr.ScVal.scvVec(vector);
      const result = formatStellarFunctionResult(scVal, mockFunction);

      // Should be formatted as JSON array
      expect(result).toContain('[');
      expect(result).toContain(']');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    it('should format map ScVal', () => {
      const mapEntries = [
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol('key1'),
          val: xdr.ScVal.scvU32(100),
        }),
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol('key2'),
          val: xdr.ScVal.scvString('value2'),
        }),
      ];
      const scVal = xdr.ScVal.scvMap(mapEntries);
      const result = formatStellarFunctionResult(scVal, mockFunction);

      // Should be formatted as JSON object
      expect(result).toContain('{');
      expect(result).toContain('}');
      expect(result).toContain('key1');
      expect(result).toContain('key2');
      expect(result).toContain('100');
      expect(result).toContain('value2');
    });

    it('should format struct-like map ScVal', () => {
      const structEntries = [
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol('name'),
          val: xdr.ScVal.scvString('Alice'),
        }),
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol('age'),
          val: xdr.ScVal.scvU32(30),
        }),
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol('active'),
          val: xdr.ScVal.scvBool(true),
        }),
      ];
      const scVal = xdr.ScVal.scvMap(structEntries);
      const result = formatStellarFunctionResult(scVal, mockFunction);

      expect(result).toContain('name');
      expect(result).toContain('Alice');
      expect(result).toContain('age');
      expect(result).toContain('30');
      expect(result).toContain('active');
      expect(result).toContain('true');
    });

    it('should format nested complex ScVal', () => {
      const innerMap = [
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol('inner_key'),
          val: xdr.ScVal.scvU32(42),
        }),
      ];

      const outerMap = [
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol('nested'),
          val: xdr.ScVal.scvMap(innerMap),
        }),
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol('numbers'),
          val: xdr.ScVal.scvVec([xdr.ScVal.scvU32(1), xdr.ScVal.scvU32(2)]),
        }),
      ];

      const scVal = xdr.ScVal.scvMap(outerMap);
      const result = formatStellarFunctionResult(scVal, mockFunction);

      expect(result).toContain('nested');
      expect(result).toContain('inner_key');
      expect(result).toContain('numbers');
      expect(result).toContain('42');
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      const result = formatStellarFunctionResult(null, mockFunction);
      expect(result).toBe('(null)');
    });

    it('should handle undefined values', () => {
      const result = formatStellarFunctionResult(undefined, mockFunction);
      expect(result).toBe('(null)');
    });

    it('should handle non-ScVal values gracefully', () => {
      const result = formatStellarFunctionResult('plain string', mockFunction);
      expect(result).toBe('plain string');
    });

    it('should handle number values', () => {
      const result = formatStellarFunctionResult(42, mockFunction);
      expect(result).toBe('42');
    });

    it('should handle boolean values', () => {
      const result = formatStellarFunctionResult(true, mockFunction);
      expect(result).toBe('true');
    });

    it('should handle bigint values', () => {
      const result = formatStellarFunctionResult(
        BigInt('123456789012345678901234567890'),
        mockFunction
      );
      expect(result).toBe('123456789012345678901234567890');
    });

    it('should handle array values', () => {
      const result = formatStellarFunctionResult([1, 2, 3], mockFunction);
      expect(result).toBe('[1,2,3]'); // Compact formatting for simple arrays
    });

    it('should handle object values', () => {
      const obj = { key: 'value', number: 42 };
      const result = formatStellarFunctionResult(obj, mockFunction);
      expect(result).toContain('key');
      expect(result).toContain('value');
      expect(result).toContain('42');
    });
  });

  describe('error handling', () => {
    it('should handle missing outputs in function definition', () => {
      const functionWithoutOutputs: ContractFunction = {
        name: 'test_function',
        inputs: [],
        outputs: undefined as unknown as FunctionParameter[],
        stateMutability: 'view',
      };

      const scVal = xdr.ScVal.scvU32(42);
      const result = formatStellarFunctionResult(scVal, functionWithoutOutputs);
      expect(result).toContain('[Error: Output definition missing]');
    });

    it('should handle invalid outputs array', () => {
      const functionWithInvalidOutputs: ContractFunction = {
        name: 'test_function',
        inputs: [],
        outputs: null as unknown as FunctionParameter[],
        stateMutability: 'view',
      };

      const scVal = xdr.ScVal.scvU32(42);
      const result = formatStellarFunctionResult(scVal, functionWithInvalidOutputs);
      expect(result).toContain('[Error: Output definition missing]');
    });

    it('should handle errors during formatting', () => {
      // Create a mock ScVal that might cause formatting errors
      const invalidScVal = {} as unknown; // Invalid ScVal structure

      const result = formatStellarFunctionResult(invalidScVal, mockFunction);
      // Should not throw, but return error message
      expect(typeof result).toBe('string');
    });
  });

  describe('instance type handling', () => {
    it('should format instance-like native values', () => {
      // Test values that are already converted from ScVal to native JS types
      const testCases = [
        { value: 'converted string', expected: 'converted string' },
        { value: 42, expected: '42' },
        { value: true, expected: 'true' },
        { value: false, expected: 'false' },
        { value: { key: 'value' }, shouldContain: ['key', 'value'] },
        { value: [1, 2, 3], shouldContain: ['1', '2', '3'] },
      ];

      testCases.forEach(({ value, expected, shouldContain }) => {
        const result = formatStellarFunctionResult(value, mockFunction);

        if (expected) {
          expect(result).toBe(expected);
        } else if (shouldContain) {
          shouldContain.forEach((item) => {
            expect(result).toContain(item);
          });
        }
      });
    });
  });
});
