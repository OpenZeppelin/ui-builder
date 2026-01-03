import { describe, expect, it } from 'vitest';

import type { EvmNetworkConfig, NetworkConfig, SolanaNetworkConfig } from '@openzeppelin/ui-types';

import { AppExportSystem } from '../AppExportSystem';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';

// Define mock network configs
const mockEvmNetworkConfig: EvmNetworkConfig = {
  id: 'test-export-structure-evm',
  name: 'Test Export Structure EVM',
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
const mockSolanaConfig: SolanaNetworkConfig = {
  id: 'test-export-structure-solana',
  name: 'Test Export Structure Solana',
  exportConstName: 'mockSolanaNetworkConfig',
  ecosystem: 'solana',
  network: 'solana',
  type: 'testnet',
  isTestnet: true,
  rpcEndpoint: 'mock',
  commitment: 'confirmed',
};

describe('Export Structure Tests', () => {
  /**
   * Common validation function for basic project structure
   */
  async function testExportStructure(
    networkConfig: NetworkConfig,
    functionName: string = 'transfer'
  ) {
    const exportSystem = new AppExportSystem();
    const formConfig = createMinimalFormConfig(functionName, networkConfig.ecosystem);
    const contractSchema = createMinimalContractSchema(functionName, networkConfig.ecosystem);

    const result = await exportSystem.exportApp(
      formConfig,
      contractSchema,
      networkConfig,
      functionName,
      { projectName: `test-${networkConfig.ecosystem}-project` }
    );

    // Extract files from the ZIP using result.data
    expect(result.data).toBeDefined(); // Add check for data property
    const files = await extractFilesFromZip(result.data);

    // Get list of files for debugging
    const fileList = Object.keys(files).sort();

    // Return the extracted files and file list for assertions
    return { files, fileList };
  }

  describe('Basic Project Structure', () => {
    it('should include standard project files in all exports', async () => {
      const { files, fileList } = await testExportStructure(mockEvmNetworkConfig);

      // Core project files that should always be present
      const requiredCoreFiles = [
        'package.json',
        'src/App.tsx',
        'src/components/GeneratedForm.tsx',
        'src/main.tsx',
      ];

      // Verify all core files exist
      for (const file of requiredCoreFiles) {
        expect(fileList).toContain(file);
      }

      // Verify package.json has basic structure
      const packageJson = JSON.parse(files['package.json']);
      expect(packageJson).toHaveProperty('name');
      expect(packageJson).toHaveProperty('version');
      expect(packageJson).toHaveProperty('dependencies');
      expect(packageJson).toHaveProperty('scripts');

      // Verify scripts include common development commands
      expect(packageJson.scripts).toHaveProperty('dev');
      expect(packageJson.scripts).toHaveProperty('build');

      // Verify dependencies include core libraries
      const dependencies = packageJson.dependencies;
      expect(dependencies).toHaveProperty('react');
      expect(dependencies).toHaveProperty('react-dom');
      // Check for the renderer package as well
      expect(dependencies).toHaveProperty('@openzeppelin/ui-renderer');
    });

    // REMOVED TESTS for includeAdapters true/false as the src/adapters dir is gone

    it('should include .gitignore file with node_modules entry', async () => {
      const { files, fileList } = await testExportStructure(mockEvmNetworkConfig);

      // Verify .gitignore exists
      expect(fileList).toContain('.gitignore');

      // Verify .gitignore has node_modules entry
      const gitignoreContent = files['.gitignore'];
      expect(gitignoreContent).toBeDefined();
      expect(gitignoreContent).toContain('node_modules');
    });
  });

  describe('Chain-Specific Exports', () => {
    it('should include correct dependencies for EVM exports', async () => {
      const { files } = await testExportStructure(mockEvmNetworkConfig);

      // Verify package.json has correct adapter dependencies
      const packageJson = JSON.parse(files['package.json']);
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/ui-types');
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/ui-builder-adapter-evm');
    });

    it('should include correct dependencies for Solana exports', async () => {
      const { files } = await testExportStructure(mockSolanaConfig);

      // Verify package.json has correct adapter dependencies
      const packageJson = JSON.parse(files['package.json']);
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/ui-types');
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/ui-builder-adapter-solana');
    });

    // Add tests for Stellar/Midnight if needed
  });

  describe('Project Naming and Configuration', () => {
    it('should use the provided project name in package.json', async () => {
      const customProjectName = 'custom-project-name';
      const exportSystem = new AppExportSystem();

      const result = await exportSystem.exportApp(
        createMinimalFormConfig('transfer'),
        createMinimalContractSchema('transfer', 'evm'),
        mockEvmNetworkConfig,
        'transfer',
        { projectName: customProjectName }
      );

      expect(result.data).toBeDefined(); // Add check for data property
      const files = await extractFilesFromZip(result.data);
      const packageJson = JSON.parse(files['package.json']);

      expect(packageJson.name).toBe(customProjectName);
    });

    it('should generate a valid index.html file', async () => {
      const { files } = await testExportStructure(mockEvmNetworkConfig);

      // Verify index.html exists and has basic HTML structure
      expect(files['index.html']).toBeDefined();

      // Use a case-insensitive regex for DOCTYPE check
      expect(files['index.html']).toMatch(/<!doctype html>/i);
      expect(files['index.html']).toContain('<html');
      expect(files['index.html']).toContain('<body');
      expect(files['index.html']).toContain('</html>');

      // Verify it includes root div for React mounting
      expect(files['index.html']).toMatch(/<div id=["']root["']/);

      // Verify it links to the main script
      expect(files['index.html']).toMatch(/src=["'].*main/);
    });
  });
});
