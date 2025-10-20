import { bech32m } from '@scure/base';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONTRACT_VALIDATION_ERRORS,
  contractAddressToHex,
  formatContractAddress,
  isValidAddress,
  isValidContractAddressFormat,
  isValidUserAddressFormat,
  MIDNIGHT_ADDRESS_PREFIXES,
  USER_VALIDATION_ERRORS,
  validateContractAddress,
  validateUserAddress,
} from '../address';

// Mock the bech32m module
vi.mock('@scure/base', () => ({
  bech32m: {
    decode: vi.fn(),
  },
}));

const mockBech32m = bech32m as unknown as {
  decode: ReturnType<typeof vi.fn>;
};

describe('Contract Address Validation', () => {
  describe('validateContractAddress', () => {
    it('should validate a correct contract address', () => {
      const validAddress = '0200326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6';
      const result = validateContractAddress(validAddress);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.normalized).toBe(validAddress);
    });

    it('should normalize uppercase addresses to lowercase', () => {
      const upperAddress = '0200326C95873182775840764AE28E8750F73A68F236800171EBD92520E96A9FFFB6';
      const result = validateContractAddress(upperAddress);

      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe(upperAddress.toLowerCase());
    });

    it('should trim whitespace from addresses', () => {
      const addressWithSpaces =
        '  0200326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6  ';
      const result = validateContractAddress(addressWithSpaces);

      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe(addressWithSpaces.trim().toLowerCase());
    });

    it('should reject null or undefined', () => {
      // @ts-expect-error Testing invalid input
      const resultNull = validateContractAddress(null);
      // @ts-expect-error Testing invalid input
      const resultUndefined = validateContractAddress(undefined);

      expect(resultNull.isValid).toBe(false);
      expect(resultNull.error).toBe(CONTRACT_VALIDATION_ERRORS.INVALID_FORMAT);
      expect(resultUndefined.isValid).toBe(false);
      expect(resultUndefined.error).toBe(CONTRACT_VALIDATION_ERRORS.INVALID_FORMAT);
    });

    it('should reject non-string input', () => {
      // @ts-expect-error Testing invalid input
      const result = validateContractAddress(12345);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(CONTRACT_VALIDATION_ERRORS.INVALID_FORMAT);
    });

    it('should reject addresses with incorrect length', () => {
      const shortAddress = '0200326c958731';
      const longAddress = '0200326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6aa';

      const resultShort = validateContractAddress(shortAddress);
      const resultLong = validateContractAddress(longAddress);

      expect(resultShort.isValid).toBe(false);
      expect(resultShort.error).toBe(CONTRACT_VALIDATION_ERRORS.INVALID_LENGTH);
      expect(resultLong.isValid).toBe(false);
      expect(resultLong.error).toBe(CONTRACT_VALIDATION_ERRORS.INVALID_LENGTH);
    });

    it('should reject addresses with incorrect prefix', () => {
      const wrongPrefix = '0100326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6';

      const result = validateContractAddress(wrongPrefix);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(CONTRACT_VALIDATION_ERRORS.INVALID_PREFIX);
    });

    it('should reject addresses with non-hex characters', () => {
      const nonHexAddress = '0200326g95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6';

      const result = validateContractAddress(nonHexAddress);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(CONTRACT_VALIDATION_ERRORS.INVALID_CHARACTERS);
    });

    it('should handle exceptions gracefully', () => {
      // Empty string edge case
      const result = validateContractAddress('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('formatContractAddress', () => {
    it('should format a valid address', () => {
      const validAddress = '0200326C95873182775840764AE28E8750F73A68F236800171EBD92520E96A9FFFB6';
      const result = formatContractAddress(validAddress);

      expect(result).toBe(validAddress.toLowerCase());
    });

    it('should return null for invalid address', () => {
      const invalidAddress = 'invalid';
      const result = formatContractAddress(invalidAddress);

      expect(result).toBeNull();
    });
  });

  describe('contractAddressToHex', () => {
    it('should convert a valid contract address to hex', () => {
      const validAddress = '0200326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6';
      const result = contractAddressToHex(validAddress);

      expect(result).toBe(validAddress);
    });

    it('should throw error for invalid address', () => {
      const invalidAddress = 'invalid';

      expect(() => contractAddressToHex(invalidAddress)).toThrow('Invalid contract address');
    });
  });

  describe('isValidContractAddressFormat', () => {
    it('should return true for valid contract address format', () => {
      const validAddress = '0200326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6';

      expect(isValidContractAddressFormat(validAddress)).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(isValidContractAddressFormat('invalid')).toBe(false);
      expect(isValidContractAddressFormat('')).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidContractAddressFormat(null)).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidContractAddressFormat(undefined)).toBe(false);
    });

    it('should handle whitespace correctly', () => {
      const addressWithSpaces =
        '  0200326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6  ';

      expect(isValidContractAddressFormat(addressWithSpaces)).toBe(true);
    });
  });
});

