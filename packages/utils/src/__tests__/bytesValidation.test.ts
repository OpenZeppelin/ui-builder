import { describe, expect, it } from 'vitest';

import { getBytesSize, validateBytes, validateBytesSimple } from '../bytesValidation';

describe('bytesValidation', () => {
  describe('validateBytes', () => {
    describe('empty and whitespace handling', () => {
      it('should accept empty string', () => {
        const result = validateBytes('');
        expect(result.isValid).toBe(true);
        expect(result.cleanedValue).toBe('');
        expect(result.byteSize).toBe(0);
      });

      it('should accept whitespace-only string', () => {
        const result = validateBytes('   ');
        expect(result.isValid).toBe(true);
        expect(result.cleanedValue).toBe('');
      });

      it('should clean whitespace from input', () => {
        const result = validateBytes(' 48 65 6c 6c 6f ');
        expect(result.isValid).toBe(true);
        expect(result.cleanedValue).toBe('48656c6c6f');
        expect(result.detectedFormat).toBe('hex');
      });

      it('should reject 0x with no content', () => {
        const result = validateBytes('0x');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Bytes value cannot be empty');
      });
    });

    describe('hex validation', () => {
      it('should validate correct hex string', () => {
        const result = validateBytes('48656c6c6f');
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('hex');
        expect(result.byteSize).toBe(5);
        expect(result.cleanedValue).toBe('48656c6c6f');
      });

      it('should validate hex with 0x prefix', () => {
        const result = validateBytes('0x48656c6c6f');
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('hex');
        expect(result.byteSize).toBe(5);
        expect(result.cleanedValue).toBe('0x48656c6c6f');
      });

      it('should validate uppercase hex', () => {
        const result = validateBytes('DEADBEEF');
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('hex');
        expect(result.byteSize).toBe(4);
      });

      it('should validate mixed case hex', () => {
        const result = validateBytes('DeAdBeEf');
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('hex');
        expect(result.byteSize).toBe(4);
      });

      it('should reject hex with invalid characters', () => {
        const result = validateBytes('48656c6g6f');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid format. Expected hex or base64 encoding');
      });

      it('should reject odd-length hex string', () => {
        const result = validateBytes('48656c6c6');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Hex string must have even number of characters');
      });

      it('should reject hex containing s character but accept as base64', () => {
        const result = validateBytes('fdsdfsdd');
        // fdsdfsdd contains 's' so it's not valid hex, but it IS valid base64
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('base64');
      });
    });

    describe('base64 validation', () => {
      it('should validate correct base64 string', () => {
        const result = validateBytes('SGVsbG8=');
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('base64');
        expect(result.byteSize).toBe(5);
      });

      it('should reject base64 without proper padding', () => {
        // validator.js requires proper base64 padding
        const result = validateBytes('SGVsbG8');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid format. Expected hex or base64 encoding');
      });

      it('should validate what looks like random text but is valid base64', () => {
        // This was from the user's example - fdsdfsdd is actually valid base64!
        const result = validateBytes('fdsdfsdd');
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('base64');
        expect(result.byteSize).toBeGreaterThan(0);
      });

      it('should reject invalid base64 with spaces', () => {
        const result = validateBytes('fd sdf sd');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid format. Expected hex or base64 encoding');
      });

      it('should reject invalid base64 characters', () => {
        const result = validateBytes('SGVsbG8@');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid format. Expected hex or base64 encoding');
      });
    });

    describe('format restrictions', () => {
      it('should accept only hex when specified', () => {
        const result = validateBytes('48656c6c6f', { acceptedFormats: 'hex' });
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('hex');
      });

      it('should reject base64 when only hex allowed', () => {
        const result = validateBytes('SGVsbG8=', { acceptedFormats: 'hex' });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Only hex format is accepted for this field');
      });

      it('should accept only base64 when specified', () => {
        const result = validateBytes('SGVsbG8=', { acceptedFormats: 'base64' });
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('base64');
      });

      it('should reject hex when only base64 allowed', () => {
        const result = validateBytes('48656c6c6f', { acceptedFormats: 'base64' });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Only base64 format is accepted for this field');
      });
    });

    describe('hex prefix policy', () => {
      it('should allow 0x prefix by default', () => {
        const result = validateBytes('0x48656c6c6f');
        expect(result.isValid).toBe(true);
      });

      it('should reject 0x prefix when not allowed', () => {
        const result = validateBytes('0x48656c6c6f', { allowHexPrefix: false });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('0x prefix not allowed for this field');
      });

      it('should still accept hex without prefix when prefix not allowed', () => {
        const result = validateBytes('48656c6c6f', { allowHexPrefix: false });
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('hex');
      });
    });

    describe('byte length limits', () => {
      it('should enforce max bytes for hex', () => {
        const result = validateBytes('48656c6c6f', { maxBytes: 3 }); // 5 bytes, limit 3
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Maximum 3 bytes allowed (6 hex characters)');
      });

      it('should allow hex within byte limit', () => {
        const result = validateBytes('48656c6c6f', { maxBytes: 5 }); // 5 bytes, limit 5
        expect(result.isValid).toBe(true);
      });

      it('should enforce max bytes for base64', () => {
        const result = validateBytes('SGVsbG9Xb3JsZA==', { maxBytes: 5 }); // "HelloWorld" = 10 bytes, limit 5
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Maximum 5 bytes allowed (5 bytes)');
      });

      it('should allow base64 within byte limit', () => {
        const result = validateBytes('SGVsbG8=', { maxBytes: 5 }); // "Hello" = 5 bytes, limit 5
        expect(result.isValid).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle single character hex', () => {
        const result = validateBytes('a');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Hex string must have even number of characters');
      });

      it('should handle minimal valid hex', () => {
        const result = validateBytes('aa');
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('hex');
        expect(result.byteSize).toBe(1);
      });

      it('should handle large hex strings', () => {
        const largeHex = '48'.repeat(100); // 100 bytes
        const result = validateBytes(largeHex);
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('hex');
        expect(result.byteSize).toBe(100);
      });

      it('should handle case sensitivity in hex', () => {
        const result1 = validateBytes('deadbeef');
        const result2 = validateBytes('DEADBEEF');
        const result3 = validateBytes('DeAdBeEf');

        expect(result1.isValid).toBe(true);
        expect(result2.isValid).toBe(true);
        expect(result3.isValid).toBe(true);
      });
    });
  });

  describe('validateBytesSimple', () => {
    it('should return true for valid input', () => {
      const result = validateBytesSimple('48656c6c6f');
      expect(result).toBe(true);
    });

    it('should return error string for invalid input', () => {
      const result = validateBytesSimple('invalid');
      expect(typeof result).toBe('string');
      expect(result).toContain('Invalid format');
    });

    it('should return true for empty input', () => {
      const result = validateBytesSimple('');
      expect(result).toBe(true);
    });

    it('should return specific error for format restriction', () => {
      const result = validateBytesSimple('SGVsbG8=', { acceptedFormats: 'hex' });
      expect(result).toBe('Only hex format is accepted for this field');
    });

    it('should return specific error for byte limit', () => {
      const result = validateBytesSimple('48656c6c6f', { maxBytes: 3 });
      expect(result).toBe('Maximum 3 bytes allowed (6 hex characters)');
    });
  });

  describe('real-world scenarios', () => {
    describe('user input examples from issue', () => {
      it('should handle "fd sdf sd" correctly', () => {
        const result = validateBytes('fd sdf sd');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid format. Expected hex or base64 encoding');
      });

      it('should handle "fd sdf sdd" correctly', () => {
        // After cleaning spaces, "fd sdf sdd" becomes "fdsdfsdd" which is valid base64
        const result = validateBytes('fd sdf sdd');
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('base64');
        expect(result.cleanedValue).toBe('fdsdfsdd');
      });

      it('should handle cleaned "fdsdfsdd" correctly', () => {
        // This is actually valid base64!
        const result = validateBytes('fdsdfsdd');
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('base64');
      });

      it('should handle cleaned "fdsdfsd" correctly', () => {
        const result = validateBytes('fdsdfsd');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid format. Expected hex or base64 encoding');
      });
    });

    describe('blockchain common formats', () => {
      it('should validate Ethereum addresses as hex', () => {
        const result = validateBytes('0x742d35Cc6639C6532b5F3e4f7bf4B2a4B6a4A5C7');
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('hex');
        expect(result.byteSize).toBe(20);
      });

      it('should validate transaction hashes', () => {
        const result = validateBytes(
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        );
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('hex');
        expect(result.byteSize).toBe(32);
      });

      it('should validate encoded function data', () => {
        const result = validateBytes(
          '0xa9059cbb000000000000000000000000742d35cc6639c6532b5f3e4f7bf4b2a4b6a4a5c7'
        );
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('hex');
      });

      it('should validate base64 encoded contract data', () => {
        const result = validateBytes('SGVsbG8gV29ybGQ='); // "Hello World"
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('base64');
        expect(result.byteSize).toBe(11);
      });

      it('should validate EVM bytes32 values with 0x prefix', () => {
        // Typical EVM bytes32 like keccak256 hash
        const bytes32Hash = '0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6';
        const result = validateBytes(bytes32Hash);
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('hex');
        expect(result.byteSize).toBe(32);
        expect(result.cleanedValue).toBe(bytes32Hash);
      });

      it('should validate EVM bytes32 without 0x prefix', () => {
        // Same bytes32 without prefix
        const bytes32Hash = 'c89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6';
        const result = validateBytes(bytes32Hash);
        expect(result.isValid).toBe(true);
        expect(result.detectedFormat).toBe('hex');
        expect(result.byteSize).toBe(32);
      });
    });
  });

  describe('getBytesSize', () => {
    it('extracts size from Bytes<N>', () => {
      expect(getBytesSize('Bytes<32>')).toBe(32);
      expect(getBytesSize('Bytes<64>')).toBe(64);
      expect(getBytesSize('Bytes<256>')).toBe(256);
      expect(getBytesSize('Bytes<1>')).toBe(1);
    });

    it('returns undefined for dynamic Uint8Array', () => {
      expect(getBytesSize('Uint8Array')).toBeUndefined();
      expect(getBytesSize('bytes')).toBeUndefined();
      expect(getBytesSize('byteslike')).toBeUndefined();
    });

    it('is case-insensitive', () => {
      expect(getBytesSize('bytes<32>')).toBe(32);
      expect(getBytesSize('BYTES<64>')).toBe(64);
      expect(getBytesSize('Bytes<128>')).toBe(128);
    });

    it('handles whitespace', () => {
      // Note: getBytesSize uses strict regex, so whitespace should fail
      // But let's test to document behavior
      expect(getBytesSize('Bytes< 32 >')).toBeUndefined();
    });
  });
});
