import { describe, expect, it } from 'vitest';

import { parseMidnightInput } from '../../src/transform/input-parser';

describe('Midnight Input Parser', () => {
  describe('Primitives', () => {
    it('parses bigint', () => {
      expect(parseMidnightInput('1234', 'bigint')).toBe(1234n);
      expect(parseMidnightInput(5678, 'bigint')).toBe(5678n);
    });

    it('parses number', () => {
      expect(parseMidnightInput('42', 'number')).toBe(42);
      expect(parseMidnightInput(99, 'number')).toBe(99);
    });

    it('parses boolean', () => {
      expect(parseMidnightInput('true', 'boolean')).toBe(true);
      expect(parseMidnightInput('false', 'boolean')).toBe(false);
      expect(parseMidnightInput(true, 'boolean')).toBe(true);
      expect(parseMidnightInput(1, 'boolean')).toBe(true);
      expect(parseMidnightInput(0, 'boolean')).toBe(false);
    });

    it('parses string', () => {
      expect(parseMidnightInput('hello', 'string')).toBe('hello');
      expect(parseMidnightInput(5, 'string')).toBe('5');
    });
  });

  describe('Uint<...> types', () => {
    it('parses Uint<0..255> to JavaScript number', () => {
      expect(parseMidnightInput('42', 'Uint<0..255>')).toBe(42);
      expect(parseMidnightInput(100, 'Uint<0..255>')).toBe(100);
    });

    it('parses Uint<0..18446744073709551615> (u64)', () => {
      expect(parseMidnightInput('1234567890', 'Uint<0..18446744073709551615>')).toBe(1234567890);
    });

    it('rejects negative values for Uint', () => {
      expect(() => parseMidnightInput(-5, 'Uint<0..255>')).toThrow(/Invalid Uint value/);
    });

    it('converts bigint to number for Uint', () => {
      expect(parseMidnightInput(BigInt(42), 'Uint<0..255>')).toBe(42);
    });
  });

  describe('Bytes', () => {
    it('parses bytes from hex', () => {
      const bytes = parseMidnightInput('0x0a0b', 'Uint8Array') as Uint8Array;
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(Array.from(bytes)).toEqual([0x0a, 0x0b]);
    });

    it('parses bytes from 0x-prefixed hex (32 bytes)', () => {
      const hex = '0x' + '01'.repeat(32);
      const bytes = parseMidnightInput(hex, 'Bytes<32>') as Uint8Array;
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
    });

    it('validates Bytes<32> size (rejects too short)', () => {
      const hex = '0x00'; // Only 1 byte
      expect(() => parseMidnightInput(hex, 'Bytes<32>')).toThrow(
        /Bytes<32> requires exactly 32 bytes.*Received 1 bytes/
      );
    });

    it('validates Bytes<32> size (rejects too long)', () => {
      const hex = '0x' + '01'.repeat(33); // 33 bytes
      expect(() => parseMidnightInput(hex, 'Bytes<32>')).toThrow(
        /Bytes<32> requires exactly 32 bytes.*Received 33 bytes/
      );
    });

    it('allows dynamic Uint8Array without size validation', () => {
      const hex = '0x0a'; // 1 byte
      const bytes = parseMidnightInput(hex, 'Uint8Array') as Uint8Array;
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(1);
    });

    it('accepts Uint8Array directly', () => {
      const input = new Uint8Array([1, 2, 3]);
      const result = parseMidnightInput(input, 'Uint8Array');
      expect(result).toBe(input);
    });

    it('rejects non-hex strings for bytes', () => {
      expect(() => parseMidnightInput('not-hex', 'Uint8Array')).toThrow(/0x-prefixed hex/);
    });
  });

  describe('Arrays', () => {
    it('parses arrays (JSON string)', () => {
      const arr = parseMidnightInput('["1","2"]', 'Array<number>') as number[];
      expect(arr).toEqual([1, 2]);
    });

    it('parses arrays (native array)', () => {
      const arr = parseMidnightInput([1, 2, 3], 'Array<number>') as number[];
      expect(arr).toEqual([1, 2, 3]);
    });

    it('recursively parses nested arrays', () => {
      const arr = parseMidnightInput('[[1,2],[3,4]]', 'Array<Array<number>>') as number[][];
      expect(arr).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe('Vector<N,T> (fixed-size arrays)', () => {
    it('parses Vector<3, Uint<64>> with exactly 3 elements', () => {
      const vec = parseMidnightInput('[1, 2, 3]', 'Vector<3, Uint<0..18446744073709551615>>');
      expect(vec).toEqual([1, 2, 3]);
    });

    it('rejects Vector with too few elements', () => {
      expect(() =>
        parseMidnightInput('[1, 2]', 'Vector<3, Uint<0..18446744073709551615>>')
      ).toThrow(/requires exactly 3 elements.*Received 2/);
    });

    it('rejects Vector with too many elements', () => {
      expect(() =>
        parseMidnightInput('[1, 2, 3, 4]', 'Vector<3, Uint<0..18446744073709551615>>')
      ).toThrow(/requires exactly 3 elements.*Received 4/);
    });

    it('parses Vector with complex element types', () => {
      // Note: The parser expects raw values for Maybe elements, not pre-wrapped
      // So we pass raw strings which will be wrapped by the Maybe parser
      const vec = parseMidnightInput('["a", ""]', 'Vector<2, Maybe<Opaque<"string">>>');
      expect(vec).toEqual([{ is_some: true, value: 'a' }, { is_some: false }]);
    });
  });

  describe('Maybe<T> (Optional types)', () => {
    it('parses Maybe<T> (empty→{is_some:false})', () => {
      expect(parseMidnightInput('', 'Maybe<number>')).toEqual({ is_some: false });
      expect(parseMidnightInput(null, 'Maybe<number>')).toEqual({ is_some: false });
      expect(parseMidnightInput(undefined, 'Maybe<number>')).toEqual({ is_some: false });
    });

    it('parses Maybe<T> (value→{is_some:true, value:T})', () => {
      expect(parseMidnightInput('5', 'Maybe<number>')).toEqual({ is_some: true, value: 5 });
      expect(parseMidnightInput('hello', 'Maybe<string>')).toEqual({
        is_some: true,
        value: 'hello',
      });
    });

    it('recursively parses Maybe with complex inner types', () => {
      const result = parseMidnightInput('0x0a0b', 'Maybe<Uint8Array>') as {
        is_some: boolean;
        value?: Uint8Array;
      };
      expect(result.is_some).toBe(true);
      expect(result.value).toBeInstanceOf(Uint8Array);
      expect(Array.from(result.value!)).toEqual([0x0a, 0x0b]);
    });
  });

  describe('Nested Maybe<Maybe<T>> (Edge case)', () => {
    it('parses outer none', () => {
      expect(parseMidnightInput('', 'Maybe<Maybe<string>>')).toEqual({ is_some: false });
    });

    it('parses outer some, inner none - from JSON string', () => {
      // When UI sends nested Maybe where outer is some, inner is none
      // The formatter would typically send this as already-wrapped JSON
      const input = JSON.stringify({ is_some: false });
      const result = parseMidnightInput(input, 'Maybe<Maybe<string>>');
      // The outer Maybe wraps it because input is non-empty
      // The inner Maybe parser receives the string and parses it
      expect(result).toHaveProperty('is_some', true);
      expect(result).toHaveProperty('value');
    });

    it('parses both some - from JSON string', () => {
      // When both levels are present, formatter sends as JSON
      const input = JSON.stringify({ is_some: true, value: 'hello' });
      const result = parseMidnightInput(input, 'Maybe<Maybe<string>>');
      expect(result).toHaveProperty('is_some', true);
      expect(result).toHaveProperty('value');
    });

    it('demonstrates the pattern for nested Maybes in practice', () => {
      // In practice, nested Maybes are rare and would be handled by
      // the formatter which constructs the proper nested structure
      // For direct value input:
      const directValue = 'hello';
      const level1 = parseMidnightInput(directValue, 'Maybe<string>');
      expect(level1).toEqual({ is_some: true, value: 'hello' });

      // For nested, the formatter would construct:
      const level2 = { is_some: true, value: level1 };
      expect(level2).toEqual({
        is_some: true,
        value: { is_some: true, value: 'hello' },
      });
    });
  });

  describe('Opaque<T> types', () => {
    it('parses Opaque<"string"> as string', () => {
      expect(parseMidnightInput('test', 'Opaque<"string">')).toBe('test');
    });

    it('accepts any value for opaque types', () => {
      expect(parseMidnightInput(123, 'Opaque<number>')).toBe(123);
      expect(parseMidnightInput({ a: 1 }, 'Opaque<object>')).toEqual({ a: 1 });
    });
  });

  describe('Enum types (pass-through)', () => {
    it('accepts enum values as strings', () => {
      expect(parseMidnightInput('red', 'Color')).toBe('red');
    });

    it('accepts enum values as numbers', () => {
      expect(parseMidnightInput(0, 'Color')).toBe(0);
    });

    it('accepts enum objects', () => {
      expect(parseMidnightInput({ variant: 'red' }, 'Color')).toEqual({ variant: 'red' });
    });
  });

  describe('Complex nested structures', () => {
    it('parses Vector<5, Maybe<Color>>', () => {
      // Pass raw enum values; Maybe parser will wrap them
      const input = ['red', '', 'blue', '', 'green'];
      const result = parseMidnightInput(JSON.stringify(input), 'Vector<5, Maybe<Color>>');
      expect(result).toEqual([
        { is_some: true, value: 'red' },
        { is_some: false },
        { is_some: true, value: 'blue' },
        { is_some: false },
        { is_some: true, value: 'green' },
      ]);
    });

    it('parses nested vectors', () => {
      const input = [
        [1, 2],
        [3, 4],
        [5, 6],
      ];
      const result = parseMidnightInput(
        JSON.stringify(input),
        'Vector<3, [Uint<0..255>, Uint<0..255>]>'
      );
      expect(result).toEqual(input);
    });
  });

  describe('Error handling', () => {
    it('throws for empty bigint values', () => {
      expect(() => parseMidnightInput('', 'bigint')).toThrow(/Numeric value cannot be empty/);
    });

    it('rejects invalid number input', () => {
      expect(() => parseMidnightInput('not-a-number', 'number')).toThrow(/Invalid number value/);
    });

    it('throws for invalid JSON in arrays', () => {
      expect(() => parseMidnightInput('[invalid json', 'Array<number>')).toThrow(
        /Invalid JSON for array/
      );
    });

    it('throws for non-array input when array expected', () => {
      expect(() => parseMidnightInput('not-an-array', 'Array<number>')).toThrow(
        /Invalid JSON for array/
      );
    });
  });
});
