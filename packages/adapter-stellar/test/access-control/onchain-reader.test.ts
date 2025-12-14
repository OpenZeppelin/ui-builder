/**
 * Unit tests for access control on-chain reader
 *
 * Tests: T016 - On-chain reading of ownership and role membership
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StellarNetworkConfig } from '@openzeppelin/ui-builder-types';

import {
  enumerateRoleMembers,
  getAdmin,
  getRoleAdmin,
  getRoleMember,
  getRoleMemberCount,
  hasRole,
  readCurrentRoles,
  readOwnership,
} from '../../src/access-control/onchain-reader';
import { queryStellarViewFunction } from '../../src/query/handler';

// Mock the query handler
vi.mock('../../src/query/handler', () => ({
  queryStellarViewFunction: vi.fn(),
}));

// Mock the logger but keep the actual async utilities (promiseAllWithLimit, etc.)
vi.mock('@openzeppelin/ui-builder-utils', async () => {
  const actual = await vi.importActual<typeof import('@openzeppelin/ui-builder-utils')>(
    '@openzeppelin/ui-builder-utils'
  );
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('Access Control On-Chain Reader (T016)', () => {
  let mockNetworkConfig: StellarNetworkConfig;
  const mockQueryFn = queryStellarViewFunction as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockNetworkConfig = {
      id: 'stellar-testnet',
      name: 'Stellar Testnet',
      ecosystem: 'stellar',
      network: 'stellar',
      type: 'testnet',
      isTestnet: true,
      exportConstName: 'stellarTestnet',
      horizonUrl: 'https://horizon-testnet.stellar.org',
      sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
      networkPassphrase: 'Test SDF Network ; September 2015',
    };
  });

  describe('readOwnership', () => {
    it('should read owner address successfully', async () => {
      const ownerAddress = 'GOWNER123456789';
      mockQueryFn.mockResolvedValueOnce(ownerAddress);

      const result = await readOwnership('CTEST123', mockNetworkConfig);

      expect(result.owner).toBe(ownerAddress);
      expect(mockQueryFn).toHaveBeenCalledWith(
        'CTEST123',
        'get_owner',
        expect.anything(),
        [],
        expect.anything()
      );
    });

    it('should handle null owner (no owner set)', async () => {
      mockQueryFn.mockResolvedValueOnce(null);

      const result = await readOwnership('CTEST123', mockNetworkConfig);

      expect(result.owner).toBeNull();
    });

    it('should handle undefined owner', async () => {
      mockQueryFn.mockResolvedValueOnce(undefined);

      const result = await readOwnership('CTEST123', mockNetworkConfig);

      expect(result.owner).toBeNull();
    });

    it('should convert non-string result to string', async () => {
      const ownerAddress = { toString: () => 'GOWNER123' };
      mockQueryFn.mockResolvedValueOnce(ownerAddress);

      const result = await readOwnership('CTEST123', mockNetworkConfig);

      expect(result.owner).toBe('GOWNER123');
    });

    it('should throw error on query failure', async () => {
      mockQueryFn.mockRejectedValueOnce(new Error('RPC error'));

      await expect(readOwnership('CTEST123', mockNetworkConfig)).rejects.toThrow(
        'Failed to read ownership: RPC error'
      );
    });
  });

  describe('hasRole', () => {
    it('should return true when account has role (returns number index)', async () => {
      mockQueryFn.mockResolvedValueOnce(0);

      const result = await hasRole('CTEST123', 'admin', 'GACCOUNT123', mockNetworkConfig);

      expect(result).toBe(true);
      expect(mockQueryFn).toHaveBeenCalledWith(
        'CTEST123',
        'has_role',
        expect.anything(),
        ['GACCOUNT123', 'admin'],
        expect.anything()
      );
    });

    it('should return false when account does not have role (returns null)', async () => {
      mockQueryFn.mockResolvedValueOnce(null);

      const result = await hasRole('CTEST123', 'admin', 'GACCOUNT123', mockNetworkConfig);

      expect(result).toBe(false);
    });

    it('should return false on query failure (graceful degradation)', async () => {
      mockQueryFn.mockRejectedValueOnce(new Error('RPC error'));

      const result = await hasRole('CTEST123', 'admin', 'GACCOUNT123', mockNetworkConfig);

      expect(result).toBe(false);
    });
  });

  describe('getRoleMemberCount', () => {
    it('should return role member count', async () => {
      mockQueryFn.mockResolvedValueOnce(5);

      const result = await getRoleMemberCount('CTEST123', 'admin', mockNetworkConfig);

      expect(result).toBe(5);
      expect(mockQueryFn).toHaveBeenCalledWith(
        'CTEST123',
        'get_role_member_count',
        expect.anything(),
        ['admin'],
        expect.anything()
      );
    });

    it('should handle zero members', async () => {
      mockQueryFn.mockResolvedValueOnce(0);

      const result = await getRoleMemberCount('CTEST123', 'admin', mockNetworkConfig);

      expect(result).toBe(0);
    });

    it('should return 0 for non-number result', async () => {
      mockQueryFn.mockResolvedValueOnce('not-a-number');

      const result = await getRoleMemberCount('CTEST123', 'admin', mockNetworkConfig);

      expect(result).toBe(0);
    });

    it('should return 0 on query failure (graceful degradation)', async () => {
      mockQueryFn.mockRejectedValueOnce(new Error('RPC error'));

      const result = await getRoleMemberCount('CTEST123', 'admin', mockNetworkConfig);

      expect(result).toBe(0);
    });
  });

  describe('getRoleMember', () => {
    it('should return role member at index', async () => {
      const memberAddress = 'GMEMBER123';
      mockQueryFn.mockResolvedValueOnce(memberAddress);

      const result = await getRoleMember('CTEST123', 'admin', 0, mockNetworkConfig);

      expect(result).toBe(memberAddress);
      expect(mockQueryFn).toHaveBeenCalledWith(
        'CTEST123',
        'get_role_member',
        expect.anything(),
        ['admin', 0],
        expect.anything()
      );
    });

    it('should convert non-string result to string', async () => {
      const memberAddress = { toString: () => 'GMEMBER123' };
      mockQueryFn.mockResolvedValueOnce(memberAddress);

      const result = await getRoleMember('CTEST123', 'admin', 0, mockNetworkConfig);

      expect(result).toBe('GMEMBER123');
    });

    it('should return null on query failure (graceful degradation)', async () => {
      mockQueryFn.mockRejectedValueOnce(new Error('RPC error'));

      const result = await getRoleMember('CTEST123', 'admin', 0, mockNetworkConfig);

      expect(result).toBeNull();
    });
  });

  describe('enumerateRoleMembers', () => {
    it('should enumerate all role members in parallel', async () => {
      // Mock implementation that handles parallel calls
      mockQueryFn.mockImplementation((contractAddress, functionName, _config, args) => {
        if (functionName === 'get_role_member_count') {
          return Promise.resolve(3);
        }
        if (functionName === 'get_role_member') {
          const [, index] = args;
          return Promise.resolve(`GMEMBER${index + 1}`);
        }
        return Promise.reject(new Error('Unknown function'));
      });

      const result = await enumerateRoleMembers('CTEST123', 'admin', mockNetworkConfig);

      expect(result).toEqual(['GMEMBER1', 'GMEMBER2', 'GMEMBER3']);
      expect(mockQueryFn).toHaveBeenCalledTimes(4); // 1 count + 3 parallel member calls
    });

    it('should return empty array for role with no members', async () => {
      mockQueryFn.mockResolvedValueOnce(0);

      const result = await enumerateRoleMembers('CTEST123', 'admin', mockNetworkConfig);

      expect(result).toEqual([]);
      expect(mockQueryFn).toHaveBeenCalledTimes(1); // only count
    });

    it('should filter out failed member reads (graceful degradation)', async () => {
      // Mock implementation that returns null for one member (simulating a failed read)
      mockQueryFn.mockImplementation((contractAddress, functionName, _config, args) => {
        if (functionName === 'get_role_member_count') {
          return Promise.resolve(3);
        }
        if (functionName === 'get_role_member') {
          const [, index] = args;
          if (index === 1) {
            // Simulate failure for middle member - getRoleMember catches errors and returns null
            return Promise.resolve(null);
          }
          return Promise.resolve(`GMEMBER${index + 1}`);
        }
        return Promise.reject(new Error('Unknown function'));
      });

      const result = await enumerateRoleMembers('CTEST123', 'admin', mockNetworkConfig);

      // Member at index 1 should be filtered out (returned null)
      expect(result).toEqual(['GMEMBER1', 'GMEMBER3']);
      expect(mockQueryFn).toHaveBeenCalledTimes(4);
    });
  });

  describe('readCurrentRoles', () => {
    it('should read current roles for multiple role IDs in parallel', async () => {
      const roleIds = ['admin', 'minter'];

      // Mock implementation that handles parallel role enumeration
      mockQueryFn.mockImplementation((contractAddress, functionName, _config, args) => {
        if (functionName === 'get_role_member_count') {
          const [role] = args;
          if (role === 'admin') return Promise.resolve(2);
          if (role === 'minter') return Promise.resolve(1);
          return Promise.resolve(0);
        }
        if (functionName === 'get_role_member') {
          const [role, index] = args;
          if (role === 'admin') {
            return Promise.resolve(`GADMIN${index + 1}`);
          }
          if (role === 'minter') {
            return Promise.resolve('GMINTER1');
          }
          return Promise.resolve(null);
        }
        return Promise.reject(new Error('Unknown function'));
      });

      const result = await readCurrentRoles('CTEST123', roleIds, mockNetworkConfig);

      expect(result).toHaveLength(2);

      // Find roles by ID since parallel execution doesn't guarantee order
      const adminRole = result.find((r) => r.role.id === 'admin');
      const minterRole = result.find((r) => r.role.id === 'minter');

      expect(adminRole).toEqual({
        role: { id: 'admin', label: 'admin' },
        members: ['GADMIN1', 'GADMIN2'],
      });
      expect(minterRole).toEqual({
        role: { id: 'minter', label: 'minter' },
        members: ['GMINTER1'],
      });
    });

    it('should handle roles with no members', async () => {
      const roleIds = ['admin', 'minter'];

      mockQueryFn.mockImplementation((contractAddress, functionName, _config, args) => {
        if (functionName === 'get_role_member_count') {
          const [role] = args;
          if (role === 'admin') return Promise.resolve(1);
          if (role === 'minter') return Promise.resolve(0);
          return Promise.resolve(0);
        }
        if (functionName === 'get_role_member') {
          const [role] = args;
          if (role === 'admin') return Promise.resolve('GADMIN1');
          return Promise.resolve(null);
        }
        return Promise.reject(new Error('Unknown function'));
      });

      const result = await readCurrentRoles('CTEST123', roleIds, mockNetworkConfig);

      expect(result).toHaveLength(2);

      const adminRole = result.find((r) => r.role.id === 'admin');
      const minterRole = result.find((r) => r.role.id === 'minter');

      expect(adminRole?.members).toEqual(['GADMIN1']);
      expect(minterRole?.members).toEqual([]);
    });

    it('should handle empty role IDs array', async () => {
      const result = await readCurrentRoles('CTEST123', [], mockNetworkConfig);

      expect(result).toEqual([]);
      expect(mockQueryFn).not.toHaveBeenCalled();
    });

    it('should continue reading roles even if one fails (graceful degradation)', async () => {
      const roleIds = ['admin', 'minter', 'burner'];

      mockQueryFn.mockImplementation((contractAddress, functionName, _config, args) => {
        if (functionName === 'get_role_member_count') {
          const [role] = args;
          if (role === 'admin') return Promise.resolve(1);
          if (role === 'minter') return Promise.reject(new Error('Role enumeration failed'));
          if (role === 'burner') return Promise.resolve(1);
          return Promise.resolve(0);
        }
        if (functionName === 'get_role_member') {
          const [role] = args;
          if (role === 'admin') return Promise.resolve('GADMIN1');
          if (role === 'burner') return Promise.resolve('GBURNER1');
          return Promise.resolve(null);
        }
        return Promise.reject(new Error('Unknown function'));
      });

      const result = await readCurrentRoles('CTEST123', roleIds, mockNetworkConfig);

      expect(result).toHaveLength(3);

      const adminRole = result.find((r) => r.role.id === 'admin');
      const minterRole = result.find((r) => r.role.id === 'minter');
      const burnerRole = result.find((r) => r.role.id === 'burner');

      expect(adminRole?.members).toEqual(['GADMIN1']);
      expect(minterRole?.members).toEqual([]); // Failed, so empty array
      expect(burnerRole?.members).toEqual(['GBURNER1']);
    });
  });

  describe('getRoleAdmin', () => {
    it('should return role admin', async () => {
      const adminRole = 'super_admin';
      mockQueryFn.mockResolvedValueOnce(adminRole);

      const result = await getRoleAdmin('CTEST123', 'admin', mockNetworkConfig);

      expect(result).toBe(adminRole);
      expect(mockQueryFn).toHaveBeenCalledWith(
        'CTEST123',
        'get_role_admin',
        expect.anything(),
        ['admin'],
        expect.anything()
      );
    });

    it('should convert non-string result to string', async () => {
      const adminRole = { toString: () => 'super_admin' };
      mockQueryFn.mockResolvedValueOnce(adminRole);

      const result = await getRoleAdmin('CTEST123', 'admin', mockNetworkConfig);

      expect(result).toBe('super_admin');
    });

    it('should return null on query failure (graceful degradation)', async () => {
      mockQueryFn.mockRejectedValueOnce(new Error('RPC error'));

      const result = await getRoleAdmin('CTEST123', 'admin', mockNetworkConfig);

      expect(result).toBeNull();
    });
  });

  describe('getAdmin', () => {
    it('should return admin account', async () => {
      const adminAccount = 'GADMIN123';
      mockQueryFn.mockResolvedValueOnce(adminAccount);

      const result = await getAdmin('CTEST123', mockNetworkConfig);

      expect(result).toBe(adminAccount);
      expect(mockQueryFn).toHaveBeenCalledWith(
        'CTEST123',
        'get_admin',
        expect.anything(),
        [],
        expect.anything()
      );
    });

    it('should handle null admin (no admin set)', async () => {
      mockQueryFn.mockResolvedValueOnce(null);

      const result = await getAdmin('CTEST123', mockNetworkConfig);

      expect(result).toBeNull();
    });

    it('should handle undefined admin', async () => {
      mockQueryFn.mockResolvedValueOnce(undefined);

      const result = await getAdmin('CTEST123', mockNetworkConfig);

      expect(result).toBeNull();
    });

    it('should convert non-string result to string', async () => {
      const adminAccount = { toString: () => 'GADMIN123' };
      mockQueryFn.mockResolvedValueOnce(adminAccount);

      const result = await getAdmin('CTEST123', mockNetworkConfig);

      expect(result).toBe('GADMIN123');
    });

    it('should return null on query failure (graceful degradation)', async () => {
      mockQueryFn.mockRejectedValueOnce(new Error('RPC error'));

      const result = await getAdmin('CTEST123', mockNetworkConfig);

      expect(result).toBeNull();
    });
  });
});
