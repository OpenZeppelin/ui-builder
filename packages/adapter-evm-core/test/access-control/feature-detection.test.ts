/**
 * Feature Detection Tests for EVM Access Control
 *
 * Tests the ABI-based capability detection logic for OpenZeppelin access control patterns.
 * Covers: Ownable-only ABI, Ownable2Step ABI, AccessControl ABI, AccessControlEnumerable ABI,
 * AccessControlDefaultAdminRules ABI, combined patterns, empty ABI, ABI with similar-but-wrong
 * function signatures.
 *
 * @see contracts/feature-detection.ts — Detection matrix
 * @see research.md §R4 — Feature Detection via ABI Analysis
 */

import { describe, expect, it } from 'vitest';

import type { ContractFunction, ContractSchema } from '@openzeppelin/ui-types';

import {
  detectAccessControlCapabilities,
  validateAccessControlSupport,
} from '../../src/access-control/feature-detection';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a ContractFunction with the given name and input types.
 * Parameter types must match exactly for feature detection to succeed.
 */
function createFunction(name: string, inputTypes: string[] = []): ContractFunction {
  return {
    id: name,
    name,
    displayName: name,
    type: 'function',
    inputs: inputTypes.map((type, i) => ({ name: `param${i}`, type })),
    outputs: [],
    modifiesState: false,
    stateMutability: 'view',
  };
}

/**
 * Creates a minimal ContractSchema with the given functions.
 */
function createSchema(functions: ContractFunction[]): ContractSchema {
  return {
    ecosystem: 'evm',
    functions,
  };
}

// ---------------------------------------------------------------------------
// Pre-built function sets matching OpenZeppelin contract signatures
// ---------------------------------------------------------------------------

const OWNABLE_FUNCTIONS: ContractFunction[] = [
  createFunction('owner', []),
  createFunction('transferOwnership', ['address']),
];

const OWNABLE_TWO_STEP_FUNCTIONS: ContractFunction[] = [
  ...OWNABLE_FUNCTIONS,
  createFunction('pendingOwner', []),
  createFunction('acceptOwnership', []),
];

const ACCESS_CONTROL_FUNCTIONS: ContractFunction[] = [
  createFunction('hasRole', ['bytes32', 'address']),
  createFunction('grantRole', ['bytes32', 'address']),
  createFunction('revokeRole', ['bytes32', 'address']),
  createFunction('getRoleAdmin', ['bytes32']),
];

const ENUMERABLE_FUNCTIONS: ContractFunction[] = [
  createFunction('getRoleMemberCount', ['bytes32']),
  createFunction('getRoleMember', ['bytes32', 'uint256']),
];

const DEFAULT_ADMIN_RULES_FUNCTIONS: ContractFunction[] = [
  createFunction('defaultAdmin', []),
  createFunction('pendingDefaultAdmin', []),
  createFunction('defaultAdminDelay', []),
  createFunction('beginDefaultAdminTransfer', ['address']),
  createFunction('acceptDefaultAdminTransfer', []),
  createFunction('cancelDefaultAdminTransfer', []),
];

const ADMIN_DELAY_CHANGE_FUNCTIONS: ContractFunction[] = [
  createFunction('changeDefaultAdminDelay', ['uint48']),
  createFunction('rollbackDefaultAdminDelay', []),
];

// ---------------------------------------------------------------------------
// detectAccessControlCapabilities
// ---------------------------------------------------------------------------

