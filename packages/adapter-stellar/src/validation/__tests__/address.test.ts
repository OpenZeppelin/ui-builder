// Import the mocked StrKey for use in tests
import { StrKey } from '@stellar/stellar-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isValidAccountAddress,
  isValidAddress,
  isValidContractAddress,
  isValidMuxedAddress,
  isValidSecretSeed,
  isValidSignedPayloadAddress,
  type StellarAddressType,
} from '../address';

// Mock StrKey from stellar-sdk
vi.mock('@stellar/stellar-sdk', () => ({
  StrKey: {
    isValidEd25519PublicKey: vi.fn(),
    isValidContract: vi.fn(),
    isValidMed25519PublicKey: vi.fn(),
    isValidEd25519SecretSeed: vi.fn(),
    isValidSignedPayload: vi.fn(),
    decodePreAuthTx: vi.fn(),
    decodeSha256Hash: vi.fn(),
  },
}));

const mockStrKey = StrKey as unknown as {
  isValidEd25519PublicKey: ReturnType<typeof vi.fn>;
  isValidContract: ReturnType<typeof vi.fn>;
  isValidMed25519PublicKey: ReturnType<typeof vi.fn>;
  isValidEd25519SecretSeed: ReturnType<typeof vi.fn>;
  isValidSignedPayload: ReturnType<typeof vi.fn>;
  decodePreAuthTx: ReturnType<typeof vi.fn>;
  decodeSha256Hash: ReturnType<typeof vi.fn>;
};

describe('Specific validation functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isValidAccountAddress', () => {
    it('should return true for valid account address (G...)', () => {
      const accountAddress = 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';
      mockStrKey.isValidEd25519PublicKey.mockReturnValue(true);

      const result = isValidAccountAddress(accountAddress);

      expect(result).toBe(true);
      expect(mockStrKey.isValidEd25519PublicKey).toHaveBeenCalledWith(accountAddress);
    });

    it('should return false for invalid account address', () => {
      const invalidAddress = 'INVALID_ACCOUNT';
      mockStrKey.isValidEd25519PublicKey.mockReturnValue(false);

      const result = isValidAccountAddress(invalidAddress);

      expect(result).toBe(false);
    });
  });

  describe('isValidContractAddress', () => {
    it('should return true for valid contract address (C...)', () => {
      const contractAddress = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAUHKENIFEJ';
      mockStrKey.isValidContract.mockReturnValue(true);

      const result = isValidContractAddress(contractAddress);

      expect(result).toBe(true);
      expect(mockStrKey.isValidContract).toHaveBeenCalledWith(contractAddress);
    });
  });

  describe('isValidMuxedAddress', () => {
    it('should return true for valid muxed address (M...)', () => {
      const muxedAddress = 'MDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37AAAAAAAAAAAA';
      mockStrKey.isValidMed25519PublicKey.mockReturnValue(true);

      const result = isValidMuxedAddress(muxedAddress);

      expect(result).toBe(true);
      expect(mockStrKey.isValidMed25519PublicKey).toHaveBeenCalledWith(muxedAddress);
    });
  });

  describe('isValidSecretSeed', () => {
    it('should return true for valid secret seed (S...)', () => {
      const secretSeed = 'SDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';
      mockStrKey.isValidEd25519SecretSeed.mockReturnValue(true);

      const result = isValidSecretSeed(secretSeed);

      expect(result).toBe(true);
      expect(mockStrKey.isValidEd25519SecretSeed).toHaveBeenCalledWith(secretSeed);
    });
  });

  describe('isValidSignedPayloadAddress', () => {
    it('should return true for valid signed payload address (P...)', () => {
      const signedPayload = 'PDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';
      mockStrKey.isValidSignedPayload.mockReturnValue(true);

      const result = isValidSignedPayloadAddress(signedPayload);

      expect(result).toBe(true);
      expect(mockStrKey.isValidSignedPayload).toHaveBeenCalledWith(signedPayload);
    });
  });
});

