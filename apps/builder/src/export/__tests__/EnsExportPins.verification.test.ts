import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { getNetworksByEcosystem } from '../../core/ecosystemManager';
import { AppExportSystem } from '../AppExportSystem';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';

describe('ENS export dependency pins (production)', () => {
  it('pins ui-types ^3.3.0, viem ^2.35.0, adapter-evm ^2.3.0 and ships .npmrc + vite interop', async () => {
    const networks = await getNetworksByEcosystem('evm');
    const networkConfig = networks.find((n) => n.id === 'ethereum-mainnet') ?? networks[0];
    expect(networkConfig).toBeDefined();

    const exportSystem = new AppExportSystem();
    const formConfig = createMinimalFormConfig('transfer', 'evm');
    const contractSchema = createMinimalContractSchema('transfer', 'evm');

    const result = await exportSystem.exportApp(
      formConfig,
      contractSchema,
      networkConfig,
      'transfer',
      { projectName: 'ens-export-verify', env: 'production' }
    );

    const files = await extractFilesFromZip(result.data);
    const packageJson = JSON.parse(files['package.json']);
    const deps = packageJson.dependencies as Record<string, string>;

    expect(deps['@openzeppelin/ui-types']).toBe('^3.3.0');
    expect(deps['viem']).toBe('^2.35.0');
    expect(deps['@openzeppelin/adapter-evm']).toBe('^2.3.0');
    expect(deps['@openzeppelin/ui-components']).toBe('^3.5.0');
    expect(deps['@openzeppelin/ui-renderer']).toBe('^3.3.0');
    expect(deps['@openzeppelin/ui-react']).toBe('^3.2.0');
    expect(deps['eventemitter3']).toBe('^5.0.1');
    expect(deps['debug']).toBe('^4.3.7');

    expect(files['.npmrc']).toBeDefined();
    expect(files['.npmrc']).toContain('public-hoist-pattern[]=eventemitter3');
    expect(files['.npmrc']).toContain('public-hoist-pattern[]=debug');
    expect(files['.npmrc']).toContain('public-hoist-pattern[]=@wagmi/connectors');

    expect(files['vite.config.ts']).toContain('eventemitter3');
    expect(files['vite.config.ts']).toContain("'debug'");

    const mainTsx = files['src/main.tsx'];
    expect(mainTsx).toContain('enableMainnetL1MissFallback: true');
    expect(mainTsx).toContain('NameResolverBridge');
    expect(mainTsx).toContain('NameResolverProvider');
    expect(mainTsx).toContain('useRuntimeNameResolver');

    // Materialize for install/boot verification (written under tmp for the follow-up shell step)
    const outDir = path.join(tmpdir(), `ui-builder-ens-export-${Date.now()}`);
    mkdirSync(outDir, { recursive: true });
    for (const [filePath, content] of Object.entries(files)) {
      const abs = path.join(outDir, filePath);
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, content, 'utf8');
    }
    writeFileSync(path.join(tmpdir(), 'ui-builder-ens-export-last-dir.txt'), outDir, 'utf8');

    // Keep the artifact for the shell install step; do not rmSync here.
    expect(outDir).toBeTruthy();
  }, 120_000);
});