describe('User Address Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUserAddress', () => {
    it('should validate a correct shielded address', () => {
      const shieldedAddress = 'addr1test123';
      mockBech32m.decode.mockReturnValue({
        prefix: 'addr',
        words: [1, 2, 3, 4],
      });

      const result = validateUserAddress(shieldedAddress);

      expect(result.isValid).toBe(true);
      expect(result.prefix).toBe('addr');
      expect(result.error).toBeUndefined();
      expect(mockBech32m.decode).toHaveBeenCalledWith(shieldedAddress.toLowerCase());
    });

    it('should validate a correct unshielded address', () => {
      const unshieldedAddress = 'naddr1test456';
      mockBech32m.decode.mockReturnValue({
        prefix: 'naddr',
        words: [5, 6, 7, 8],
      });

      const result = validateUserAddress(unshieldedAddress);

      expect(result.isValid).toBe(true);
      expect(result.prefix).toBe('naddr');
    });

    it('should validate dust addresses', () => {
      const dustAddress = 'dust1test789';
      mockBech32m.decode.mockReturnValue({
        prefix: 'dust',
        words: [9, 10, 11],
      });

      const result = validateUserAddress(dustAddress);

      expect(result.isValid).toBe(true);
      expect(result.prefix).toBe('dust');
    });

    it('should validate coin public keys', () => {
      const cpkAddress = 'cpk1testxyz';
      mockBech32m.decode.mockReturnValue({
        prefix: 'cpk',
        words: [12, 13, 14],
      });

      const result = validateUserAddress(cpkAddress);

      expect(result.isValid).toBe(true);
      expect(result.prefix).toBe('cpk');
    });

    it('should validate encryption public keys', () => {
      const epkAddress = 'epk1testabc';
      mockBech32m.decode.mockReturnValue({
        prefix: 'epk',
        words: [15, 16, 17],
      });

      const result = validateUserAddress(epkAddress);

      expect(result.isValid).toBe(true);
      expect(result.prefix).toBe('epk');
    });

    it('should reject invalid prefix', () => {
      const invalidPrefix = 'invalid1test';
      mockBech32m.decode.mockReturnValue({
        prefix: 'invalid',
        words: [1, 2, 3],
      });

      const result = validateUserAddress(invalidPrefix);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(USER_VALIDATION_ERRORS.INVALID_PREFIX);
      expect(result.prefix).toBe('invalid');
    });

    it('should reject null or undefined', () => {
      // @ts-expect-error Testing invalid input
      const resultNull = validateUserAddress(null);
      // @ts-expect-error Testing invalid input
      const resultUndefined = validateUserAddress(undefined);

      expect(resultNull.isValid).toBe(false);
      expect(resultNull.error).toBe(USER_VALIDATION_ERRORS.INVALID_FORMAT);
      expect(resultUndefined.isValid).toBe(false);
      expect(resultUndefined.error).toBe(USER_VALIDATION_ERRORS.INVALID_FORMAT);
    });

    it('should reject non-string input', () => {
      // @ts-expect-error Testing invalid input
      const result = validateUserAddress(12345);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(USER_VALIDATION_ERRORS.INVALID_FORMAT);
    });

    it('should reject empty string', () => {
      const result = validateUserAddress('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(USER_VALIDATION_ERRORS.INVALID_FORMAT);
    });

    it('should handle bech32m decoding errors', () => {
      const invalidBech32 = 'addr1invalid';
      mockBech32m.decode.mockImplementation(() => {
        throw new Error('Invalid bech32m');
      });

      const result = validateUserAddress(invalidBech32);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(USER_VALIDATION_ERRORS.INVALID_BECH32M);
    });

    it('should normalize addresses to lowercase before validation', () => {
      const upperAddress = 'ADDR1TEST123';
      mockBech32m.decode.mockReturnValue({
        prefix: 'addr',
        words: [1, 2, 3, 4],
      });

      const result = validateUserAddress(upperAddress);

      expect(result.isValid).toBe(true);
      expect(mockBech32m.decode).toHaveBeenCalledWith(upperAddress.toLowerCase());
    });

    it('should trim whitespace', () => {
      const addressWithSpaces = '  addr1test123  ';
      mockBech32m.decode.mockReturnValue({
        prefix: 'addr',
        words: [1, 2, 3, 4],
      });

      const result = validateUserAddress(addressWithSpaces);

      expect(result.isValid).toBe(true);
      expect(mockBech32m.decode).toHaveBeenCalledWith('addr1test123');
    });
  });

  describe('isValidUserAddressFormat', () => {
    it('should return true for addresses with valid prefixes', () => {
      Object.values(MIDNIGHT_ADDRESS_PREFIXES).forEach((prefix) => {
        const address = `${prefix}1testtesttesttest`;
        expect(isValidUserAddressFormat(address)).toBe(true);
      });
    });

    it('should return false for invalid prefixes', () => {
      expect(isValidUserAddressFormat('invalid1test')).toBe(false);
      expect(isValidUserAddressFormat('test')).toBe(false);
    });

    it('should return false for too short addresses', () => {
      expect(isValidUserAddressFormat('addr1test')).toBe(false);
    });

    it('should return false for empty or null', () => {
      expect(isValidUserAddressFormat('')).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidUserAddressFormat(null)).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidUserAddressFormat(undefined)).toBe(false);
    });

    it('should handle whitespace', () => {
      const addressWithSpaces = '  addr1testtesttesttest  ';
      expect(isValidUserAddressFormat(addressWithSpaces)).toBe(true);
    });
  });
});