describe('detectAccessControlCapabilities', () => {
  // ── Ownable Detection ─────────────────────────────────────────────────

  describe('Ownable detection', () => {
    it('should detect Ownable-only contract', () => {
      const schema = createSchema(OWNABLE_FUNCTIONS);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasOwnable).toBe(true);
      expect(caps.hasTwoStepOwnable).toBe(false);
      expect(caps.hasAccessControl).toBe(false);
      expect(caps.hasTwoStepAdmin).toBe(false);
      expect(caps.hasEnumerableRoles).toBe(false);
      expect(caps.supportsHistory).toBe(false);
    });

    it('should detect Ownable2Step contract', () => {
      const schema = createSchema(OWNABLE_TWO_STEP_FUNCTIONS);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasOwnable).toBe(true);
      expect(caps.hasTwoStepOwnable).toBe(true);
      expect(caps.hasAccessControl).toBe(false);
    });

    it('should not detect Ownable if owner() is missing', () => {
      const schema = createSchema([createFunction('transferOwnership', ['address'])]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasOwnable).toBe(false);
    });

    it('should not detect Ownable if transferOwnership has wrong parameter type', () => {
      const schema = createSchema([
        createFunction('owner', []),
        createFunction('transferOwnership', ['uint256']), // wrong type
      ]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasOwnable).toBe(false);
    });
  });

  // ── AccessControl Detection ───────────────────────────────────────────

  describe('AccessControl detection', () => {
    it('should detect AccessControl contract', () => {
      const schema = createSchema(ACCESS_CONTROL_FUNCTIONS);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasAccessControl).toBe(true);
      expect(caps.hasTwoStepAdmin).toBe(false);
      expect(caps.hasEnumerableRoles).toBe(false);
      expect(caps.hasOwnable).toBe(false);
    });

    it('should not detect AccessControl if hasRole has wrong parameter types', () => {
      const schema = createSchema([
        createFunction('hasRole', ['uint256', 'address']), // bytes32 → uint256
        createFunction('grantRole', ['bytes32', 'address']),
        createFunction('revokeRole', ['bytes32', 'address']),
        createFunction('getRoleAdmin', ['bytes32']),
      ]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasAccessControl).toBe(false);
    });

    it('should not detect AccessControl if missing getRoleAdmin', () => {
      const schema = createSchema([
        createFunction('hasRole', ['bytes32', 'address']),
        createFunction('grantRole', ['bytes32', 'address']),
        createFunction('revokeRole', ['bytes32', 'address']),
      ]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasAccessControl).toBe(false);
    });
  });

  // ── AccessControlEnumerable Detection ─────────────────────────────────

  describe('AccessControlEnumerable detection', () => {
    it('should detect AccessControlEnumerable', () => {
      const schema = createSchema([...ACCESS_CONTROL_FUNCTIONS, ...ENUMERABLE_FUNCTIONS]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasAccessControl).toBe(true);
      expect(caps.hasEnumerableRoles).toBe(true);
    });

    it('should not detect enumerable without AccessControl base', () => {
      // Enumerable functions alone should not set hasEnumerableRoles
      // because it depends on hasAccessControl
      const schema = createSchema(ENUMERABLE_FUNCTIONS);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasEnumerableRoles).toBe(false);
    });

    it('should not detect enumerable if getRoleMember has wrong parameter types', () => {
      const schema = createSchema([
        ...ACCESS_CONTROL_FUNCTIONS,
        createFunction('getRoleMemberCount', ['bytes32']),
        createFunction('getRoleMember', ['bytes32', 'address']), // uint256 → address
      ]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasAccessControl).toBe(true);
      expect(caps.hasEnumerableRoles).toBe(false);
    });
  });

  // ── AccessControlDefaultAdminRules Detection ──────────────────────────

  describe('AccessControlDefaultAdminRules detection', () => {
    it('should detect AccessControlDefaultAdminRules', () => {
      const schema = createSchema([...ACCESS_CONTROL_FUNCTIONS, ...DEFAULT_ADMIN_RULES_FUNCTIONS]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasAccessControl).toBe(true);
      expect(caps.hasTwoStepAdmin).toBe(true);
    });

    it('should not detect DefaultAdminRules without AccessControl base', () => {
      const schema = createSchema(DEFAULT_ADMIN_RULES_FUNCTIONS);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasTwoStepAdmin).toBe(false);
    });

    it('should not detect DefaultAdminRules if beginDefaultAdminTransfer has wrong params', () => {
      const schema = createSchema([
        ...ACCESS_CONTROL_FUNCTIONS,
        createFunction('defaultAdmin', []),
        createFunction('pendingDefaultAdmin', []),
        createFunction('defaultAdminDelay', []),
        createFunction('beginDefaultAdminTransfer', ['uint256']), // address → uint256
        createFunction('acceptDefaultAdminTransfer', []),
        createFunction('cancelDefaultAdminTransfer', []),
      ]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasAccessControl).toBe(true);
      expect(caps.hasTwoStepAdmin).toBe(false);
    });

    it('should not detect DefaultAdminRules if cancelDefaultAdminTransfer is missing', () => {
      const schema = createSchema([
        ...ACCESS_CONTROL_FUNCTIONS,
        createFunction('defaultAdmin', []),
        createFunction('pendingDefaultAdmin', []),
        createFunction('defaultAdminDelay', []),
        createFunction('beginDefaultAdminTransfer', ['address']),
        createFunction('acceptDefaultAdminTransfer', []),
        // cancelDefaultAdminTransfer missing
      ]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasTwoStepAdmin).toBe(false);
    });
  });

  // ── Combined Patterns ─────────────────────────────────────────────────

  describe('combined patterns', () => {
    it('should detect Ownable2Step + AccessControl + Enumerable + DefaultAdminRules', () => {
      const schema = createSchema([
        ...OWNABLE_TWO_STEP_FUNCTIONS,
        ...ACCESS_CONTROL_FUNCTIONS,
        ...ENUMERABLE_FUNCTIONS,
        ...DEFAULT_ADMIN_RULES_FUNCTIONS,
        ...ADMIN_DELAY_CHANGE_FUNCTIONS,
      ]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasOwnable).toBe(true);
      expect(caps.hasTwoStepOwnable).toBe(true);
      expect(caps.hasAccessControl).toBe(true);
      expect(caps.hasTwoStepAdmin).toBe(true);
      expect(caps.hasEnumerableRoles).toBe(true);
    });

    it('should detect Ownable + AccessControl (no Enumerable, no DefaultAdminRules)', () => {
      const schema = createSchema([...OWNABLE_FUNCTIONS, ...ACCESS_CONTROL_FUNCTIONS]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasOwnable).toBe(true);
      expect(caps.hasTwoStepOwnable).toBe(false);
      expect(caps.hasAccessControl).toBe(true);
      expect(caps.hasTwoStepAdmin).toBe(false);
      expect(caps.hasEnumerableRoles).toBe(false);
    });
  });

  // ── Empty / No Access Control ─────────────────────────────────────────

  describe('empty / no access control', () => {
    it('should return all false for empty ABI', () => {
      const schema = createSchema([]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasOwnable).toBe(false);
      expect(caps.hasTwoStepOwnable).toBe(false);
      expect(caps.hasAccessControl).toBe(false);
      expect(caps.hasTwoStepAdmin).toBe(false);
      expect(caps.hasEnumerableRoles).toBe(false);
      expect(caps.supportsHistory).toBe(false);
      expect(caps.verifiedAgainstOZInterfaces).toBe(false);
    });

    it('should return all false for ABI with unrelated functions', () => {
      const schema = createSchema([
        createFunction('mint', ['address', 'uint256']),
        createFunction('burn', ['uint256']),
        createFunction('balanceOf', ['address']),
      ]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasOwnable).toBe(false);
      expect(caps.hasAccessControl).toBe(false);
    });

    it('should add note for no access control interfaces detected', () => {
      const schema = createSchema([]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.notes).toBeDefined();
      expect(caps.notes).toContain('No OpenZeppelin access control interfaces detected');
    });
  });

  // ── Similar-but-Wrong Function Signatures ─────────────────────────────

  describe('similar-but-wrong function signatures', () => {
    it('should not detect owner with wrong parameter (takes an argument)', () => {
      const schema = createSchema([
        createFunction('owner', ['address']), // owner() should take no params
        createFunction('transferOwnership', ['address']),
      ]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasOwnable).toBe(false);
    });

    it('should not detect grantRole with single parameter (missing address)', () => {
      const schema = createSchema([
        createFunction('hasRole', ['bytes32', 'address']),
        createFunction('grantRole', ['bytes32']), // missing second param
        createFunction('revokeRole', ['bytes32', 'address']),
        createFunction('getRoleAdmin', ['bytes32']),
      ]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasAccessControl).toBe(false);
    });

    it('should handle renounceRole-like function without triggering false AccessControl', () => {
      // A contract might have renounceRole but not the full AccessControl set
      const schema = createSchema([createFunction('renounceRole', ['bytes32', 'address'])]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.hasAccessControl).toBe(false);
    });
  });

  // ── supportsHistory Flag ──────────────────────────────────────────────

  describe('supportsHistory flag', () => {
    it('should set supportsHistory to false by default', () => {
      const schema = createSchema(OWNABLE_FUNCTIONS);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.supportsHistory).toBe(false);
    });

    it('should set supportsHistory to true when indexerAvailable is true', () => {
      const schema = createSchema(OWNABLE_FUNCTIONS);
      const caps = detectAccessControlCapabilities(schema, true);

      expect(caps.supportsHistory).toBe(true);
    });
  });

  // ── Notes ─────────────────────────────────────────────────────────────

  describe('notes', () => {
    it('should include Ownable detection note', () => {
      const schema = createSchema(OWNABLE_FUNCTIONS);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.notes).toContain('OpenZeppelin Ownable interface detected');
    });

    it('should include Ownable2Step detection note', () => {
      const schema = createSchema(OWNABLE_TWO_STEP_FUNCTIONS);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.notes).toContain(
        'OpenZeppelin Ownable2Step interface detected (with pendingOwner + acceptOwnership)'
      );
    });

    it('should include AccessControl detection note', () => {
      const schema = createSchema(ACCESS_CONTROL_FUNCTIONS);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.notes).toContain('OpenZeppelin AccessControl interface detected');
    });

    it('should include DefaultAdminRules detection note', () => {
      const schema = createSchema([...ACCESS_CONTROL_FUNCTIONS, ...DEFAULT_ADMIN_RULES_FUNCTIONS]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.notes).toContain(
        'OpenZeppelin AccessControlDefaultAdminRules interface detected'
      );
    });

    it('should include enumerable note when detected', () => {
      const schema = createSchema([...ACCESS_CONTROL_FUNCTIONS, ...ENUMERABLE_FUNCTIONS]);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.notes).toContain(
        'Role enumeration supported (getRoleMemberCount, getRoleMember)'
      );
    });

    it('should include enumeration unavailable note when AccessControl but not Enumerable', () => {
      const schema = createSchema(ACCESS_CONTROL_FUNCTIONS);
      const caps = detectAccessControlCapabilities(schema);

      expect(caps.notes).toContain(
        'Role enumeration not available — requires known role IDs or indexer discovery'
      );
    });

    it('should include history unavailable note when no indexer', () => {
      const schema = createSchema(OWNABLE_FUNCTIONS);
      const caps = detectAccessControlCapabilities(schema, false);

      expect(caps.notes).toContain('History queries unavailable without indexer configuration');
    });

    it('should not include history unavailable note when indexer is available', () => {
      const schema = createSchema(OWNABLE_FUNCTIONS);
      const caps = detectAccessControlCapabilities(schema, true);

      expect(caps.notes).not.toContain('History queries unavailable without indexer configuration');
    });
  });
});

