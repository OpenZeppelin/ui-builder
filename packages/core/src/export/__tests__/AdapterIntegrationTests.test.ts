import { beforeEach, describe, expect, it } from 'vitest';

import { Ecosystem } from '@openzeppelin/transaction-form-types/common';

import { FormExportSystem } from '../FormExportSystem';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';

describe('Adapter Integration Tests', () => {
  let exportSystem: FormExportSystem;

  beforeEach(() => {
    exportSystem = new FormExportSystem();
  });

  // Helper function to get exported files and parsed package.json
  async function getExportedPackageJson(ecosystem: Ecosystem, functionName: string = 'transfer') {
    const formConfig = createMinimalFormConfig(functionName, ecosystem);
    const mockContractSchema = createMinimalContractSchema(functionName, ecosystem);
    const result = await exportSystem.exportForm(
      formConfig,
      mockContractSchema,
      ecosystem,
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
      const { packageJson } = await getExportedPackageJson('evm');

      // Check required packages are present
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/transaction-form-types');
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/transaction-form-adapter-evm');

      // Optional: Check if specific SDKs (like ethers) are NOT directly listed if they are peer/sub-dependencies
      // expect(packageJson.dependencies).not.toHaveProperty('ethers');
    });

    it('should include correct dependencies for Solana in package.json', async () => {
      const { packageJson } = await getExportedPackageJson('solana');

      // Check required packages are present
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/transaction-form-types');
      expect(packageJson.dependencies).toHaveProperty(
        '@openzeppelin/transaction-form-adapter-solana'
      );

      // Optional: Check specific SDKs are NOT directly listed
      // expect(packageJson.dependencies).not.toHaveProperty('@solana/web3.js');
    });

    // Add similar tests for Stellar and Midnight if needed
  });
});
