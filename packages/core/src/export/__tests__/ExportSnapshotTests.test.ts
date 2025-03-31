import { describe, expect, it } from 'vitest';

import { FormExportSystem } from '../FormExportSystem';
import { createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';

import type { ChainType } from '../../core/types/ContractSchema';

describe('Export Snapshot Tests', () => {
  /**
   * Helper function to extract key files from the export for snapshot testing
   */
  async function getSnapshotFiles(chainType: ChainType = 'evm', functionName: string = 'transfer') {
    // Create the export system and form config
    const exportSystem = new FormExportSystem();
    const formConfig = createMinimalFormConfig(functionName, chainType);

    // Export the form with a consistent project name for snapshots
    const result = await exportSystem.exportForm(formConfig, chainType, functionName, {
      projectName: 'snapshot-test-project',
    });

    // Extract files from the ZIP using result.data
    expect(result.data).toBeDefined();
    const files = await extractFilesFromZip(result.data);

    // Return the files that should be snapshot tested
    return {
      packageJson: JSON.parse(files['package.json']),
      appComponent: files['src/App.tsx'],
      formComponent: files['src/components/GeneratedForm.tsx'],
      adapterIndex: files['src/adapters/index.ts'],
      [`adapter_${chainType}`]: files[`src/adapters/${chainType}/adapter.ts`],
    };
  }

  /**
   * Filter sensitive or variable content from snapshots to avoid false diffs
   */
  function prepareForSnapshot(content: string): string {
    if (!content) return '';

    // Replace timestamp comments that would cause snapshot diffs
    return (
      content
        .replace(/\/\/ Generated at:.*$/gm, '// Generated at: [timestamp]')
        .replace(/\/\* Generated:.*\*\//gm, '/* Generated: [timestamp] */')
        // Replace IDs in the form schema - more comprehensive UUID pattern
        .replace(
          /"id":\s*"[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"/g,
          '"id": "[id]"'
        )
        // Replace field IDs directly in content - better UUID pattern matching
        .replace(
          /id: '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'/g,
          "id: '[id]'"
        )
        // Replace fields list in sections
        .replace(/"fields":\s*\[\s*"[a-zA-Z0-9-]+"\s*\]/g, '"fields": ["testParam"]')
        // Replace other variables that might make snapshots unstable
        .replace(/version: ["'][\d.]+["']/g, 'version: "[version]"')
    );
  }

  describe('EVM Export Snapshots', () => {
    it('should match snapshot for App component', async () => {
      const files = await getSnapshotFiles('evm');
      expect(prepareForSnapshot(files.appComponent)).toMatchSnapshot('app-component-evm');
    });

    it('should match snapshot for Form component', async () => {
      const files = await getSnapshotFiles('evm');
      expect(prepareForSnapshot(files.formComponent)).toMatchSnapshot('form-component-evm');
    });

    it('should match snapshot for adapters index', async () => {
      const files = await getSnapshotFiles('evm');
      expect(prepareForSnapshot(files.adapterIndex)).toMatchSnapshot('adapter-index-evm');
    });

    it('should match snapshot for EVM adapter', async () => {
      const files = await getSnapshotFiles('evm');
      expect(prepareForSnapshot(files.adapter_evm)).toMatchSnapshot('evm-adapter');
    });

    it('should match snapshot for package.json structure', async () => {
      const files = await getSnapshotFiles('evm');

      // Only snapshot relevant parts of package.json to avoid noise
      const { dependencies, devDependencies, scripts } = files.packageJson;
      expect({ dependencies, devDependencies, scripts }).toMatchSnapshot('package-json-evm');
    });
  });

  describe('Solana Export Snapshots', () => {
    it('should match snapshot for Solana adapter', async () => {
      const files = await getSnapshotFiles('solana');
      expect(prepareForSnapshot(files.adapter_solana)).toMatchSnapshot('solana-adapter');
    });

    it('should match snapshot for adapters index with Solana', async () => {
      const files = await getSnapshotFiles('solana');
      expect(prepareForSnapshot(files.adapterIndex)).toMatchSnapshot('adapter-index-solana');
    });

    it('should match snapshot for package.json with Solana dependencies', async () => {
      const files = await getSnapshotFiles('solana');

      // Only snapshot relevant parts of package.json to avoid noise
      const { dependencies, devDependencies, scripts } = files.packageJson;
      expect({ dependencies, devDependencies, scripts }).toMatchSnapshot('package-json-solana');
    });
  });

  describe('Cross-Chain Comparison', () => {
    it('should verify form component similarities across chains', async () => {
      // Get form components for different chains
      const evmFiles = await getSnapshotFiles('evm');
      const solanaFiles = await getSnapshotFiles('solana');

      // The core form structure should be similar
      // Looking at component definition and main return elements
      const evmFormComponent = prepareForSnapshot(evmFiles.formComponent);
      const solanaFormComponent = prepareForSnapshot(solanaFiles.formComponent);

      // Both should be React components
      expect(evmFormComponent).toContain('import');
      expect(evmFormComponent).toContain("from 'react'");
      expect(solanaFormComponent).toContain('import');
      expect(solanaFormComponent).toContain("from 'react'");

      // Both should render TransactionForm
      expect(evmFormComponent).toMatch(/return\s*\([\s\S]*?<TransactionForm/);
      expect(solanaFormComponent).toMatch(/return\s*\([\s\S]*?<TransactionForm/);

      // Both should have similar form schema structures
      expect(evmFormComponent).toMatch(/const formSchema/);
      expect(solanaFormComponent).toMatch(/const formSchema/);
    });

    it('should verify App component similarities across chains', async () => {
      // Get App components for different chains
      const evmFiles = await getSnapshotFiles('evm');
      const solanaFiles = await getSnapshotFiles('solana');

      // The App component should be nearly identical across chains
      const evmAppComponent = prepareForSnapshot(evmFiles.appComponent);
      const solanaAppComponent = prepareForSnapshot(solanaFiles.appComponent);

      // Both should import and render GeneratedForm
      expect(evmAppComponent).toMatch(/import.*GeneratedForm/);
      expect(solanaAppComponent).toMatch(/import.*GeneratedForm/);

      // Both should have similar App component structure
      expect(evmAppComponent).toMatch(/function App/);
      expect(solanaAppComponent).toMatch(/function App/);
    });
  });
});
