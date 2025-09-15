import { describe, expect, it } from 'vitest';

import { base64ToBytes, bytesToHex, hexToBytes, stringToBytes } from '../bytesConversion';

describe('bytesConversion', () => {
  describe('hexToBytes', () => {
    it('should convert hex string to Uint8Array', () => {
      const result = hexToBytes('48656c6c6f');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]); // "Hello"
    });

    it('should handle hex string with 0x prefix', () => {
      const result = hexToBytes('0x48656c6c6f');
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should handle uppercase hex', () => {
      const result = hexToBytes('48656C6C6F');
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should handle empty hex string', () => {
      const result = hexToBytes('');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('should throw error for odd-length hex string', () => {
      expect(() => hexToBytes('48656c6c6')).toThrow('Hex string must have even length');
    });

    it('should throw error for invalid hex characters', () => {
      expect(() => hexToBytes('48656g6c6f')).toThrow();
    });

    it('should handle single byte', () => {
      const result = hexToBytes('ff');
      expect(Array.from(result)).toEqual([255]);
    });

    it('should handle zero bytes', () => {
      const result = hexToBytes('0000');
      expect(Array.from(result)).toEqual([0, 0]);
    });
  });

  describe('base64ToBytes', () => {
    it('should convert base64 string to Uint8Array', () => {
      const result = base64ToBytes('SGVsbG8='); // "Hello"
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should handle base64 without padding', () => {
      const result = base64ToBytes('SGVsbG8'); // "Hello" without padding
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should handle empty base64 string', () => {
      const result = base64ToBytes('');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('should handle longer base64 strings', () => {
      const result = base64ToBytes('SGVsbG8gV29ybGQ='); // "Hello World"
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]);
    });

    it('should throw error for invalid base64', () => {
      expect(() => base64ToBytes('invalid@base64')).toThrow();
    });

    it('should handle special characters in base64', () => {
      const result = base64ToBytes('YWJjLzEyMys='); // "abc/123+"
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('bytesToHex', () => {
    it('should convert Uint8Array to hex string', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const result = bytesToHex(bytes);
      expect(result).toBe('48656c6c6f');
    });

    it('should convert with 0x prefix when requested', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const result = bytesToHex(bytes, true);
      expect(result).toBe('0x48656c6c6f');
    });

    it('should handle empty Uint8Array', () => {
      const bytes = new Uint8Array([]);
      const result = bytesToHex(bytes);
      expect(result).toBe('');
    });

    it('should pad single digit hex values', () => {
      const bytes = new Uint8Array([1, 15, 255]);
      const result = bytesToHex(bytes);
      expect(result).toBe('010fff');
    });

    it('should handle zero bytes', () => {
      const bytes = new Uint8Array([0, 0, 0]);
      const result = bytesToHex(bytes);
      expect(result).toBe('000000');
    });

    it('should handle max byte values', () => {
      const bytes = new Uint8Array([255, 255]);
      const result = bytesToHex(bytes);
      expect(result).toBe('ffff');
    });
  });

  describe('stringToBytes', () => {
    it('should convert hex string using hex encoding', () => {
      const result = stringToBytes('48656c6c6f', 'hex');
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should convert base64 string using base64 encoding', () => {
      const result = stringToBytes('SGVsbG8=', 'base64');
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should handle hex with 0x prefix', () => {
      const result = stringToBytes('0x48656c6c6f', 'hex');
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should throw error for unsupported encoding', () => {
      expect(() => stringToBytes('test', 'unknown' as never)).toThrow(
        'Unsupported encoding: unknown'
      );
    });

    it('should handle empty strings', () => {
      const hexResult = stringToBytes('', 'hex');
      expect(hexResult.length).toBe(0);

      const base64Result = stringToBytes('', 'base64');
      expect(base64Result.length).toBe(0);
    });
  });

  describe('integration tests', () => {
    it('should round-trip hex conversion', () => {
      const originalBytes = new Uint8Array([1, 2, 3, 255, 0, 128]);
      const hex = bytesToHex(originalBytes);
      const convertedBytes = hexToBytes(hex);
      expect(Array.from(convertedBytes)).toEqual(Array.from(originalBytes));
    });

    it('should round-trip base64 conversion via manual steps', () => {
      const originalBytes = new Uint8Array([72, 101, 108, 108, 111]);

      // Convert to base64 using browser API
      const base64 = btoa(String.fromCharCode(...originalBytes));
      const convertedBytes = base64ToBytes(base64);

      expect(Array.from(convertedBytes)).toEqual(Array.from(originalBytes));
    });

    it('should work with real-world blockchain data patterns', () => {
      // Test with typical blockchain address pattern
      const addressHex = '0000000000000000000000000000000000000001';
      const addressBytes = hexToBytes(addressHex);
      expect(addressBytes.length).toBe(20);
      expect(bytesToHex(addressBytes)).toBe(addressHex);
    });

    it('should handle contract bytecode-like data', () => {
      const bytecode = '608060405234801561001057600080fd5b50';
      const bytes = hexToBytes(bytecode);
      expect(bytes.length).toBe(18); // 36 hex chars / 2 = 18 bytes
      expect(bytesToHex(bytes)).toBe(bytecode.toLowerCase());
    });
  });
});
