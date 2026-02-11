/**
 * Constants Tests for EVM Access Control
 *
 * Tests the well-known role dictionary and resolveRoleLabel helper.
 */

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ADMIN_ROLE,
  DEFAULT_ADMIN_ROLE_LABEL,
  resolveRoleLabel,
  WELL_KNOWN_ROLES,
} from '../../src/access-control/constants';

describe('WELL_KNOWN_ROLES', () => {
  it('should include DEFAULT_ADMIN_ROLE', () => {
    expect(WELL_KNOWN_ROLES[DEFAULT_ADMIN_ROLE]).toBe(DEFAULT_ADMIN_ROLE_LABEL);
  });

  it('should include MINTER_ROLE hash', () => {
    const minterHash = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
    expect(WELL_KNOWN_ROLES[minterHash]).toBe('MINTER_ROLE');
  });

  it('should include PAUSER_ROLE, BURNER_ROLE, UPGRADER_ROLE', () => {
    expect(
      WELL_KNOWN_ROLES['0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a']
    ).toBe('PAUSER_ROLE');
    expect(
      WELL_KNOWN_ROLES['0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848']
    ).toBe('BURNER_ROLE');
    expect(
      WELL_KNOWN_ROLES['0x189ab7a9244df0848122154315af71fe140f3db0fe014031783b0946b8c9d2e3']
    ).toBe('UPGRADER_ROLE');
  });
});

describe('resolveRoleLabel', () => {
  it('should return label from well-known dictionary when roleLabelMap is undefined', () => {
    expect(resolveRoleLabel(DEFAULT_ADMIN_ROLE)).toBe(DEFAULT_ADMIN_ROLE_LABEL);
    expect(
      resolveRoleLabel('0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6')
    ).toBe('MINTER_ROLE');
  });

  it('should return undefined for unknown role when roleLabelMap is undefined', () => {
    expect(
      resolveRoleLabel('0x0000000000000000000000000000000000000000000000000000000000000001')
    ).toBe(undefined);
  });

  it('should prefer roleLabelMap over well-known dictionary', () => {
    const map = new Map<string, string>();
    map.set(DEFAULT_ADMIN_ROLE, 'Custom Admin Label');
    expect(resolveRoleLabel(DEFAULT_ADMIN_ROLE, map)).toBe('Custom Admin Label');
  });

  it('should fall back to well-known dictionary when roleLabelMap has no entry', () => {
    const map = new Map<string, string>();
    map.set('0xunknown', 'Other');
    expect(resolveRoleLabel(DEFAULT_ADMIN_ROLE, map)).toBe(DEFAULT_ADMIN_ROLE_LABEL);
  });

  it('should return external label for unknown hash when provided in map', () => {
    const map = new Map<string, string>();
    const customHash = '0x1234567890123456789012345678901234567890123456789012345678901234';
    map.set(customHash, 'MY_CUSTOM_ROLE');
    expect(resolveRoleLabel(customHash, map)).toBe('MY_CUSTOM_ROLE');
    expect(resolveRoleLabel(customHash)).toBe(undefined);
  });
});
