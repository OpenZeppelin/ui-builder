/**
 * Address Validation Tests for Access Control
 *
 * Tests validation helper functions for contract and account addresses
 */

import { describe, expect, it } from 'vitest';

import { ConfigurationInvalid } from '@openzeppelin/ui-builder-types';

import {
  normalizeStellarAddress,
  validateAccountAddress,
  validateAddresses,
  validateContractAddress,
} from '../../src/access-control/validation';

describe('validateContractAddress', () => {
  it('should accept valid contract addresses', () => {
    const validContractAddress = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
    expect(() => validateContractAddress(validContractAddress)).not.toThrow();
  });

  it('should reject empty string', () => {
    expect(() => validateContractAddress('')).toThrow(ConfigurationInvalid);
    expect(() => validateContractAddress('')).toThrow(
      'contractAddress is required and must be a non-empty string'
    );
  });

  it('should reject null/undefined', () => {
    expect(() => validateContractAddress(null as unknown as string)).toThrow(ConfigurationInvalid);
    expect(() => validateContractAddress(undefined as unknown as string)).toThrow(
      ConfigurationInvalid
    );
  });

  it('should reject whitespace-only string', () => {
    expect(() => validateContractAddress('   ')).toThrow(ConfigurationInvalid);
    expect(() => validateContractAddress('   ')).toThrow('must be a non-empty string');
  });

  it('should reject invalid Stellar contract address (account address)', () => {
    const accountAddress = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';
    expect(() => validateContractAddress(accountAddress)).toThrow(ConfigurationInvalid);
    expect(() => validateContractAddress(accountAddress)).toThrow(
      "Contract addresses must start with 'C'"
    );
  });

  it('should reject malformed address', () => {
    expect(() => validateContractAddress('invalid-address')).toThrow(ConfigurationInvalid);
  });

  it('should use custom parameter name in error message', () => {
    expect(() => validateContractAddress('', 'targetContract')).toThrow('targetContract');
  });
});

describe('validateAccountAddress', () => {
  it('should accept valid account addresses', () => {
    const validAccountAddress = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';
    expect(() => validateAccountAddress(validAccountAddress)).not.toThrow();
  });

  it('should reject empty string', () => {
    expect(() => validateAccountAddress('')).toThrow(ConfigurationInvalid);
    expect(() => validateAccountAddress('')).toThrow(
      'account is required and must be a non-empty string'
    );
  });

  it('should reject null/undefined', () => {
    expect(() => validateAccountAddress(null as unknown as string)).toThrow(ConfigurationInvalid);
    expect(() => validateAccountAddress(undefined as unknown as string)).toThrow(
      ConfigurationInvalid
    );
  });

  it('should reject whitespace-only string', () => {
    expect(() => validateAccountAddress('   ')).toThrow(ConfigurationInvalid);
    expect(() => validateAccountAddress('   ')).toThrow('must be a non-empty string');
  });

  it('should reject invalid Stellar account address (contract address)', () => {
    const contractAddress = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
    expect(() => validateAccountAddress(contractAddress)).toThrow(ConfigurationInvalid);
    expect(() => validateAccountAddress(contractAddress)).toThrow(
      "Account addresses must start with 'G'"
    );
  });

  it('should reject malformed address', () => {
    expect(() => validateAccountAddress('invalid-address')).toThrow(ConfigurationInvalid);
  });

  it('should use custom parameter name in error message', () => {
    expect(() => validateAccountAddress('', 'newOwner')).toThrow('newOwner');
  });
});

describe('validateAddresses', () => {
  const validContractAddress = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  const validAccountAddress = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';

  it('should accept valid contract and account addresses', () => {
    expect(() => validateAddresses(validContractAddress, validAccountAddress)).not.toThrow();
  });

  it('should reject invalid contract address', () => {
    expect(() => validateAddresses('invalid', validAccountAddress)).toThrow(ConfigurationInvalid);
  });

  it('should reject invalid account address', () => {
    expect(() => validateAddresses(validContractAddress, 'invalid')).toThrow(ConfigurationInvalid);
  });

  it('should reject both invalid addresses', () => {
    expect(() => validateAddresses('invalid-contract', 'invalid-account')).toThrow(
      ConfigurationInvalid
    );
  });

  it('should reject empty contract address', () => {
    expect(() => validateAddresses('', validAccountAddress)).toThrow(ConfigurationInvalid);
  });

  it('should reject empty account address', () => {
    expect(() => validateAddresses(validContractAddress, '')).toThrow(ConfigurationInvalid);
  });
});

describe('normalizeStellarAddress', () => {
  it('should normalize contract addresses using shared utils', () => {
    const address = '  CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM  ';
    const normalized = normalizeStellarAddress(address);
    expect(normalized).toBe('caaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad2km');
  });

  it('should normalize account addresses using shared utils', () => {
    const address = '  GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI  ';
    const normalized = normalizeStellarAddress(address);
    expect(normalized).toBe('gbzxn7pirzgnmhga7muuuf4gwpy5aypv6ly4uv2gl6vjgiqrxfdnmadi');
  });

  it('should return empty string for null/undefined', () => {
    expect(normalizeStellarAddress(null as unknown as string)).toBe('');
    expect(normalizeStellarAddress(undefined as unknown as string)).toBe('');
  });

  it('should handle empty string', () => {
    expect(normalizeStellarAddress('')).toBe('');
  });

  it('should handle whitespace-only string', () => {
    expect(normalizeStellarAddress('   ')).toBe('');
  });
});
