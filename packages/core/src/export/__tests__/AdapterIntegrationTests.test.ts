import { beforeEach, describe, expect, it } from 'vitest';

import { FormExportSystem } from '../FormExportSystem';
import { createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';

import type { ChainType } from '../../core/types/ContractSchema';

describe('Adapter Integration Tests', () => {
  let exportSystem: FormExportSystem;

  beforeEach(() => {
    exportSystem = new FormExportSystem();
  });

  /**
   * Helper function to extract adapter files from an export
   */
  async function extractAdapterFiles(chainType: ChainType, functionName: string = 'transfer') {
    // Create form config
    const formConfig = createMinimalFormConfig(functionName, chainType);

    // Export the form
    const result = await exportSystem.exportForm(formConfig, chainType, functionName);

    // Extract files from the ZIP
    const files = await extractFilesFromZip(result.zipBlob);

    // Get adapter files
    const adapterFiles = Object.keys(files)
      .filter((path) => path.startsWith('src/adapters/'))
      .reduce(
        (acc, path) => {
          acc[path] = files[path];
          return acc;
        },
        {} as Record<string, string>
      );

    return {
      adapterFiles,
      allFiles: files,
    };
  }

  describe('Adapter File Structure', () => {
    it('should include the correct adapter files for EVM chains', async () => {
      const { adapterFiles } = await extractAdapterFiles('evm');

      // Check essential adapter files
      expect(adapterFiles).toHaveProperty('src/adapters/index.ts');
      expect(adapterFiles).toHaveProperty('src/adapters/evm/adapter.ts');

      // Check number of adapter files
      // EVM typically has adapter.ts and types.ts
      expect(Object.keys(adapterFiles).filter((f) => f.includes('evm/'))).toHaveLength(2);
    });

    it('should include the correct adapter files for Solana chains', async () => {
      const { adapterFiles } = await extractAdapterFiles('solana');

      // Check essential adapter files
      expect(adapterFiles).toHaveProperty('src/adapters/index.ts');
      expect(adapterFiles).toHaveProperty('src/adapters/solana/adapter.ts');
    });

    it('should not include other chain adapters when not needed', async () => {
      const { adapterFiles } = await extractAdapterFiles('evm');

      // Make sure there are no files for other chains
      const hasOtherChains = Object.keys(adapterFiles).some(
        (path) =>
          path.includes('/solana/') || path.includes('/stellar/') || path.includes('/midnight/')
      );

      expect(hasOtherChains).toBe(false);
    });
  });

  describe('Adapter Content Validation', () => {
    it('should generate a valid EVM adapter implementation', async () => {
      const { adapterFiles } = await extractAdapterFiles('evm');

      const adapterCode = adapterFiles['src/adapters/evm/adapter.ts'];
      expect(adapterCode).toBeDefined();

      // Check for class definition
      expect(adapterCode).toMatch(/export (default )?(class|const) (\w+)Adapter/);

      // Check for essential adapter methods
      expect(adapterCode).toMatch(/loadContract\s*\(/);
      expect(adapterCode).toMatch(/signAndBroadcast\s*\(/);
    });

    it('should generate a valid Solana adapter implementation', async () => {
      const { adapterFiles } = await extractAdapterFiles('solana');

      const adapterCode = adapterFiles['src/adapters/solana/adapter.ts'];
      expect(adapterCode).toBeDefined();

      // Check for class definition
      expect(adapterCode).toMatch(/export (default )?(class|const) (\w+)Adapter/);

      // Check for essential adapter methods
      expect(adapterCode).toMatch(/loadContract\s*\(/);
      expect(adapterCode).toMatch(/signAndBroadcast\s*\(/);
    });

    it('should export adapters correctly in index.ts', async () => {
      const { adapterFiles } = await extractAdapterFiles('evm');

      const indexCode = adapterFiles['src/adapters/index.ts'];
      expect(indexCode).toBeDefined();

      // Check for adapter export
      expect(indexCode).toMatch(/import.*from ['"]\.\/evm\/adapter['"]/);
      expect(indexCode).toMatch(/export \{.*EvmAdapter.*\}/);
    });
  });

  describe('Adapter Type Definitions', () => {
    it('should include proper TypeScript types in EVM adapter', async () => {
      const { adapterFiles } = await extractAdapterFiles('evm');

      // Check types file exists
      const hasTypesFile = Object.keys(adapterFiles).some(
        (path) => path.includes('/evm/') && path.includes('types.ts')
      );

      expect(hasTypesFile).toBe(true);

      // If there's a types file, check its content
      if (hasTypesFile) {
        const typesPath = Object.keys(adapterFiles).find(
          (path) => path.includes('/evm/') && path.includes('types.ts')
        );

        if (typesPath) {
          const typesCode = adapterFiles[typesPath];

          // Check for type/interface definitions
          expect(typesCode).toMatch(/type|interface/);
          expect(typesCode).toMatch(/export/);
        }
      }

      // Check adapter file imports types
      const adapterCode = adapterFiles['src/adapters/evm/adapter.ts'];
      expect(adapterCode).toMatch(/import.*from ['"](\.\/types|\.\/types\.ts)['"]/);
    });
  });

  describe('Adapter Function Tests', () => {
    it('should implement ContractAdapter interface', async () => {
      const { adapterFiles } = await extractAdapterFiles('evm');

      const adapterCode = adapterFiles['src/adapters/evm/adapter.ts'];

      // Check for ContractAdapter interface implementation
      expect(adapterCode).toMatch(
        /implements ContractAdapter|extends ContractAdapter|as ContractAdapter/
      );
    });

    it('should include contract interaction functionality', async () => {
      const { adapterFiles } = await extractAdapterFiles('evm');

      const adapterCode = adapterFiles['src/adapters/evm/adapter.ts'];

      // Check for contract interaction functionality
      expect(adapterCode).toMatch(/loadContract/);
      expect(adapterCode).toMatch(/formatTransactionData/);
      expect(adapterCode).toMatch(/signAndBroadcast/);
    });

    it('should include field generation and validation', async () => {
      const { adapterFiles } = await extractAdapterFiles('evm');

      const adapterCode = adapterFiles['src/adapters/evm/adapter.ts'];

      // Check for form field generation functionality
      expect(adapterCode).toMatch(/mapParameterTypeToFieldType/);
      expect(adapterCode).toMatch(/generateDefaultField/);
      expect(adapterCode).toMatch(/validation/i);
    });
  });

  describe('Package.json Adapter Dependencies', () => {
    it('should include correct dependencies for EVM in package.json', async () => {
      const { allFiles } = await extractAdapterFiles('evm');

      const packageJson = JSON.parse(allFiles['package.json']);

      // Check EVM-specific dependencies
      expect(packageJson.dependencies).toHaveProperty('ethers');
    });

    it('should include correct dependencies for Solana in package.json', async () => {
      const { allFiles } = await extractAdapterFiles('solana');

      const packageJson = JSON.parse(allFiles['package.json']);

      // Check for Solana-related dependencies
      const hasSolanaDependency = Object.keys(packageJson.dependencies).some(
        (dep) => dep.includes('@solana') || dep.includes('solana')
      );

      expect(hasSolanaDependency).toBe(true);
    });
  });
});
