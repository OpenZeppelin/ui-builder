import { describe, expect, it } from 'vitest';

import { AdapterExportManager } from '../AdapterExportManager';

import type { ChainType } from '../../core/types/ContractSchema';

/**
 * Unit tests for the AdapterExportManager class
 */
describe('AdapterExportManager', () => {
  // Create a mock registry for testing
  const mockRegistry: Record<ChainType, string[]> = {
    evm: ['../adapters/evm/adapter.ts', '../adapters/evm/types.ts'],
    solana: ['../adapters/solana/adapter.ts'],
    stellar: ['../adapters/stellar/adapter.ts'],
    midnight: ['../adapters/midnight/adapter.ts'],
  };

  describe('getAvailableChainTypes', () => {
    it('should return all available chain types', async () => {
      const manager = new AdapterExportManager(mockRegistry);
      const chainTypes = await manager.getAvailableChainTypes();

      // Verify we have the expected chain types
      expect(chainTypes).toContain('evm');
      expect(chainTypes).toContain('solana');
      expect(chainTypes).toContain('stellar');
      expect(chainTypes).toContain('midnight');
      expect(chainTypes.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('getAdapterFiles', () => {
    it('should return adapter files for a valid chain type', async () => {
      const manager = new AdapterExportManager(mockRegistry);
      const files = await manager.getAdapterFiles('evm');

      // Verify core type files are included
      expect(files).toHaveProperty('src/core/types/ContractSchema.ts');

      // Verify adapter files are included
      expect(files).toHaveProperty('src/adapters/evm/adapter.ts');
      expect(files).toHaveProperty('src/adapters/evm/types.ts');

      // Verify barrel file that exports only the EVM adapter
      expect(files).toHaveProperty('src/adapters/index.ts');
      expect(files['src/adapters/index.ts']).toContain('EvmAdapter');
      expect(files['src/adapters/index.ts']).not.toContain('SolanaAdapter');
    });

    it('should throw an error for an invalid chain type', async () => {
      const manager = new AdapterExportManager(mockRegistry);

      // Use a function wrapper to properly catch the error
      const getInvalidAdapter = async () => {
        // @ts-expect-error Invalid chain type for test
        return await manager.getAdapterFiles('invalid');
      };

      // Expect the function to throw an error with the specific message
      await expect(getInvalidAdapter()).rejects.toThrow('No adapter found for chain type: invalid');
    });
  });

  describe('createAdapterBarrel', () => {
    it('should create a barrel file that only exports the specified adapter', async () => {
      const manager = new AdapterExportManager(mockRegistry);
      const files = await manager.getAdapterFiles('solana');

      // Check barrel file content
      const barrelContent = files['src/adapters/index.ts'];

      // Should export SolanaAdapter only
      expect(barrelContent).toContain('SolanaAdapter');
      expect(barrelContent).not.toContain('EvmAdapter');
      expect(barrelContent).not.toContain('MidnightAdapter');
      expect(barrelContent).not.toContain('StellarAdapter');

      // Should have correct import path
      expect(barrelContent).toContain("from './solana/adapter'");
    });
  });
});