describe('isValidAddress (generic validator)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for valid contract address', () => {
    const contractAddress = '0200326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6';

    const result = isValidAddress(contractAddress);

    expect(result).toBe(true);
  });

  it('should return true for valid user address (shielded)', () => {
    const userAddress = 'addr1testtesttesttest';
    mockBech32m.decode.mockReturnValue({
      prefix: 'addr',
      words: [1, 2, 3, 4],
    });

    const result = isValidAddress(userAddress);

    expect(result).toBe(true);
  });

  it('should return true for valid user address (unshielded)', () => {
    const userAddress = 'naddr1testtesttesttest';
    mockBech32m.decode.mockReturnValue({
      prefix: 'naddr',
      words: [1, 2, 3, 4],
    });

    const result = isValidAddress(userAddress);

    expect(result).toBe(true);
  });

  it('should return false for invalid addresses', () => {
    expect(isValidAddress('invalid')).toBe(false);
    expect(isValidAddress('')).toBe(false);
    // @ts-expect-error Testing invalid input
    expect(isValidAddress(null)).toBe(false);
    // @ts-expect-error Testing invalid input
    expect(isValidAddress(undefined)).toBe(false);
  });

  it('should prioritize contract address format check', () => {
    const contractAddress = '0200326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6';

    const result = isValidAddress(contractAddress);

    expect(result).toBe(true);
    // bech32m.decode should not be called for contract addresses
    expect(mockBech32m.decode).not.toHaveBeenCalled();
  });

  it('should fall back to user address validation', () => {
    const userAddress = 'addr1testtesttesttest';
    mockBech32m.decode.mockReturnValue({
      prefix: 'addr',
      words: [1, 2, 3, 4],
    });

    const result = isValidAddress(userAddress);

    expect(result).toBe(true);
    expect(mockBech32m.decode).toHaveBeenCalled();
  });

  it('should handle addresses that look like neither contract nor user', () => {
    const ambiguousAddress = 'notavalidaddress';

    const result = isValidAddress(ambiguousAddress);

    expect(result).toBe(false);
  });
});

describe('Constants', () => {
  it('should have correct CONTRACT_VALIDATION_ERRORS', () => {
    expect(CONTRACT_VALIDATION_ERRORS.INVALID_FORMAT).toBe('Invalid contract address format');
    expect(CONTRACT_VALIDATION_ERRORS.INVALID_LENGTH).toBe(
      'Contract address must be 68 hex characters'
    );
    expect(CONTRACT_VALIDATION_ERRORS.INVALID_PREFIX).toBe('Contract address must start with 0200');
    expect(CONTRACT_VALIDATION_ERRORS.INVALID_CHARACTERS).toBe(
      'Invalid characters in contract address'
    );
  });

  it('should have correct USER_VALIDATION_ERRORS', () => {
    expect(USER_VALIDATION_ERRORS.INVALID_FORMAT).toBe('Invalid address format');
    expect(USER_VALIDATION_ERRORS.INVALID_BECH32M).toBe('Invalid Bech32m encoding');
    expect(USER_VALIDATION_ERRORS.INVALID_PREFIX).toBe('Invalid address prefix');
  });

  it('should have correct MIDNIGHT_ADDRESS_PREFIXES', () => {
    expect(MIDNIGHT_ADDRESS_PREFIXES.SHIELDED).toBe('addr');
    expect(MIDNIGHT_ADDRESS_PREFIXES.UNSHIELDED).toBe('naddr');
    expect(MIDNIGHT_ADDRESS_PREFIXES.DUST).toBe('dust');
    expect(MIDNIGHT_ADDRESS_PREFIXES.COIN_PUBLIC_KEY).toBe('cpk');
    expect(MIDNIGHT_ADDRESS_PREFIXES.ENCRYPTION_PUBLIC_KEY).toBe('epk');
  });
});
