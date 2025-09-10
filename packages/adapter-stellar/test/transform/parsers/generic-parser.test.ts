import { describe, expect, it } from 'vitest';

import {
  isGenericType,
  parseGeneric,
  parseGenericType,
} from '../../../src/transform/parsers/generic-parser';

describe('GenericParser', () => {
  describe('parseGenericType', () => {
    it('should parse simple generic types', () => {
      expect(parseGenericType('Vec<U32>')).toEqual({
        baseType: 'Vec',
        parameters: ['U32'],
      });

      expect(parseGenericType('Map<Symbol,Bytes>')).toEqual({
        baseType: 'Map',
        parameters: ['Symbol', 'Bytes'],
      });

      expect(parseGenericType('Option<Address>')).toEqual({
        baseType: 'Option',
        parameters: ['Address'],
      });
    });

    it('should parse nested generic types', () => {
      expect(parseGenericType('Vec<Option<U32>>')).toEqual({
        baseType: 'Vec',
        parameters: ['Option<U32>'],
      });

      expect(parseGenericType('Map<Symbol,Vec<Address>>')).toEqual({
        baseType: 'Map',
        parameters: ['Symbol', 'Vec<Address>'],
      });
    });

    it('should return null for non-generic types', () => {
      expect(parseGenericType('U32')).toBe(null);
      expect(parseGenericType('Address')).toBe(null);
      expect(parseGenericType('CustomStruct')).toBe(null);
    });

    it('should handle malformed types gracefully', () => {
      expect(parseGenericType('Vec<')).toBe(null);
      expect(parseGenericType('Vec>')).toBe(null);
      expect(parseGenericType('Vec')).toBe(null);
    });
  });

  describe('isGenericType', () => {
    it('should identify supported generic types', () => {
      expect(isGenericType('Vec<U32>')).toBe(true);
      expect(isGenericType('Map<Symbol,Bytes>')).toBe(true);
      expect(isGenericType('Option<Address>')).toBe(true);
      expect(isGenericType('Result<U32,String>')).toBe(true);
    });

    it('should reject non-generic types', () => {
      expect(isGenericType('U32')).toBe(false);
      expect(isGenericType('Address')).toBe(false);
      expect(isGenericType('CustomStruct')).toBe(false);
    });

    it('should reject unsupported generic types', () => {
      expect(isGenericType('Set<U32>')).toBe(false);
      expect(isGenericType('List<Address>')).toBe(false);
    });
  });

  describe('parseGeneric', () => {
    const mockParseInnerValue = (val: unknown, type: string) => {
      // Simple mock that returns string representation for testing
      if (type === 'U32' || type === 'U128') return String(val);
      if (type === 'Address') return String(val);
      return val;
    };

    describe('Vec parsing', () => {
      it('should parse Vec types', () => {
        const input = ['100', '200', '300'];
        const result = parseGeneric(input, 'Vec<U128>', mockParseInnerValue);
        expect(result).toEqual(['100', '200', '300']);
      });

      it('should throw error for non-array input to Vec', () => {
        expect(() => parseGeneric('not-array', 'Vec<U32>', mockParseInnerValue)).toThrow(
          'Array expected for Vec type'
        );
      });

      it('should handle empty Vec', () => {
        const result = parseGeneric([], 'Vec<U32>', mockParseInnerValue);
        expect(result).toEqual([]);
      });
    });

    describe('Map parsing', () => {
      it('should parse Map types', () => {
        const input = [
          { key: 'first', value: 'hello' },
          { key: 'second', value: 'world' },
        ];
        const result = parseGeneric(input, 'Map<Symbol,Bytes>', mockParseInnerValue);

        expect(result).toEqual([
          {
            0: { value: 'first', type: 'Symbol' },
            1: { value: 'hello', type: 'Bytes' },
          },
          {
            0: { value: 'second', type: 'Symbol' },
            1: { value: 'world', type: 'Bytes' },
          },
        ]);
      });

      it('should throw error for invalid Map input', () => {
        expect(() =>
          parseGeneric('not-map-array', 'Map<Symbol,Bytes>', mockParseInnerValue)
        ).toThrow('Array of MapEntry objects expected for Map type');
      });
    });

    describe('Option parsing', () => {
      it('should parse Option types with values', () => {
        const result = parseGeneric('123', 'Option<U128>', mockParseInnerValue);
        expect(result).toBe('123');
      });

      it('should handle null Option values', () => {
        expect(parseGeneric(null, 'Option<U128>', mockParseInnerValue)).toBe(null);
        expect(parseGeneric(undefined, 'Option<U128>', mockParseInnerValue)).toBe(null);
        expect(parseGeneric('', 'Option<U128>', mockParseInnerValue)).toBe(null);
      });
    });

    describe('Result parsing', () => {
      it('should parse Result types with ok values', () => {
        const input = { ok: 'success' };
        const result = parseGeneric(input, 'Result<String,Error>', mockParseInnerValue);
        expect(result).toEqual({ ok: 'success' });
      });

      it('should parse Result types with err values', () => {
        const input = { err: 'failure' };
        const result = parseGeneric(input, 'Result<String,Error>', mockParseInnerValue);
        expect(result).toEqual({ err: 'failure' });
      });

      it('should pass through invalid Result format', () => {
        const input = { invalid: 'format' };
        const result = parseGeneric(input, 'Result<String,Error>', mockParseInnerValue);
        expect(result).toBe(input);
      });
    });

    describe('unknown generic types', () => {
      it('should return null for unknown generic types', () => {
        const result = parseGeneric('test', 'Set<U32>', mockParseInnerValue);
        expect(result).toBe(null);
      });
    });

    describe('error handling', () => {
      it('should throw error for malformed type parameters', () => {
        expect(() => parseGeneric(['test'], 'Vec<>', mockParseInnerValue)).toThrow(
          'Could not parse Vec inner type'
        );
      });

      it('should throw error for malformed Map types', () => {
        expect(() =>
          parseGeneric([{ key: 'test', value: 'value' }], 'Map<>', mockParseInnerValue)
        ).toThrow('Could not parse Map types');
      });

      it('should throw error for malformed Option types', () => {
        expect(() => parseGeneric('test', 'Option<>', mockParseInnerValue)).toThrow(
          'Could not parse Option inner type'
        );
      });
    });

    describe('null/undefined handling', () => {
      it('should return null for null input on non-generic types', () => {
        const result = parseGeneric(null, 'NotGeneric', mockParseInnerValue);
        expect(result).toBe(null);
      });
    });
  });
});
