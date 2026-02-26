import { describe, expect, it } from 'vitest';

import type { Ecosystem, NetworkConfig } from '@openzeppelin/ui-types';

import { adapterPackageMap, getNetworksByEcosystem } from '../../core/ecosystemManager';
import { AppExportSystem } from '../AppExportSystem';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip, validateExportedProject } from '../utils/zipInspector';

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

describe('AppExportValidation', () => {
  it.each(EXPORTABLE_ECOSYSTEMS)(
    'should export a valid %s project structure',
    async (ecosystem) => {
      const networkConfig = await getFirstNetwork(ecosystem);
      const exportSystem = new AppExportSystem();
      const formConfig = createMinimalFormConfig('transfer', ecosystem);
      const contractSchema = createMinimalContractSchema('transfer', ecosystem);
      const expectedAdapter = adapterPackageMap[ecosystem];

      const result = await exportSystem.exportApp(
        formConfig,
        contractSchema,
        networkConfig,
        'transfer'
      );

      expect(result.data).toBeDefined();
      const files = await extractFilesFromZip(result.data as Blob);

      const validation = validateExportedProject(files, {
        requiredFiles: ['package.json', 'src/App.tsx', 'src/components/GeneratedForm.tsx'],
        contentValidations: {
          'package.json': (content) => {
            try {
              const pkg = JSON.parse(content);
              const deps = pkg.dependencies || {};
              if (!deps['@openzeppelin/ui-renderer'])
                return 'Missing @openzeppelin/ui-renderer dependency';
              if (!deps['@openzeppelin/ui-types'])
                return 'Missing @openzeppelin/ui-types dependency';
              if (!deps[expectedAdapter]) return `Missing ${expectedAdapter} dependency`;
              return true;
            } catch (e) {
              return `Invalid JSON in package.json: ${String(e)}`;
            }
          },
          'src/components/GeneratedForm.tsx': (content) =>
            content.includes('TransactionForm') || 'TransactionForm component not used',
          'src/App.tsx': (content) =>
            content.includes('GeneratedForm') || 'GeneratedForm not imported in App',
        },
      });

      if (validation.errors) {
        console.error(`${ecosystem} Export validation errors:`, validation.errors);
      }

      expect(validation.isValid).toBe(true);

      const packageJson = JSON.parse(files['package.json']);
      expect(packageJson).toHaveProperty('name');
      expect(packageJson).toHaveProperty('dependencies');
      expect(packageJson.dependencies).toHaveProperty(expectedAdapter);
      expect(packageJson.dependencies).toHaveProperty('@openzeppelin/ui-types');
    }
  );
});
