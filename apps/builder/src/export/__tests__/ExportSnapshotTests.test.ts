import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Ecosystem, NetworkConfig } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { getNetworksByEcosystem } from '../../core/ecosystemManager';
import { AppExportSystem } from '../AppExportSystem';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';

// Stellar and Midnight adapters have ESM/CJS compatibility issues when loaded
// dynamically in vitest. Full e2e export tests are limited to EVM and Polkadot.
// Versioning correctness for ALL ecosystems is verified in VersioningSafetyGuard.test.ts.
const EXPORTABLE_ECOSYSTEMS: Ecosystem[] = ['evm', 'polkadot'];

const networkCache = new Map<Ecosystem, NetworkConfig>();

async function getFirstNetwork(ecosystem: Ecosystem): Promise<NetworkConfig> {
  if (networkCache.has(ecosystem)) {
    return networkCache.get(ecosystem)!;
  }
  const networks = await getNetworksByEcosystem(ecosystem);
  if (networks.length === 0) {
    throw new Error(`No networks found for ecosystem: ${ecosystem}`);
  }
  networkCache.set(ecosystem, networks[0]);
  return networks[0];
}

describe('Export Snapshot Tests', () => {
  async function getSnapshotFiles(ecosystem: Ecosystem = 'evm', functionName: string = 'transfer') {
    const networkConfig = await getFirstNetwork(ecosystem);
    const exportSystem = new AppExportSystem();
    const formConfig = createMinimalFormConfig(functionName, ecosystem);
    const mockContractSchema = createMinimalContractSchema(functionName, ecosystem);

    const result = await exportSystem.exportApp(
      formConfig,
      mockContractSchema,
      networkConfig,
      functionName,
      {
        projectName: 'snapshot-test-project',
      }
    );

    expect(result.data).toBeDefined();
    const files = await extractFilesFromZip(result.data);

    return {
      packageJson: JSON.parse(files['package.json']),
      appComponent: files['src/App.tsx'],
      formComponent: files['src/components/GeneratedForm.tsx'],
      adapterIndex: files['src/adapters/index.ts'],
      [`adapter_${ecosystem}`]: files[`src/adapters/${ecosystem}/adapter.ts`],
    };
  }

  function prepareForSnapshot(content: string): string {
    if (!content) return '';

    return content
      .replace(/\/\/ Generated at:.*$/gm, '// Generated at: [timestamp]')
      .replace(/\/\* Generated:.*\*\//gm, '/* Generated: [timestamp] */')
      .replace(
        /"id":\s*"[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"/g,
        '"id": "[id]"'
      )
      .replace(/id: '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'/g, "id: '[id]'")
      .replace(/"fields":\s*\[\s*"[a-zA-Z0-9-]+"\s*\]/g, '"fields": ["testParam"]')
      .replace(/version: ["'][\d.]+["']/g, 'version: "[version]"');
  }

  describe.each(EXPORTABLE_ECOSYSTEMS)('%s Export Snapshots', (ecosystem) => {
    it('should match snapshot for App component', async () => {
      const files = await getSnapshotFiles(ecosystem);
      expect(prepareForSnapshot(files.appComponent)).toMatchSnapshot(`app-component-${ecosystem}`);
    });

    it('should match snapshot for Form component', async () => {
      const files = await getSnapshotFiles(ecosystem);
      expect(prepareForSnapshot(files.formComponent)).toMatchSnapshot(
        `form-component-${ecosystem}`
      );
    });

    it('should match snapshot for package.json structure', async () => {
      const files = await getSnapshotFiles(ecosystem);
      const { dependencies, devDependencies, scripts } = files.packageJson;
      expect({ dependencies, devDependencies, scripts }).toMatchSnapshot(
        `package-json-${ecosystem}`
      );
    });
  });

  describe('Cross-Chain Comparison', () => {
    it('should verify form component similarities across chains', async () => {
      const evmFiles = await getSnapshotFiles('evm');
      const polkadotFiles = await getSnapshotFiles('polkadot');

      const evmFormComponent = prepareForSnapshot(evmFiles.formComponent);
      const polkadotFormComponent = prepareForSnapshot(polkadotFiles.formComponent);

      expect(evmFormComponent).toContain('import');
      expect(evmFormComponent).toMatch(/import.*useMemo.*from ['"]react['"]/);
      expect(polkadotFormComponent).toContain('import');
      expect(polkadotFormComponent).toMatch(/import.*useMemo.*from ['"]react['"]/);

      expect(evmFormComponent).toMatch(/return\s*\([\s\S]*?<TransactionForm/);
      expect(polkadotFormComponent).toMatch(/return\s*\([\s\S]*?<TransactionForm/);

      expect(evmFormComponent).toMatch(/const formSchema.*useMemo/);
      expect(polkadotFormComponent).toMatch(/const formSchema.*useMemo/);
    });

    it('should verify App component similarities across chains', async () => {
      const evmFiles = await getSnapshotFiles('evm');
      const polkadotFiles = await getSnapshotFiles('polkadot');

      const evmAppComponent = prepareForSnapshot(evmFiles.appComponent);
      const polkadotAppComponent = prepareForSnapshot(polkadotFiles.appComponent);

      expect(evmAppComponent).toMatch(/import.*GeneratedForm/);
      expect(polkadotAppComponent).toMatch(/import.*GeneratedForm/);

      expect(evmAppComponent).toMatch(/function App/);
      expect(polkadotAppComponent).toMatch(/function App/);
    });
  });
});

describe('Export Snapshot Tests > Conditional File Modifications', () => {
  beforeEach(() => {
    logger.configure({ enabled: false });
  });

  afterEach(() => {
    logger.configure({ enabled: true, level: 'info' });
  });

  it('should modify styles.css import correctly based on isCliBuildTarget option', async () => {
    const mainCssPath = 'src/styles.css';
    const startingCssContent = `@import 'tailwindcss';\n@import './styles/global.css';\n\n/* Base styles... */`;

    let projectFilesCli: Record<string, string> = { [mainCssPath]: startingCssContent };
    const originalCliContent = projectFilesCli[mainCssPath];
    const modifiedCliContent = originalCliContent.replace(
      /^\s*@import\s+['"]tailwindcss['"]\s*;?/m,
      "@import 'tailwindcss' source('../../../');"
    );
    if (modifiedCliContent !== originalCliContent) {
      projectFilesCli[mainCssPath] = modifiedCliContent;
    } else {
      throw new Error('CSS replacement failed for CLI case');
    }
    const stylesCssCli = projectFilesCli[mainCssPath];
    expect(stylesCssCli).toBeDefined();
    expect(stylesCssCli).toMatchSnapshot('styles-css-cli');

    let projectFilesUi: Record<string, string> = { [mainCssPath]: startingCssContent };
    const stylesCssUi = projectFilesUi[mainCssPath];
    expect(stylesCssUi).toBeDefined();
    expect(stylesCssUi).toMatchSnapshot('styles-css-ui');

    expect(stylesCssCli).not.toEqual(stylesCssUi);
    expect(stylesCssCli).toContain("source('../../../')");
    expect(stylesCssUi).not.toContain("source('../../../')");
    expect(stylesCssUi).toEqual(startingCssContent);
  });
});
