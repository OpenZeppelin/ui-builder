import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { getNetworksByEcosystem } from '../../core/ecosystemManager';
import { AppExportSystem } from '../AppExportSystem';
import { EXTERNAL_DEPENDENCY_FLOORS } from '../dependencyFloors';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';
import { packageVersions } from '../versions';

describe('ENS export dependency pins (production)', () => {
  it('pins the declared package versions and ships .npmrc + vite interop', async () => {
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

    // Assert against the declared sources of truth rather than duplicating the
    // version literals here. `packageVersions` is maintained by
    // `pnpm run update-export-versions`, so hardcoding them made every release
    // fail this test and, in turn, block that script's own snapshot refresh.
    for (const name of [
      '@openzeppelin/ui-types',
      '@openzeppelin/adapter-evm',
      '@openzeppelin/ui-components',
      '@openzeppelin/ui-renderer',
      '@openzeppelin/ui-react',
    ] as const) {
      expect(deps[name], name).toBe(`^${packageVersions[name]}`);
    }

    // viem is a floor rather than a published-version pin.
    expect(deps['viem']).toBe(EXTERNAL_DEPENDENCY_FLOORS.viem);

    expect(files['.npmrc']).toBeDefined();
    expect(files['.npmrc']).toContain('public-hoist-pattern[]=eventemitter3');
    expect(files['.npmrc']).toContain('public-hoist-pattern[]=debug');
    expect(files['.npmrc']).toContain('public-hoist-pattern[]=@wagmi/connectors');

    expect(files['vite.config.ts']).toContain('eventemitter3');
    expect(files['vite.config.ts']).not.toContain("'debug'");

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
