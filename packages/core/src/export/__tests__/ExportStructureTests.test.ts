import { describe, expect, it } from 'vitest';

import { FormExportSystem } from '../FormExportSystem';
import { createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';

import type { ChainType } from '../../core/types/ContractSchema';
import type { BuilderFormConfig } from '../../core/types/FormTypes';

describe('Export Structure Tests', () => {
  /**
   * Common validation function for basic project structure
   */
  async function testExportStructure(
    formConfig: BuilderFormConfig,
    chainType: ChainType,
    functionName: string,
    options: { includeAdapters?: boolean } = {}
  ) {
    // Create the export system
    const exportSystem = new FormExportSystem();

    // Generate export options
    const exportOptions = {
      includeAdapters: options.includeAdapters ?? true,
      projectName: `test-${chainType}-project`,
    };

    // Export the form
    const result = await exportSystem.exportForm(
      formConfig,
      chainType,
      functionName,
      exportOptions
    );

    // Extract files from the ZIP
    const files = await extractFilesFromZip(result.zipBlob);

    // Get list of files for debugging
    const fileList = Object.keys(files).sort();

    // Return the extracted files and file list for assertions
    return { files, fileList };
  }

  describe('Basic Project Structure', () => {
    it('should include standard project files in all exports', async () => {
      const { files, fileList } = await testExportStructure(
        createMinimalFormConfig('transfer'),
        'evm',
        'transfer'
      );

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
    });

    it('should generate proper file structure when includeAdapters is true', async () => {
      const { fileList } = await testExportStructure(
        createMinimalFormConfig('transfer'),
        'evm',
        'transfer',
        { includeAdapters: true }
      );

      // Adapter files that should be present
      const adapterFiles = ['src/adapters/index.ts', 'src/adapters/evm/adapter.ts'];

      // Verify adapter files exist
      for (const file of adapterFiles) {
        expect(fileList).toContain(file);
      }
    });

    it('should not include chain-specific adapters when includeAdapters is false', async () => {
      const { fileList } = await testExportStructure(
        createMinimalFormConfig('transfer'),
        'evm',
        'transfer',
        { includeAdapters: false }
      );

      // Verify specific adapter directories are not present
      const hasChainSpecificAdapter = fileList.some(
        (file) =>
          file.startsWith('src/adapters/evm/') ||
          file.startsWith('src/adapters/solana/') ||
          file.startsWith('src/adapters/stellar/')
      );

      expect(hasChainSpecificAdapter).toBe(false);

      // AdapterPlaceholder.ts might still be present, but that's acceptable
      // since it's a generic placeholder file, not a chain-specific adapter
    });
  });

  describe('Chain-Specific Exports', () => {
    it('should include EVM-specific files for EVM exports', async () => {
      const { files } = await testExportStructure(
        createMinimalFormConfig('transfer'),
        'evm',
        'transfer'
      );

      // Verify EVM adapter is included and exports correct content
      expect(files['src/adapters/index.ts']).toContain('EvmAdapter');
      expect(files['src/adapters/evm/adapter.ts']).toContain('EvmAdapter');

      // Verify package.json has ethers dependency
      const packageJson = JSON.parse(files['package.json']);
      expect(packageJson.dependencies).toHaveProperty('ethers');
    });

    it('should include Solana-specific files for Solana exports', async () => {
      const { files } = await testExportStructure(
        createMinimalFormConfig('transfer'),
        'solana',
        'transfer'
      );

      // Verify Solana adapter is included and exports correct content
      expect(files['src/adapters/index.ts']).toContain('solana');
      expect(files['src/adapters/solana/adapter.ts']).toBeDefined();

      // Verify package.json has solana dependencies
      const packageJson = JSON.parse(files['package.json']);
      const hasSolanaDependency = Object.keys(packageJson.dependencies).some(
        (dep) => dep.includes('solana') || dep.includes('@solana')
      );
      expect(hasSolanaDependency).toBe(true);
    });
  });

  describe('Project Naming and Configuration', () => {
    it('should use the provided project name in package.json', async () => {
      const customProjectName = 'custom-project-name';
      const exportSystem = new FormExportSystem();

      const result = await exportSystem.exportForm(
        createMinimalFormConfig('transfer'),
        'evm',
        'transfer',
        { projectName: customProjectName }
      );

      const files = await extractFilesFromZip(result.zipBlob);
      const packageJson = JSON.parse(files['package.json']);

      expect(packageJson.name).toBe(customProjectName);
    });

    it('should generate a valid index.html file', async () => {
      const { files } = await testExportStructure(
        createMinimalFormConfig('transfer'),
        'evm',
        'transfer'
      );

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
