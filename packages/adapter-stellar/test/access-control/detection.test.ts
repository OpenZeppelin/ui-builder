/**
 * Unit tests for access control capability detection
 *
 * Tests:
 * - T015: Capability detection for Ownable and AccessControl contracts
 * - T017: Rejection of non-OZ access-control contracts with UnsupportedContractFeatures
 */
import { describe, expect, it } from 'vitest';

import type { ContractSchema } from '@openzeppelin/ui-builder-types';

import {
  detectAccessControlCapabilities,
  validateAccessControlSupport,
} from '../../src/access-control/feature-detection';

/**
 * Helper function to create a minimal contract schema for testing
 */
function createContractSchema(functionNames: string[]): ContractSchema {
  return {
    ecosystem: 'stellar',
    address: 'CTEST123',
    functions: functionNames.map((name) => ({
      id: name,
      name,
      displayName: name,
      type: 'function',
      inputs: [],
      outputs: [],
      modifiesState: false,
      stateMutability: 'view',
    })),
  };
}

describe('Access Control Feature Detection (T015)', () => {
  describe('detectAccessControlCapabilities', () => {
    it('should detect Ownable-only contract', () => {
      const schema = createContractSchema([
        'get_owner',
        'transfer_ownership',
        'accept_ownership',
        'renounce_ownership',
      ]);

      const capabilities = detectAccessControlCapabilities(schema);

      expect(capabilities.hasOwnable).toBe(true);
      expect(capabilities.hasAccessControl).toBe(false);
      expect(capabilities.hasEnumerableRoles).toBe(false);
      expect(capabilities.supportsHistory).toBe(false);
      expect(capabilities.verifiedAgainstOZInterfaces).toBe(true);
      expect(capabilities.notes).toContain('OpenZeppelin Ownable interface detected');
    });

    it('should detect AccessControl-only contract', () => {
      const schema = createContractSchema([
        'has_role',
        'grant_role',
        'revoke_role',
        'get_role_admin',
        'set_role_admin',
        'get_admin',
        'transfer_admin_role',
      ]);

      const capabilities = detectAccessControlCapabilities(schema);

      expect(capabilities.hasOwnable).toBe(false);
      expect(capabilities.hasAccessControl).toBe(true);
      expect(capabilities.hasEnumerableRoles).toBe(false);
      expect(capabilities.supportsHistory).toBe(false);
      expect(capabilities.verifiedAgainstOZInterfaces).toBe(true);
      expect(capabilities.notes).toContain('OpenZeppelin AccessControl interface detected');
    });

    it('should detect contract with both Ownable and AccessControl', () => {
      const schema = createContractSchema([
        'get_owner',
        'transfer_ownership',
        'accept_ownership',
        'renounce_ownership',
        'has_role',
        'grant_role',
        'revoke_role',
        'get_role_admin',
        'set_role_admin',
        'get_admin',
        'transfer_admin_role',
      ]);

      const capabilities = detectAccessControlCapabilities(schema);

      expect(capabilities.hasOwnable).toBe(true);
      expect(capabilities.hasAccessControl).toBe(true);
      expect(capabilities.hasEnumerableRoles).toBe(false);
      expect(capabilities.verifiedAgainstOZInterfaces).toBe(true);
      expect(capabilities.notes).toContain('OpenZeppelin Ownable interface detected');
      expect(capabilities.notes).toContain('OpenZeppelin AccessControl interface detected');
    });

    it('should detect enumerable roles support', () => {
      const schema = createContractSchema([
        'has_role',
        'grant_role',
        'revoke_role',
        'get_role_admin',
        'set_role_admin',
        'get_admin',
        'transfer_admin_role',
        'get_role_member_count',
        'get_role_member',
      ]);

      const capabilities = detectAccessControlCapabilities(schema);

      expect(capabilities.hasAccessControl).toBe(true);
      expect(capabilities.hasEnumerableRoles).toBe(true);
      expect(capabilities.notes).toContain(
        'Role enumeration supported (get_role_member_count, get_role_member)'
      );
    });

    it('should indicate role enumeration unavailable when missing', () => {
      const schema = createContractSchema([
        'has_role',
        'grant_role',
        'revoke_role',
        'get_role_admin',
        'set_role_admin',
        'get_admin',
        'transfer_admin_role',
      ]);

      const capabilities = detectAccessControlCapabilities(schema);

      expect(capabilities.hasAccessControl).toBe(true);
      expect(capabilities.hasEnumerableRoles).toBe(false);
      expect(capabilities.notes).toContain(
        'Role enumeration not available - requires event reconstruction'
      );
    });

    it('should set supportsHistory when indexer is available', () => {
      const schema = createContractSchema([
        'get_owner',
        'transfer_ownership',
        'accept_ownership',
        'renounce_ownership',
      ]);

      const capabilities = detectAccessControlCapabilities(schema, true);

      expect(capabilities.supportsHistory).toBe(true);
      expect(capabilities.notes).not.toContain(
        'History queries unavailable without indexer configuration'
      );
    });

    it('should indicate history unavailable when no indexer', () => {
      const schema = createContractSchema([
        'get_owner',
        'transfer_ownership',
        'accept_ownership',
        'renounce_ownership',
      ]);

      const capabilities = detectAccessControlCapabilities(schema, false);

      expect(capabilities.supportsHistory).toBe(false);
      expect(capabilities.notes).toContain(
        'History queries unavailable without indexer configuration'
      );
    });

    it('should detect no access control interfaces', () => {
      const schema = createContractSchema(['some_function', 'another_function']);

      const capabilities = detectAccessControlCapabilities(schema);

      expect(capabilities.hasOwnable).toBe(false);
      expect(capabilities.hasAccessControl).toBe(false);
      expect(capabilities.hasEnumerableRoles).toBe(false);
      expect(capabilities.verifiedAgainstOZInterfaces).toBe(false);
      expect(capabilities.notes).toContain('No OpenZeppelin access control interfaces detected');
    });

    it('should fail verification if Ownable missing required optional functions', () => {
      // Only has get_owner + 1 optional (needs at least 2)
      const schema = createContractSchema(['get_owner', 'transfer_ownership']);

      const capabilities = detectAccessControlCapabilities(schema);

      expect(capabilities.hasOwnable).toBe(true);
      expect(capabilities.verifiedAgainstOZInterfaces).toBe(false);
    });

    it('should fail verification if AccessControl missing required optional functions', () => {
      // Has required but only 3 optional (needs at least 4)
      const schema = createContractSchema([
        'has_role',
        'grant_role',
        'revoke_role',
        'get_role_admin',
        'set_role_admin',
        'get_admin',
      ]);

      const capabilities = detectAccessControlCapabilities(schema);

      expect(capabilities.hasAccessControl).toBe(true);
      expect(capabilities.verifiedAgainstOZInterfaces).toBe(false);
    });

    it('should pass verification with minimum required optional functions for Ownable', () => {
      // Has exactly 2 optional functions
      const schema = createContractSchema(['get_owner', 'transfer_ownership', 'accept_ownership']);

      const capabilities = detectAccessControlCapabilities(schema);

      expect(capabilities.hasOwnable).toBe(true);
      expect(capabilities.verifiedAgainstOZInterfaces).toBe(true);
    });

    it('should pass verification with minimum required optional functions for AccessControl', () => {
      // Has exactly 4 optional functions
      const schema = createContractSchema([
        'has_role',
        'grant_role',
        'revoke_role',
        'get_role_admin',
        'set_role_admin',
        'get_admin',
        'transfer_admin_role',
      ]);

      const capabilities = detectAccessControlCapabilities(schema);

      expect(capabilities.hasAccessControl).toBe(true);
      expect(capabilities.verifiedAgainstOZInterfaces).toBe(true);
    });
  });

  describe('validateAccessControlSupport (T017)', () => {
    it('should throw UnsupportedContractFeatures when no access control interfaces detected', () => {
      const schema = createContractSchema(['some_function', 'another_function']);
      const capabilities = detectAccessControlCapabilities(schema);

      expect(() => {
        validateAccessControlSupport(capabilities);
      }).toThrow(
        'UnsupportedContractFeatures: Contract does not implement OpenZeppelin Ownable or AccessControl interfaces'
      );
    });

    it('should throw UnsupportedContractFeatures when interfaces do not conform to OZ standards', () => {
      // Has Ownable required but insufficient optional functions
      const schema = createContractSchema(['get_owner']);
      const capabilities = detectAccessControlCapabilities(schema);

      expect(() => {
        validateAccessControlSupport(capabilities);
      }).toThrow(
        'UnsupportedContractFeatures: Contract interfaces do not conform to OpenZeppelin standards'
      );
    });

    it('should throw UnsupportedContractFeatures for AccessControl with insufficient optional functions', () => {
      // Has AccessControl required but only 2 optional functions
      const schema = createContractSchema([
        'has_role',
        'grant_role',
        'revoke_role',
        'get_role_admin',
        'get_admin',
      ]);
      const capabilities = detectAccessControlCapabilities(schema);

      expect(() => {
        validateAccessControlSupport(capabilities);
      }).toThrow(
        'UnsupportedContractFeatures: Contract interfaces do not conform to OpenZeppelin standards'
      );
    });

    it('should pass validation for compliant Ownable contract', () => {
      const schema = createContractSchema([
        'get_owner',
        'transfer_ownership',
        'accept_ownership',
        'renounce_ownership',
      ]);
      const capabilities = detectAccessControlCapabilities(schema);

      expect(() => {
        validateAccessControlSupport(capabilities);
      }).not.toThrow();
    });

    it('should pass validation for compliant AccessControl contract', () => {
      const schema = createContractSchema([
        'has_role',
        'grant_role',
        'revoke_role',
        'get_role_admin',
        'set_role_admin',
        'get_admin',
        'transfer_admin_role',
      ]);
      const capabilities = detectAccessControlCapabilities(schema);

      expect(() => {
        validateAccessControlSupport(capabilities);
      }).not.toThrow();
    });

    it('should pass validation for contract with both Ownable and AccessControl', () => {
      const schema = createContractSchema([
        'get_owner',
        'transfer_ownership',
        'accept_ownership',
        'renounce_ownership',
        'has_role',
        'grant_role',
        'revoke_role',
        'get_role_admin',
        'set_role_admin',
        'get_admin',
        'transfer_admin_role',
      ]);
      const capabilities = detectAccessControlCapabilities(schema);

      expect(() => {
        validateAccessControlSupport(capabilities);
      }).not.toThrow();
    });

    it('should reject custom contract with partial Ownable implementation', () => {
      const schema = createContractSchema([
        'get_owner',
        'transfer_ownership',
        'custom_function',
        'another_custom',
      ]);
      const capabilities = detectAccessControlCapabilities(schema);

      expect(() => {
        validateAccessControlSupport(capabilities);
      }).toThrow('UnsupportedContractFeatures');
    });

    it('should reject custom contract with partial AccessControl implementation', () => {
      const schema = createContractSchema([
        'has_role',
        'grant_role',
        'revoke_role',
        'custom_function',
        'another_custom',
      ]);
      const capabilities = detectAccessControlCapabilities(schema);

      expect(() => {
        validateAccessControlSupport(capabilities);
      }).toThrow('UnsupportedContractFeatures');
    });
  });
});