describe('isValidAddress (main function)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('without specific type (validates common types)', () => {
    it('should return true for valid account address (G...)', () => {
      const accountAddress = 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';
      mockStrKey.isValidEd25519PublicKey.mockReturnValue(true);
      mockStrKey.isValidContract.mockReturnValue(false);
      mockStrKey.isValidMed25519PublicKey.mockReturnValue(false);

      const result = isValidAddress(accountAddress);

      expect(result).toBe(true);
    });

    it('should return true for valid contract address (C...)', () => {
      const contractAddress = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAUHKENIFEJ';
      mockStrKey.isValidEd25519PublicKey.mockReturnValue(false);
      mockStrKey.isValidContract.mockReturnValue(true);
      mockStrKey.isValidMed25519PublicKey.mockReturnValue(false);

      const result = isValidAddress(contractAddress);

      expect(result).toBe(true);
    });

    it('should return true for valid muxed address (M...)', () => {
      const muxedAddress = 'MDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37AAAAAAAAAAAA';
      mockStrKey.isValidEd25519PublicKey.mockReturnValue(false);
      mockStrKey.isValidContract.mockReturnValue(false);
      mockStrKey.isValidMed25519PublicKey.mockReturnValue(true);

      const result = isValidAddress(muxedAddress);

      expect(result).toBe(true);
    });

    it('should return false for secret seeds (security)', () => {
      const secretSeed = 'SDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';
      mockStrKey.isValidEd25519PublicKey.mockReturnValue(false);
      mockStrKey.isValidContract.mockReturnValue(false);
      mockStrKey.isValidMed25519PublicKey.mockReturnValue(false);

      const result = isValidAddress(secretSeed);

      expect(result).toBe(false);
      // Secret validation should NOT be called for security
      expect(mockStrKey.isValidEd25519SecretSeed).not.toHaveBeenCalled();
    });
  });

  describe('with specific address type', () => {
    it('should validate only account type when specified', () => {
      const accountAddress = 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';
      mockStrKey.isValidEd25519PublicKey.mockReturnValue(true);

      const result = isValidAddress(accountAddress, 'account');

      expect(result).toBe(true);
      expect(mockStrKey.isValidEd25519PublicKey).toHaveBeenCalledWith(accountAddress);
      // Other validation methods should not be called
      expect(mockStrKey.isValidContract).not.toHaveBeenCalled();
    });

    it('should validate only contract type when specified', () => {
      const contractAddress = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAUHKENIFEJ';
      mockStrKey.isValidContract.mockReturnValue(true);

      const result = isValidAddress(contractAddress, 'contract');

      expect(result).toBe(true);
      expect(mockStrKey.isValidContract).toHaveBeenCalledWith(contractAddress);
      // Other validation methods should not be called
      expect(mockStrKey.isValidEd25519PublicKey).not.toHaveBeenCalled();
    });

    it('should validate only muxed type when specified', () => {
      const muxedAddress = 'MDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37AAAAAAAAAAAA';
      mockStrKey.isValidMed25519PublicKey.mockReturnValue(true);

      const result = isValidAddress(muxedAddress, 'muxed');

      expect(result).toBe(true);
      expect(mockStrKey.isValidMed25519PublicKey).toHaveBeenCalledWith(muxedAddress);
    });

    it('should validate secret seeds when specifically requested', () => {
      const secretSeed = 'SDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';
      mockStrKey.isValidEd25519SecretSeed.mockReturnValue(true);

      const result = isValidAddress(secretSeed, 'secret');

      expect(result).toBe(true);
      expect(mockStrKey.isValidEd25519SecretSeed).toHaveBeenCalledWith(secretSeed);
    });

    it('should validate pre-auth-tx when specified', () => {
      const preAuthTx = 'TDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';
      mockStrKey.decodePreAuthTx.mockReturnValue(Buffer.from('fake'));

      const result = isValidAddress(preAuthTx, 'pre-auth-tx');

      expect(result).toBe(true);
      expect(mockStrKey.decodePreAuthTx).toHaveBeenCalledWith(preAuthTx);
    });

    it('should validate hash-x when specified', () => {
      const hashX = 'XDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';
      mockStrKey.decodeSha256Hash.mockReturnValue(Buffer.from('fake'));

      const result = isValidAddress(hashX, 'hash-x');

      expect(result).toBe(true);
      expect(mockStrKey.decodeSha256Hash).toHaveBeenCalledWith(hashX);
    });

    it('should return false for unknown address type', () => {
      const address = 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';

      const result = isValidAddress(address, 'unknown' as StellarAddressType);

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return false for empty string', () => {
      const result = isValidAddress('');
      expect(result).toBe(false);
    });

    it('should return false for null/undefined input', () => {
      // @ts-expect-error Testing invalid input
      const resultNull = isValidAddress(null);
      // @ts-expect-error Testing invalid input
      const resultUndefined = isValidAddress(undefined);

      expect(resultNull).toBe(false);
      expect(resultUndefined).toBe(false);
    });

    it('should handle exceptions gracefully', () => {
      const address = 'MALFORMED_ADDRESS';
      mockStrKey.isValidEd25519PublicKey.mockImplementation(() => {
        throw new Error('Invalid format');
      });

      const result = isValidAddress(address);

      expect(result).toBe(false);
    });
  });
});