// ---------------------------------------------------------------------------
// validateAccessControlSupport
// ---------------------------------------------------------------------------

describe('validateAccessControlSupport', () => {
  it('should return true for Ownable contract', () => {
    const schema = createSchema(OWNABLE_FUNCTIONS);
    const caps = detectAccessControlCapabilities(schema);

    expect(validateAccessControlSupport(caps)).toBe(true);
  });

  it('should return true for AccessControl contract', () => {
    const schema = createSchema(ACCESS_CONTROL_FUNCTIONS);
    const caps = detectAccessControlCapabilities(schema);

    expect(validateAccessControlSupport(caps)).toBe(true);
  });

  it('should return true for combined Ownable + AccessControl', () => {
    const schema = createSchema([...OWNABLE_FUNCTIONS, ...ACCESS_CONTROL_FUNCTIONS]);
    const caps = detectAccessControlCapabilities(schema);

    expect(validateAccessControlSupport(caps)).toBe(true);
  });

  it('should return false for empty ABI (no access control)', () => {
    const schema = createSchema([]);
    const caps = detectAccessControlCapabilities(schema);

    expect(validateAccessControlSupport(caps)).toBe(false);
  });

  it('should return false for unrelated functions only', () => {
    const schema = createSchema([
      createFunction('mint', ['address', 'uint256']),
      createFunction('burn', ['uint256']),
    ]);
    const caps = detectAccessControlCapabilities(schema);

    expect(validateAccessControlSupport(caps)).toBe(false);
  });
});
