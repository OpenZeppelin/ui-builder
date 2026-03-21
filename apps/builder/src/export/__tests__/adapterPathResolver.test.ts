import fs from 'fs';
import { createRequire } from 'module';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import { adapterPackageMap } from '../../core/ecosystemManager';
import {
  adapterPackageNames,
  getAdapterPackageDirectoryName,
  isAdapterPackageName,
} from '../shared/adapterPackageSources';

const { resolveLocalAdaptersRoot, resolveAdapterPatchesDir } = createRequire(import.meta.url)(
  '../shared/adapterPathResolver.cjs'
);

function createPackage(rootDir: string, packageName: string, withPatches = false): string {
  const packageDir = path.join(rootDir, 'packages', getAdapterPackageDirectoryName(packageName));
  fs.mkdirSync(packageDir, { recursive: true });
  fs.writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify({ name: packageName }));

  if (withPatches) {
    const patchesDir = path.join(packageDir, 'patches');
    fs.mkdirSync(patchesDir, { recursive: true });
    fs.writeFileSync(path.join(patchesDir, 'example.patch'), 'diff --git a/file b/file');
  }

  return packageDir;
}

describe('adapter path resolver contract', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const tempDir of tempDirs) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('keeps adapter package names aligned with ecosystemManager', () => {
    expect(new Set(adapterPackageNames)).toEqual(new Set(Object.values(adapterPackageMap)));
  });

  it('exposes a consistent type guard for known and unknown adapter packages', () => {
    expect(isAdapterPackageName('@openzeppelin/adapter-evm')).toBe(true);
    expect(isAdapterPackageName('@openzeppelin/not-an-adapter')).toBe(false);
    expect(getAdapterPackageDirectoryName('@openzeppelin/adapter-midnight')).toBe(
      'adapter-midnight'
    );
    expect(() => getAdapterPackageDirectoryName('@openzeppelin/not-an-adapter')).toThrow(
      'Unknown adapter package: @openzeppelin/not-an-adapter'
    );
  });

  it('prefers LOCAL_ADAPTERS_PATH over the default sibling checkout', () => {
    const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'adapter-path-resolver-'));
    tempDirs.push(sandboxRoot);

    const monorepoRoot = path.join(sandboxRoot, 'ui-builder');
    const siblingAdaptersRoot = path.join(sandboxRoot, 'openzeppelin-adapters');
    const explicitAdaptersRoot = path.join(sandboxRoot, 'custom-adapters');

    fs.mkdirSync(monorepoRoot, { recursive: true });
    createPackage(siblingAdaptersRoot, '@openzeppelin/adapter-evm');
    createPackage(explicitAdaptersRoot, '@openzeppelin/adapter-evm');

    const resolved = resolveLocalAdaptersRoot(monorepoRoot, explicitAdaptersRoot);
    expect(resolved).toBe(path.resolve(explicitAdaptersRoot));
  });

  it('falls back to the legacy workspace when Midnight patches are only in ui-builder', () => {
    const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'adapter-path-resolver-'));
    tempDirs.push(sandboxRoot);

    const monorepoRoot = path.join(sandboxRoot, 'ui-builder');
    fs.mkdirSync(monorepoRoot, { recursive: true });
    createPackage(monorepoRoot, '@openzeppelin/adapter-midnight', true);

    const resolvedPatchesDir = resolveAdapterPatchesDir(
      monorepoRoot,
      '@openzeppelin/adapter-midnight',
      path.join(sandboxRoot, 'missing-adapters')
    );

    expect(resolvedPatchesDir).toBe(
      path.join(monorepoRoot, 'packages', 'adapter-midnight', 'patches')
    );
  });
});
