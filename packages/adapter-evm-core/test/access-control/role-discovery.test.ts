/**
 * Role Discovery Tests for EVM Access Control
 *
 * Tests findRoleConstantCandidates and discoverRoleLabelsFromAbi.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ContractFunction, ContractSchema } from '@openzeppelin/ui-types';

import {
  discoverRoleLabelsFromAbi,
  findRoleConstantCandidates,
} from '../../src/access-control/role-discovery';

// ---------------------------------------------------------------------------
// Mock the public-client module before importing role-discovery
// ---------------------------------------------------------------------------

const mockReadContract = vi.fn();

vi.mock('../../src/utils/public-client', () => ({
  createEvmPublicClient: () => ({
    readContract: mockReadContract,
  }),
}));

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

  afterEach(() => {
    mockReadContract.mockReset();
  });

  it('should return empty map when no candidates', async () => {
    const schema = createSchema([createFunction('owner', [])]);
    const result = await discoverRoleLabelsFromAbi(rpcUrl, contractAddress, schema);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('should discover labels from on-chain role constant calls', async () => {
    const minterHash = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
    const pauserHash = '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a';

    mockReadContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === 'MINTER_ROLE') return minterHash;
      if (functionName === 'PAUSER_ROLE') return pauserHash;
      throw new Error(`Unexpected function: ${functionName}`);
    });

    const schema = createSchema([
      createFunction('MINTER_ROLE', [], {
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'view',
      }),
      createFunction('PAUSER_ROLE', [], {
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'pure',
      }),
    ]);

    const result = await discoverRoleLabelsFromAbi(rpcUrl, contractAddress, schema);

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(2);
    expect(result.get(minterHash)).toBe('MINTER_ROLE');
    expect(result.get(pauserHash)).toBe('PAUSER_ROLE');
  });

  it('should skip failed on-chain calls gracefully', async () => {
    const minterHash = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';

    mockReadContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === 'MINTER_ROLE') return minterHash;
      throw new Error('execution reverted');
    });

    const schema = createSchema([
      createFunction('MINTER_ROLE', [], {
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'view',
      }),
      createFunction('BURNER_ROLE', [], {
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'view',
      }),
    ]);

    const result = await discoverRoleLabelsFromAbi(rpcUrl, contractAddress, schema);

    // Only MINTER_ROLE should be resolved, BURNER_ROLE should be skipped
    expect(result.size).toBe(1);
    expect(result.get(minterHash)).toBe('MINTER_ROLE');
  });

  it('should normalize returned bytes32 values to lowercase', async () => {
    const upperHash = '0x9F2DF0FED2C77648DE5860A4CC508CD0818C85B8B8A1AB4CEEEF8D981C8956A6';
    const expectedLower = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';

    mockReadContract.mockResolvedValueOnce(upperHash);

    const schema = createSchema([
      createFunction('MINTER_ROLE', [], {
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'view',
      }),
    ]);

    const result = await discoverRoleLabelsFromAbi(rpcUrl, contractAddress, schema);

    expect(result.size).toBe(1);
    expect(result.get(expectedLower)).toBe('MINTER_ROLE');
    // Should not have the uppercase version
    expect(result.has(upperHash)).toBe(false);
  });
});
