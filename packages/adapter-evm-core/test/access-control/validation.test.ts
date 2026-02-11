/**
 * Validation Tests for EVM Access Control
 *
 * Tests the input validation functions used across the access control module.
 * Covers: EVM address validation (checksummed, non-checksummed, wrong length, missing 0x),
 * bytes32 role ID validation, DEFAULT_ADMIN_ROLE, array validation, and error messages.
 *
 * @see research.md §R8 — EVM Address and Role Validation
 */

import { describe, expect, it } from 'vitest';

import { ConfigurationInvalid } from '@openzeppelin/ui-types';

import { DEFAULT_ADMIN_ROLE } from '../../src/access-control/constants';
import {
  validateAddress,
  validateRoleId,
  validateRoleIds,
} from '../../src/access-control/validation';

// ---------------------------------------------------------------------------
// Test Constants
// ---------------------------------------------------------------------------

/** Valid EVM address (checksummed — EIP-55) */
const VALID_CHECKSUMMED_ADDRESS = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';

/** Valid EVM address (all lowercase — non-checksummed) */
const VALID_LOWERCASE_ADDRESS = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';

/** Valid EVM address (all uppercase — non-checksummed) */
const VALID_UPPERCASE_ADDRESS = '0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED';

/** Another valid address for testing */
const VALID_ADDRESS_2 = '0x1234567890123456789012345678901234567890';

/** Zero address (indicates renounced ownership/admin) */
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** Valid bytes32 role ID (keccak256 hash) */
const VALID_ROLE_ID = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';

/** Another valid bytes32 role ID */
const VALID_ROLE_ID_2 = '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a';

/** DEFAULT_ADMIN_ROLE (bytes32 zero) */
const ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

// ---------------------------------------------------------------------------
// validateAddress
// ---------------------------------------------------------------------------

describe('validateAddress', () => {
  it('should accept a valid checksummed EVM address', () => {
    expect(() => validateAddress(VALID_CHECKSUMMED_ADDRESS)).not.toThrow();
  });

  it('should accept a valid lowercase (non-checksummed) EVM address', () => {
    expect(() => validateAddress(VALID_LOWERCASE_ADDRESS)).not.toThrow();
  });

  it('should reject an all-uppercase address (fails EIP-55 checksum)', () => {
    // viem's isAddress() rejects all-uppercase because EIP-55 checksummed
    // addresses have mixed case. All-uppercase is not valid.
    expect(() => validateAddress(VALID_UPPERCASE_ADDRESS)).toThrow(ConfigurationInvalid);
  });

  it('should accept the zero address', () => {
    expect(() => validateAddress(ZERO_ADDRESS)).not.toThrow();
  });

  it('should accept another valid address', () => {
    expect(() => validateAddress(VALID_ADDRESS_2)).not.toThrow();
  });

  it('should reject an empty string', () => {
    expect(() => validateAddress('')).toThrow(ConfigurationInvalid);
    expect(() => validateAddress('')).toThrow('is required and must be a non-empty string');
  });

  it('should reject null/undefined', () => {
    expect(() => validateAddress(null as unknown as string)).toThrow(ConfigurationInvalid);
    expect(() => validateAddress(undefined as unknown as string)).toThrow(ConfigurationInvalid);
  });

  it('should reject whitespace-only string', () => {
    expect(() => validateAddress('   ')).toThrow(ConfigurationInvalid);
    expect(() => validateAddress('   ')).toThrow('must be a non-empty string');
  });

  it('should reject address with wrong length (too short)', () => {
    expect(() => validateAddress('0x1234')).toThrow(ConfigurationInvalid);
    expect(() => validateAddress('0x1234')).toThrow('Invalid EVM address');
  });

  it('should reject address with wrong length (too long)', () => {
    const tooLong = '0x' + '1'.repeat(41);
    expect(() => validateAddress(tooLong)).toThrow(ConfigurationInvalid);
    expect(() => validateAddress(tooLong)).toThrow('Invalid EVM address');
  });

  it('should reject address missing 0x prefix', () => {
    const noPrefix = '5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
    expect(() => validateAddress(noPrefix)).toThrow(ConfigurationInvalid);
    expect(() => validateAddress(noPrefix)).toThrow('Invalid EVM address');
  });

  it('should reject address with invalid hex characters', () => {
    const invalidHex = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BGGGG';
    expect(() => validateAddress(invalidHex)).toThrow(ConfigurationInvalid);
  });

  it('should reject a non-address string', () => {
    expect(() => validateAddress('not-an-address')).toThrow(ConfigurationInvalid);
  });

  it('should use custom parameter name in error message', () => {
    expect(() => validateAddress('', 'contractAddress')).toThrow('contractAddress');
    expect(() => validateAddress('', 'newOwner')).toThrow('newOwner');
    expect(() => validateAddress('', 'account')).toThrow('account');
  });

  it('should default paramName to "address"', () => {
    expect(() => validateAddress('')).toThrow('address is required');
  });
});

// ---------------------------------------------------------------------------
// validateRoleId
// ---------------------------------------------------------------------------

