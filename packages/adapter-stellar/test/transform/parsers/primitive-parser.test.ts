import { describe, expect, it } from 'vitest';

import { isPrimitiveType, parsePrimitive } from '../../../src/transform/parsers/primitive-parser';

describe('PrimitiveParser', () => {
  describe('isPrimitiveType', () => {
    it('should identify primitive types correctly', () => {
      expect(isPrimitiveType('Bool')).toBe(true);
      expect(isPrimitiveType('Address')).toBe(true);
      expect(isPrimitiveType('Bytes')).toBe(true);
      expect(isPrimitiveType('DataUrl')).toBe(true);
      expect(isPrimitiveType('BytesN<32>')).toBe(true);
      expect(isPrimitiveType('U32')).toBe(true);
      expect(isPrimitiveType('U64')).toBe(true);
      expect(isPrimitiveType('U128')).toBe(true);
      expect(isPrimitiveType('U256')).toBe(true);
      expect(isPrimitiveType('I32')).toBe(true);
      expect(isPrimitiveType('I64')).toBe(true);
      expect(isPrimitiveType('I128')).toBe(true);
      expect(isPrimitiveType('I256')).toBe(true);
      expect(isPrimitiveType('ScString')).toBe(true);
      expect(isPrimitiveType('ScSymbol')).toBe(true);

      // Non-primitive types
      expect(isPrimitiveType('Vec<U32>')).toBe(false);
      expect(isPrimitiveType('Map<U32,Address>')).toBe(false);
      expect(isPrimitiveType('Option<U32>')).toBe(false);
      expect(isPrimitiveType('CustomStruct')).toBe(false);
    });
  });

  describe('parsePrimitive', () => {
    describe('boolean parsing', () => {
      it('should parse boolean values', () => {
        expect(parsePrimitive(true, 'Bool')).toBe(true);
        expect(parsePrimitive(false, 'Bool')).toBe(false);
        expect(parsePrimitive('true', 'Bool')).toBe(true);
        expect(parsePrimitive('false', 'Bool')).toBe(false);
        expect(parsePrimitive('TRUE', 'Bool')).toBe(true);
        expect(parsePrimitive('False', 'Bool')).toBe(false);
      });

      it('should throw error for invalid boolean', () => {
        expect(() => parsePrimitive(123, 'Bool')).toThrow('Boolean parameter expected');
      });
    });

    describe('address parsing', () => {
      it('should parse valid address values', () => {
        const validAddress = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
        expect(parsePrimitive(validAddress, 'Address')).toBe(validAddress);
      });

      it('should throw error for invalid address', () => {
        expect(() => parsePrimitive('invalid', 'Address')).toThrow(
          'Invalid Stellar address format'
        );
      });
    });

    describe('numeric parsing', () => {
      it('should parse numeric types', () => {
        // U32/U64 should return strings for consistency
        expect(parsePrimitive('123', 'U32')).toBe('123');
        expect(parsePrimitive(123, 'U32')).toBe('123');
        expect(parsePrimitive('456', 'U64')).toBe('456');

        // U128/U256 should return strings for large numbers
        expect(parsePrimitive('999999999999999999', 'U128')).toBe('999999999999999999');
        expect(parsePrimitive(123, 'U128')).toBe('123');

        // Signed integers
        expect(parsePrimitive('-123', 'I32')).toBe('-123');
        expect(parsePrimitive('0', 'I64')).toBe('0');
      });

      it('should throw error for invalid numeric format', () => {
        expect(() => parsePrimitive('abc', 'U32')).toThrow('Invalid number format');
        expect(() => parsePrimitive('12.5', 'U64')).toThrow('Invalid number format');
      });
    });

    describe('bytes parsing', () => {
      it('should parse bytes values', () => {
        // Test hex encoding
        const hexResult = parsePrimitive('48656c6c6f', 'Bytes');
        expect(hexResult).toBeInstanceOf(Uint8Array);
        expect(Array.from(hexResult as Uint8Array)).toEqual([72, 101, 108, 108, 111]);

        // Test hex with 0x prefix
        const hexPrefixResult = parsePrimitive('0x48656c6c6f', 'Bytes');
        expect(hexPrefixResult).toBeInstanceOf(Uint8Array);
        expect(Array.from(hexPrefixResult as Uint8Array)).toEqual([72, 101, 108, 108, 111]);
      });

      it('should parse BytesN types', () => {
        const result = parsePrimitive('48656c6c6f', 'BytesN<5>');
        expect(result).toBeInstanceOf(Uint8Array);
        expect(Array.from(result as Uint8Array)).toEqual([72, 101, 108, 108, 111]);
      });

      it('should throw error for invalid bytes input', () => {
        expect(() => parsePrimitive(123, 'Bytes')).toThrow('Bytes parameter must be a string');
      });
    });

    describe('DataUrl parsing', () => {
      it('should parse DataUrl values (base64)', () => {
        const result = parsePrimitive('SGVsbG8gV29ybGQ=', 'DataUrl'); // "Hello World" in base64
        expect(result).toBeInstanceOf(Uint8Array);
        expect(Array.from(result as Uint8Array)).toEqual([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100,
        ]);
      });

      it('should parse DataUrl values (hex)', () => {
        const result = parsePrimitive('48656c6c6f', 'DataUrl');
        expect(result).toBeInstanceOf(Uint8Array);
        expect(Array.from(result as Uint8Array)).toEqual([72, 101, 108, 108, 111]);
      });

      it('should throw error for invalid DataUrl input', () => {
        expect(() => parsePrimitive(123, 'DataUrl')).toThrow('DataUrl parameter must be a string');
      });
    });

    describe('string parsing', () => {
      it('should parse string types', () => {
        expect(parsePrimitive('hello', 'ScString')).toBe('hello');
        expect(parsePrimitive('symbol', 'ScSymbol')).toBe('symbol');
      });

      it('should throw error for non-string input', () => {
        expect(() => parsePrimitive(123, 'ScString')).toThrow('String parameter expected');
      });
    });

    describe('null/undefined handling', () => {
      it('should return null for null/undefined values', () => {
        expect(parsePrimitive(null, 'Bool')).toBe(null);
        expect(parsePrimitive(undefined, 'U32')).toBe(null);
      });
    });

    describe('non-primitive types', () => {
      it('should return null for non-primitive types', () => {
        expect(parsePrimitive('test', 'Vec<U32>')).toBe(null);
        expect(parsePrimitive('test', 'CustomStruct')).toBe(null);
      });
    });
  });
});
