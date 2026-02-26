import { describe, expect, it } from 'vitest';

import type { Ecosystem, NetworkConfig } from '@openzeppelin/ui-types';

import { adapterPackageMap, getNetworksByEcosystem } from '../../core/ecosystemManager';
import { AppExportSystem } from '../AppExportSystem';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';

// Stellar and Midnight adapters have ESM/CJS compatibility issues when loaded
// dynamically in vitest. Full e2e export tests are limited to EVM and Polkadot.
// Versioning correctness for ALL ecosystems is verified in VersioningSafetyGuard.test.ts.
const EXPORTABLE_ECOSYSTEMS: Ecosystem[] = ['evm', 'polkadot'];

async function getFirstNetwork(ecosystem: Ecosystem): Promise<NetworkConfig> {
  const networks = await getNetworksByEcosystem(ecosystem);
  if (networks.length === 0) {
    throw new Error(`No networks found for ecosystem: ${ecosystem}`);
  }
  return networks[0];
}

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

  expect(result.data).toBeDefined();
  const files = await extractFilesFromZip(result.data);
  const fileList = Object.keys(files).sort();

  return { files, fileList };
}

describe('Export Structure Tests', () => {
  describe('Basic Project Structure', () => {
    it('should include standard project files in all exports', async () => {
      const networkConfig = await getFirstNetwork('evm');
      const { files, fileList } = await testExportStructure(networkConfig);

      const requiredCoreFiles = [
        'package.json',
        'src/App.tsx',
        'src/components/GeneratedForm.tsx',
        'src/main.tsx',
      ];

      for (const file of requiredCoreFiles) {
        expect(fileList).toContain(file);
      }

      const packageJson = JSON.parse(files['package.json']);
      expect(packageJson).toHaveProperty('name');
      expect(packageJson).toHaveProperty('version');
      expect(packageJson).toHaveProperty('dependencies');
      expect(packageJson).toHaveProperty('scripts');
      expect(packageJson.scripts).toHaveProperty('dev');
      expect(packageJson.scripts).toHaveProperty('build');

      const dependencies = packageJson.dependencies;
      expect(dependencies).toHaveProperty('react');
      expect(dependencies).toHaveProperty('react-dom');
      expect(dependencies).toHaveProperty('@openzeppelin/ui-renderer');
    });

    it('should include .gitignore file with node_modules entry', async () => {
      const networkConfig = await getFirstNetwork('evm');
      const { files, fileList } = await testExportStructure(networkConfig);

      expect(fileList).toContain('.gitignore');

      const gitignoreContent = files['.gitignore'];
      expect(gitignoreContent).toBeDefined();
      expect(gitignoreContent).toContain('node_modules');
    });
  });

  describe('Chain-Specific Exports', () => {
    it.each(EXPORTABLE_ECOSYSTEMS)(
      'should include correct dependencies for %s exports',
      async (ecosystem) => {
        const networkConfig = await getFirstNetwork(ecosystem);
        const { files } = await testExportStructure(networkConfig);
        const expectedAdapter = adapterPackageMap[ecosystem];

        const packageJson = JSON.parse(files['package.json']);
        expect(packageJson.dependencies).toHaveProperty('@openzeppelin/ui-types');
        expect(packageJson.dependencies).toHaveProperty(expectedAdapter);
      }
    );
  });

  describe('Project Naming and Configuration', () => {
    it('should use the provided project name in package.json', async () => {
      const customProjectName = 'custom-project-name';
      const exportSystem = new AppExportSystem();
      const networkConfig = await getFirstNetwork('evm');

      const result = await exportSystem.exportApp(
        createMinimalFormConfig('transfer'),
        createMinimalContractSchema('transfer', 'evm'),
        networkConfig,
        'transfer',
        { projectName: customProjectName }
      );

      expect(result.data).toBeDefined();
      const files = await extractFilesFromZip(result.data);
      const packageJson = JSON.parse(files['package.json']);

      expect(packageJson.name).toBe(customProjectName);
    });

    it('should generate a valid index.html file', async () => {
      const networkConfig = await getFirstNetwork('evm');
      const { files } = await testExportStructure(networkConfig);

      expect(files['index.html']).toBeDefined();
      expect(files['index.html']).toMatch(/<!doctype html>/i);
      expect(files['index.html']).toContain('<html');
      expect(files['index.html']).toContain('<body');
      expect(files['index.html']).toContain('</html>');
      expect(files['index.html']).toMatch(/<div id=["']root["']/);
      expect(files['index.html']).toMatch(/src=["'].*main/);
    });
  });
});