describe('validateRoleId', () => {
  it('should accept a valid bytes32 role ID and return it', () => {
    expect(validateRoleId(VALID_ROLE_ID)).toBe(VALID_ROLE_ID);
  });

  it('should accept another valid bytes32 role ID and return it', () => {
    expect(validateRoleId(VALID_ROLE_ID_2)).toBe(VALID_ROLE_ID_2);
  });

  it('should accept DEFAULT_ADMIN_ROLE (bytes32 zero)', () => {
    expect(validateRoleId(DEFAULT_ADMIN_ROLE)).toBe(DEFAULT_ADMIN_ROLE);
    expect(validateRoleId(ADMIN_ROLE)).toBe(ADMIN_ROLE);
  });

  it('should accept role IDs with uppercase hex', () => {
    const upperHex = '0x9F2DF0FED2C77648DE5860A4CC508CD0818C85B8B8A1AB4CEEEF8D981C8956A6';
    expect(validateRoleId(upperHex)).toBe(upperHex);
  });

  it('should accept role IDs with mixed-case hex', () => {
    const mixedHex = '0x9f2Df0Fed2c77648dE5860a4Cc508Cd0818c85b8B8A1aB4CeEeF8d981C8956A6';
    expect(validateRoleId(mixedHex)).toBe(mixedHex);
  });

  it('should trim whitespace and return the trimmed value', () => {
    const padded = `  ${VALID_ROLE_ID}  `;
    expect(validateRoleId(padded)).toBe(VALID_ROLE_ID);
  });

  it('should reject an empty string', () => {
    expect(() => validateRoleId('')).toThrow(ConfigurationInvalid);
    expect(() => validateRoleId('')).toThrow('roleId is required and must be a non-empty string');
  });

  it('should reject null/undefined', () => {
    expect(() => validateRoleId(null as unknown as string)).toThrow(ConfigurationInvalid);
    expect(() => validateRoleId(undefined as unknown as string)).toThrow(ConfigurationInvalid);
  });

  it('should reject whitespace-only string', () => {
    expect(() => validateRoleId('   ')).toThrow(ConfigurationInvalid);
    expect(() => validateRoleId('   ')).toThrow('must be a non-empty string');
  });

  it('should reject role ID missing 0x prefix', () => {
    const noPrefix = '9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
    expect(() => validateRoleId(noPrefix)).toThrow(ConfigurationInvalid);
    expect(() => validateRoleId(noPrefix)).toThrow('Invalid bytes32 role ID');
  });

  it('should reject role ID with wrong length (too short)', () => {
    expect(() => validateRoleId('0x1234')).toThrow(ConfigurationInvalid);
    expect(() => validateRoleId('0x1234')).toThrow('Invalid bytes32 role ID');
  });

  it('should reject role ID with wrong length (too long — 65 hex chars)', () => {
    const tooLong = '0x' + 'a'.repeat(65);
    expect(() => validateRoleId(tooLong)).toThrow(ConfigurationInvalid);
    expect(() => validateRoleId(tooLong)).toThrow('Invalid bytes32 role ID');
  });

  it('should reject role ID with invalid hex characters', () => {
    const invalidHex = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c89GGGG';
    expect(() => validateRoleId(invalidHex)).toThrow(ConfigurationInvalid);
    expect(() => validateRoleId(invalidHex)).toThrow('Invalid bytes32 role ID');
  });

  it('should reject role ID that is just "0x"', () => {
    expect(() => validateRoleId('0x')).toThrow(ConfigurationInvalid);
  });

  it('should reject a plain string (not bytes32)', () => {
    expect(() => validateRoleId('MINTER_ROLE')).toThrow(ConfigurationInvalid);
    expect(() => validateRoleId('admin')).toThrow(ConfigurationInvalid);
  });

  it('should use custom parameter name in error message', () => {
    expect(() => validateRoleId('', 'customRole')).toThrow('customRole');
  });
});

// ---------------------------------------------------------------------------
// validateRoleIds (array validation)
// ---------------------------------------------------------------------------

describe('validateRoleIds', () => {
  it('should accept a valid array of bytes32 role IDs', () => {
    expect(validateRoleIds([VALID_ROLE_ID, VALID_ROLE_ID_2])).toEqual([
      VALID_ROLE_ID,
      VALID_ROLE_ID_2,
    ]);
  });

  it('should accept an array containing DEFAULT_ADMIN_ROLE', () => {
    expect(validateRoleIds([DEFAULT_ADMIN_ROLE, VALID_ROLE_ID])).toEqual([
      DEFAULT_ADMIN_ROLE,
      VALID_ROLE_ID,
    ]);
  });

  it('should accept an empty array', () => {
    expect(validateRoleIds([])).toEqual([]);
  });

  it('should accept a single-element array', () => {
    expect(validateRoleIds([VALID_ROLE_ID])).toEqual([VALID_ROLE_ID]);
  });

  it('should deduplicate role IDs', () => {
    expect(validateRoleIds([VALID_ROLE_ID, VALID_ROLE_ID, VALID_ROLE_ID_2, VALID_ROLE_ID])).toEqual(
      [VALID_ROLE_ID, VALID_ROLE_ID_2]
    );
  });

  it('should reject non-array input', () => {
    expect(() => validateRoleIds('not-an-array' as unknown as string[])).toThrow(
      ConfigurationInvalid
    );
    expect(() => validateRoleIds('not-an-array' as unknown as string[])).toThrow(
      'must be an array'
    );
  });

  it('should reject null input', () => {
    expect(() => validateRoleIds(null as unknown as string[])).toThrow(ConfigurationInvalid);
  });

  it('should reject array with invalid role IDs', () => {
    expect(() => validateRoleIds([VALID_ROLE_ID, 'invalid'])).toThrow(ConfigurationInvalid);
  });

  it('should reject array with empty string', () => {
    expect(() => validateRoleIds([VALID_ROLE_ID, ''])).toThrow(ConfigurationInvalid);
  });

  it('should report index in error message for invalid role ID', () => {
    expect(() => validateRoleIds([VALID_ROLE_ID, VALID_ROLE_ID_2, 'invalid'])).toThrow(
      'roleIds[2]:'
    );
  });

  it('should use custom parameter name in error message', () => {
    expect(() => validateRoleIds(null as unknown as string[], 'customRoles')).toThrow(
      'customRoles'
    );
  });
});
