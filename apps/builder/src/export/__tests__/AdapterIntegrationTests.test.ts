import { beforeEach, describe, expect, it } from 'vitest';

import type { EvmNetworkConfig, NetworkConfig, SolanaNetworkConfig } from '@openzeppelin/ui-types';

import { AppExportSystem } from '../AppExportSystem';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';

// Define mock network configs
const mockEvmNetworkConfig: EvmNetworkConfig = {
  id: 'test-export-adapter-evm',
  name: 'Test Export EVM',
  exportConstName: 'mockEvmNetworkConfig',
  ecosystem: 'evm',
  network: 'ethereum',
  type: 'testnet',
  isTestnet: true,
  chainId: 1337,
  rpcUrl: 'http://localhost:8545',
  nativeCurrency: { name: 'TETH', symbol: 'TETH', decimals: 18 },
  apiUrl: '',
};

const mockSolanaNetworkConfig: SolanaNetworkConfig = {
  id: 'test-export-adapter-solana',
  name: 'Test Export Solana',
  exportConstName: 'mockSolanaNetworkConfig',
  ecosystem: 'solana',
  network: 'solana',
  type: 'testnet',
  isTestnet: true,
  rpcEndpoint: 'mock',
  commitment: 'confirmed',
};

describe('Adapter Integration Tests', () => {
  let exportSystem: AppExportSystem;

  beforeEach(() => {
    exportSystem = new AppExportSystem();
  });

  // Helper function to get exported files and parsed package.json
  async function getExportedPackageJson(
    networkConfig: NetworkConfig,
    functionName: string = 'transfer'
  ) {
    const formConfig = createMinimalFormConfig(functionName, networkConfig.ecosystem);
    const mockContractSchema = createMinimalContractSchema(functionName, networkConfig.ecosystem);
    const result = await exportSystem.exportApp(
      formConfig,
      mockContractSchema,
      networkConfig,
      functionName
    );
    expect(result.data).toBeDefined();
    const files = await extractFilesFromZip(result.data);
    expect(files['package.json']).toBeDefined();
    const packageJson = JSON.parse(files['package.json']);
    return {
      packageJson,
      allFiles: files,
    };
  }

  describe('Package.json Adapter Dependencies', () => {
    it('should include correct dependencies for EVM in package.json', async () => {
      const { packageJson } = await getExportedPackageJson(mockEvmNetworkConfig);

      // Check required packages are present
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/ui-types');
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/ui-builder-adapter-evm');

      // Optional: Check if specific SDKs (like ethers) are NOT directly listed if they are peer/sub-dependencies
      // expect(packageJson.dependencies).not.toHaveProperty('ethers');
    });

    it('should include correct dependencies for Solana in package.json', async () => {
      const { packageJson } = await getExportedPackageJson(mockSolanaNetworkConfig);

      // Check required packages are present
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/ui-types');
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/ui-builder-adapter-solana');

      // Optional: Check specific SDKs are NOT directly listed
      // expect(packageJson.dependencies).not.toHaveProperty('@solana/web3.js');
    });

    // Add similar tests for Stellar and Midnight if needed
  });
});
