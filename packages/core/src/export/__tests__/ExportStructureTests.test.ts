import { describe, expect, it } from 'vitest';

import type { ChainType, ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

import type { BuilderFormConfig } from '../../core/types/FormTypes';
import { FormExportSystem } from '../FormExportSystem';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';

describe('Export Structure Tests', () => {
  /**
   * Common validation function for basic project structure
   */
  async function testExportStructure(
    formConfig: BuilderFormConfig,
    contractSchema: ContractSchema,
    chainType: ChainType,
    functionName: string
  ) {
    // Create the export system
    const exportSystem = new FormExportSystem();

    // Generate export options
    const exportOptions = {
      projectName: `test-${chainType}-project`,
    };

    // Export the form
    const result = await exportSystem.exportForm(
      formConfig,
      contractSchema,
      chainType,
      functionName,
      exportOptions
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
      const { files, fileList } = await testExportStructure(
        createMinimalFormConfig('transfer'),
        createMinimalContractSchema('transfer', 'evm'),
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
      // Check for the form-renderer package as well
      expect(dependencies).toHaveProperty('@openzeppelin/transaction-form-renderer');
    });

    // REMOVED TESTS for includeAdapters true/false as the src/adapters dir is gone
  });

  describe('Chain-Specific Exports', () => {
    it('should include correct dependencies for EVM exports', async () => {
      const { files } = await testExportStructure(
        createMinimalFormConfig('transfer'),
        createMinimalContractSchema('transfer', 'evm'),
        'evm',
        'transfer'
      );

      // Verify package.json has correct adapter dependencies
      const packageJson = JSON.parse(files['package.json']);
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/transaction-form-types');
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/transaction-form-adapter-evm');
    });

    it('should include correct dependencies for Solana exports', async () => {
      const { files } = await testExportStructure(
        createMinimalFormConfig('transfer'),
        createMinimalContractSchema('transfer', 'solana'),
        'solana',
        'transfer'
      );

      // Verify package.json has correct adapter dependencies
      const packageJson = JSON.parse(files['package.json']);
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/transaction-form-types');
      expect(packageJson.dependencies).toHaveProperty(
        '@openzeppelin/transaction-form-adapter-solana'
      );
    });

    // Add tests for Stellar/Midnight if needed
  });

  describe('Project Naming and Configuration', () => {
    it('should use the provided project name in package.json', async () => {
      const customProjectName = 'custom-project-name';
      const exportSystem = new FormExportSystem();

      const result = await exportSystem.exportForm(
        createMinimalFormConfig('transfer'),
        createMinimalContractSchema('transfer', 'evm'),
        'evm',
        'transfer',
        { projectName: customProjectName }
      );

      expect(result.data).toBeDefined(); // Add check for data property
      const files = await extractFilesFromZip(result.data);
      const packageJson = JSON.parse(files['package.json']);

      expect(packageJson.name).toBe(customProjectName);
    });

    it('should generate a valid index.html file', async () => {
      const { files } = await testExportStructure(
        createMinimalFormConfig('transfer'),
        createMinimalContractSchema('transfer', 'evm'),
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
