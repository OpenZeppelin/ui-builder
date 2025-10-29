import { MidnightBech32m } from '@midnight-ntwrk/wallet-sdk-address-format';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONTRACT_VALIDATION_ERRORS,
  contractAddressToHex,
  formatContractAddress,
  isValidAddress,
  isValidContractAddressFormat,
  isValidUserAddressFormat,
  MIDNIGHT_ADDRESS_TYPES,
  USER_VALIDATION_ERRORS,
  validateContractAddress,
  validateUserAddress,
} from '../address';

// Mock the MidnightBech32m module
vi.mock('@midnight-ntwrk/wallet-sdk-address-format', () => ({
  MidnightBech32m: {
    parse: vi.fn(),
  },
}));

const mockParse = vi.mocked(MidnightBech32m.parse);

// Type for mock return value - partial mock of MidnightBech32m
type MockBech32mResult = {
  type: string;
  data: Uint8Array;
};

// Helper to cast mock return values safely
const createMockBech32m = (result: MockBech32mResult) =>
  result as unknown as ReturnType<typeof MidnightBech32m.parse>;

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
      const shieldedAddress =
        'mn_shield-addr_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
      mockParse.mockReturnValue(
        createMockBech32m({
          type: 'addr',
          data: new Uint8Array([1, 2, 3, 4]),
        })
      );

      const result = validateUserAddress(shieldedAddress);

      expect(result.isValid).toBe(true);
      expect(result.prefix).toBe('addr');
      expect(result.error).toBeUndefined();
      expect(mockParse).toHaveBeenCalledWith(shieldedAddress.toLowerCase());
    });

    it('should validate a correct unshielded address', () => {
      const unshieldedAddress =
        'mn_shield-naddr_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
      mockParse.mockReturnValue(
        createMockBech32m({
          type: 'naddr',
          data: new Uint8Array([5, 6, 7, 8]),
        })
      );

      const result = validateUserAddress(unshieldedAddress);

      expect(result.isValid).toBe(true);
      expect(result.prefix).toBe('naddr');
    });

    it('should validate dust addresses', () => {
      const dustAddress =
        'mn_shield-dust_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
      mockParse.mockReturnValue(
        createMockBech32m({
          type: 'dust',
          data: new Uint8Array([9, 10, 11]),
        })
      );

      const result = validateUserAddress(dustAddress);

      expect(result.isValid).toBe(true);
      expect(result.prefix).toBe('dust');
    });

    it('should validate coin public keys', () => {
      const cpkAddress =
        'mn_shield-cpk_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
      mockParse.mockReturnValue(
        createMockBech32m({
          type: 'cpk',
          data: new Uint8Array([12, 13, 14]),
        })
      );

      const result = validateUserAddress(cpkAddress);

      expect(result.isValid).toBe(true);
      expect(result.prefix).toBe('cpk');
    });

    it('should validate encryption public keys', () => {
      const epkAddress =
        'mn_shield-epk_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
      mockParse.mockReturnValue(
        createMockBech32m({
          type: 'epk',
          data: new Uint8Array([15, 16, 17]),
        })
      );

      const result = validateUserAddress(epkAddress);

      expect(result.isValid).toBe(true);
      expect(result.prefix).toBe('epk');
    });

    it('should reject invalid prefix', () => {
      const invalidPrefix =
        'mn_shield-invalid_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';

      const result = validateUserAddress(invalidPrefix);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(USER_VALIDATION_ERRORS.INVALID_PREFIX);
      expect(result.prefix).toBe('mn_shield-invalid_test');
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
      const invalidBech32 =
        'mn_shield-addr_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqinvalid';
      mockParse.mockImplementation(() => {
        throw new Error('Invalid bech32m');
      });

      const result = validateUserAddress(invalidBech32);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(USER_VALIDATION_ERRORS.INVALID_BECH32M);
    });

    it('should normalize addresses to lowercase before validation', () => {
      const upperAddress =
        'MN_SHIELD-ADDR_TEST1QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ';
      mockParse.mockReturnValue(
        createMockBech32m({
          type: 'addr',
          data: new Uint8Array([1, 2, 3, 4]),
        })
      );

      const result = validateUserAddress(upperAddress);

      expect(result.isValid).toBe(true);
      expect(mockParse).toHaveBeenCalledWith(upperAddress.toLowerCase());
    });

    it('should trim whitespace', () => {
      const addressWithSpaces =
        '  mn_shield-addr_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq  ';
      mockParse.mockReturnValue(
        createMockBech32m({
          type: 'addr',
          data: new Uint8Array([1, 2, 3, 4]),
        })
      );

      const result = validateUserAddress(addressWithSpaces);

      expect(result.isValid).toBe(true);
      expect(mockParse).toHaveBeenCalledWith(
        'mn_shield-addr_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'
      );
    });
  });

  describe('isValidUserAddressFormat', () => {
    it('should return true for addresses with valid prefixes', () => {
      Object.values(MIDNIGHT_ADDRESS_TYPES).forEach((prefix) => {
        // The format checker now looks for addresses that contain the type
        // and have a '1' separator, so we need longer addresses
        const address = `${prefix}1testtesttesttesttesttest`;
        expect(isValidUserAddressFormat(address)).toBe(true);
      });
    });

    it('should return false for invalid prefixes', () => {
      expect(isValidUserAddressFormat('invalid1test')).toBe(false);
      expect(isValidUserAddressFormat('test')).toBe(false);
    });

    it('should return false for too short addresses', () => {
      // Updated threshold to 20 characters
      expect(isValidUserAddressFormat('addr1test')).toBe(false);
      expect(isValidUserAddressFormat('addr1')).toBe(false);
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
    const userAddress =
      'mn_shield-addr_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
    mockParse.mockReturnValue(
      createMockBech32m({
        type: 'addr',
        data: new Uint8Array([1, 2, 3, 4]),
      })
    );

    const result = isValidAddress(userAddress);

    expect(result).toBe(true);
  });

  it('should return true for valid user address (unshielded)', () => {
    const userAddress =
      'mn_shield-naddr_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
    mockParse.mockReturnValue(
      createMockBech32m({
        type: 'naddr',
        data: new Uint8Array([1, 2, 3, 4]),
      })
    );

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
    // MidnightBech32m.parse should not be called for contract addresses
    expect(mockParse).not.toHaveBeenCalled();
  });

  it('should fall back to user address validation', () => {
    const userAddress =
      'mn_shield-addr_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
    mockParse.mockReturnValue(
      createMockBech32m({
        type: 'addr',
        data: new Uint8Array([1, 2, 3, 4]),
      })
    );

    const result = isValidAddress(userAddress);

    expect(result).toBe(true);
    expect(mockParse).toHaveBeenCalled();
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

  it('should have correct MIDNIGHT_ADDRESS_TYPES', () => {
    expect(MIDNIGHT_ADDRESS_TYPES.SHIELDED).toBe('addr');
    expect(MIDNIGHT_ADDRESS_TYPES.UNSHIELDED).toBe('naddr');
    expect(MIDNIGHT_ADDRESS_TYPES.DUST).toBe('dust');
    expect(MIDNIGHT_ADDRESS_TYPES.COIN_PUBLIC_KEY).toBe('cpk');
    expect(MIDNIGHT_ADDRESS_TYPES.ENCRYPTION_PUBLIC_KEY).toBe('epk');
  });
});
