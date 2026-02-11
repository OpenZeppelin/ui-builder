/**
 * Role Discovery Tests for EVM Access Control
 *
 * Tests findRoleConstantCandidates and discoverRoleLabelsFromAbi.
 */

import { describe, expect, it } from 'vitest';

import type { ContractFunction, ContractSchema } from '@openzeppelin/ui-types';

import {
  discoverRoleLabelsFromAbi,
  findRoleConstantCandidates,
} from '../../src/access-control/role-discovery';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createFunction(
  name: string,
  inputTypes: string[] = [],
  options?: { outputs?: { name: string; type: string }[]; stateMutability?: string }
): ContractFunction {
  return {
    id: name,
    name,
    displayName: name,
    type: 'function',
    inputs: inputTypes.map((type, i) => ({ name: `param${i}`, type })),
    outputs: options?.outputs ?? [],
    modifiesState: false,
    stateMutability: (options?.stateMutability as 'view' | 'pure') ?? 'view',
  };
}

function createSchema(functions: ContractFunction[]): ContractSchema {
  return {
    ecosystem: 'evm',
    functions,
  };
}

// ---------------------------------------------------------------------------
// findRoleConstantCandidates
// ---------------------------------------------------------------------------

describe('findRoleConstantCandidates', () => {
  it('should return empty array for schema with no role-like functions', () => {
    const schema = createSchema([
      createFunction('owner', []),
      createFunction('transferOwnership', ['address']),
    ]);
    expect(findRoleConstantCandidates(schema)).toHaveLength(0);
  });

  it('should detect function with no inputs, single bytes32 output, view, name ending in _ROLE', () => {
    const schema = createSchema([
      createFunction('MINTER_ROLE', [], {
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'view',
      }),
    ]);
    const candidates = findRoleConstantCandidates(schema);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].name).toBe('MINTER_ROLE');
  });

  it('should detect function with name ending in Role (camelCase)', () => {
    const schema = createSchema([
      createFunction('minterRole', [], {
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'pure',
      }),
    ]);
    const candidates = findRoleConstantCandidates(schema);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].name).toBe('minterRole');
  });

  it('should reject function with inputs', () => {
    const schema = createSchema([
      createFunction('MINTER_ROLE', ['address'], {
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'view',
      }),
    ]);
    expect(findRoleConstantCandidates(schema)).toHaveLength(0);
  });

  it('should reject function with non-bytes32 output', () => {
    const schema = createSchema([
      createFunction('MINTER_ROLE', [], {
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
      }),
    ]);
    expect(findRoleConstantCandidates(schema)).toHaveLength(0);
  });

  it('should reject function with non-view/pure mutability', () => {
    const schema = createSchema([
      createFunction('MINTER_ROLE', [], {
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'nonpayable',
      }),
    ]);
    expect(findRoleConstantCandidates(schema)).toHaveLength(0);
  });

  it('should reject function whose name does not end with _ROLE or Role', () => {
    const schema = createSchema([
      createFunction('roleHash', [], {
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'view',
      }),
    ]);
    expect(findRoleConstantCandidates(schema)).toHaveLength(0);
  });

  it('should return multiple candidates', () => {
    const schema = createSchema([
      createFunction('MINTER_ROLE', [], {
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'view',
      }),
      createFunction('PAUSER_ROLE', [], {
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'view',
      }),
    ]);
    const candidates = findRoleConstantCandidates(schema);
    expect(candidates).toHaveLength(2);
    expect(candidates.map((c) => c.name).sort()).toEqual(['MINTER_ROLE', 'PAUSER_ROLE']);
  });
});

// ---------------------------------------------------------------------------
// discoverRoleLabelsFromAbi
// ---------------------------------------------------------------------------

describe('discoverRoleLabelsFromAbi', () => {
  const rpcUrl = 'https://rpc.example.com';
  const contractAddress = '0x1234567890123456789012345678901234567890';

  it('should return empty map when no candidates', async () => {
    const schema = createSchema([createFunction('owner', [])]);
    const result = await discoverRoleLabelsFromAbi(rpcUrl, contractAddress, schema);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });
});
