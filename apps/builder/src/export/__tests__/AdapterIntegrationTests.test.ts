import { beforeEach, describe, expect, it } from 'vitest';

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

describe('Adapter Integration Tests', () => {
  let exportSystem: AppExportSystem;

  beforeEach(() => {
    exportSystem = new AppExportSystem();
  });

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
    it.each(EXPORTABLE_ECOSYSTEMS)(
      'should include correct adapter dependency for %s in package.json',
      async (ecosystem) => {
        const networkConfig = await getFirstNetwork(ecosystem);
        const { packageJson } = await getExportedPackageJson(networkConfig);
        const expectedAdapter = adapterPackageMap[ecosystem];

        expect(packageJson.dependencies).toHaveProperty('@openzeppelin/ui-types');
        expect(packageJson.dependencies).toHaveProperty(expectedAdapter);
      }
    );

    it.each(EXPORTABLE_ECOSYSTEMS)(
      'should not include adapters from other ecosystems in %s export',
      async (ecosystem) => {
        const networkConfig = await getFirstNetwork(ecosystem);
        const { packageJson } = await getExportedPackageJson(networkConfig);
        const expectedAdapter = adapterPackageMap[ecosystem];

        for (const [otherEcosystem, otherAdapter] of Object.entries(adapterPackageMap)) {
          if (otherEcosystem !== ecosystem) {
            expect(
              packageJson.dependencies,
              `${ecosystem} export should not contain adapter for ${otherEcosystem}`
            ).not.toHaveProperty(otherAdapter);
          }
        }

        expect(packageJson.dependencies).toHaveProperty(expectedAdapter);
      }
    );
  });
});
