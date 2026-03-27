/**
 * Versioning Safety Guard Tests
 *
 * These tests prevent `workspace:*` or other internal-only dependency specifiers
 * from leaking into production or staging exports. They validate that every adapter
 * registered in `adapterPackageMap` has a corresponding entry in `versions.ts`,
 * and that the versioning strategy correctly resolves dependencies for all
 * fully developed ecosystems.
 *
 * The versioning logic tests use PackageManager directly with mocked adapter configs
 * so they cover ALL ecosystems regardless of vitest ESM/CJS adapter compatibility.
 */
import { describe, expect, it, vi } from 'vitest';

import type { AdapterConfig, Ecosystem } from '@openzeppelin/ui-types';

import { adapterPackageMap } from '../../core/ecosystemManager';
import type { BuilderFormConfig } from '../../core/types/FormTypes';
import { PackageManager } from '../PackageManager';
import { packageVersions } from '../versions';

const DEVELOPED_ECOSYSTEMS: Ecosystem[] = ['evm', 'stellar', 'polkadot', 'midnight'];

const mockAdapterConfig: AdapterConfig = {
  dependencies: {
    runtime: { 'mock-runtime-dep': '^1.0.0' },
    dev: {},
    build: {},
  },
  overrides: {},
};

vi.mock('../AdapterConfigLoader', () => ({
  AdapterConfigLoader: vi.fn().mockImplementation(() => ({
    loadConfig: vi.fn().mockResolvedValue(mockAdapterConfig),
  })),
}));

const mockRendererConfig = {
  coreDependencies: {
    react: '^19.0.0',
    'react-dom': '^19.0.0',
    '@openzeppelin/ui-renderer': '1.0.0',
  },
  fieldDependencies: {
    text: { runtimeDependencies: {} },
  },
};

const basePackageJson = JSON.stringify({
  name: 'test-project',
  version: '0.1.0',
  dependencies: {},
});

const minimalFormConfig: BuilderFormConfig = {
  functionId: 'testFunction',
  fields: [
    {
      id: 'f1',
      type: 'text',
      name: 'param',
      label: 'Param',
      validation: { required: true },
    },
  ] as unknown as BuilderFormConfig['fields'],
  layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
  validation: { mode: 'onChange', showErrors: 'inline' },
  theme: {},
  contractAddress: '0xTestAddress',
};

describe('Versioning Safety Guard', () => {
  describe('versions.ts completeness', () => {
    it('should have a version entry for every adapter in adapterPackageMap', () => {
      const registeredAdapters = Object.values(adapterPackageMap);
      const versionedPackages = Object.keys(packageVersions);

      for (const adapterPkg of registeredAdapters) {
        expect(
          versionedPackages,
          `Adapter "${adapterPkg}" is registered in adapterPackageMap but missing from versions.ts. ` +
            `Run "pnpm update-export-versions" or add it manually.`
        ).toContain(adapterPkg);
      }
    });

    it('should have valid semver versions (no workspace:* or file: protocols)', () => {
      for (const [pkg, version] of Object.entries(packageVersions)) {
        expect(
          version,
          `Package "${pkg}" in versions.ts has invalid version: ${version}`
        ).not.toContain('workspace:');
        expect(
          version,
          `Package "${pkg}" in versions.ts has invalid version: ${version}`
        ).not.toContain('file:');
        expect(version, `Package "${pkg}" in versions.ts should be a plain semver version`).toMatch(
          /^\d+\.\d+\.\d+/
        );
      }
    });

    it('should include all developed ecosystem adapters', () => {
      for (const ecosystem of DEVELOPED_ECOSYSTEMS) {
        const adapterPkg = adapterPackageMap[ecosystem];
        expect(
          packageVersions,
          `Developed ecosystem "${ecosystem}" adapter "${adapterPkg}" is missing from versions.ts`
        ).toHaveProperty(adapterPkg as keyof typeof packageVersions);
      }
    });

    it('should not retain any legacy ui-builder adapter package names', () => {
      const unexpectedAdapterPackages = Object.keys(packageVersions).filter(
        (packageName) =>
          packageName.includes('adapter-') && !packageName.startsWith('@openzeppelin/adapter-')
      );

      expect(
        unexpectedAdapterPackages,
        'versions.ts must only manage extracted @openzeppelin/adapter-* package names'
      ).toEqual([]);
    });
  });

  describe('workspace:* fallback to latest', () => {
    it('should resolve to latest when an adapter has no versions.ts entry in production', async () => {
      const versionsModule = await import('../versions');
      const originalVersions = { ...versionsModule.packageVersions };
      const testAdapter = adapterPackageMap['evm'];

      // Temporarily remove the EVM adapter from packageVersions to simulate a missing entry
      delete (versionsModule.packageVersions as Record<string, string>)[testAdapter];

      try {
        const packageManager = new PackageManager(mockRendererConfig);
        const updated = await packageManager.updatePackageJson(
          basePackageJson,
          minimalFormConfig,
          'evm',
          'testFunction',
          { env: 'production' }
        );

        const result = JSON.parse(updated);
        const deps = result.dependencies || {};

        expect(
          deps[testAdapter],
          `Adapter "${testAdapter}" with no versions.ts entry should fall back to "latest" in production`
        ).toBe('latest');
        expect(deps[testAdapter]).not.toBe('workspace:*');
      } finally {
        // Restore the original version entry
        (versionsModule.packageVersions as Record<string, string>)[testAdapter] =
          originalVersions[testAdapter as keyof typeof originalVersions];
      }
    });
  });

  describe('no workspace:* in production exports', () => {
    it.each(DEVELOPED_ECOSYSTEMS)(
      'should resolve %s adapter dependency to ^semver in production',
      async (ecosystem) => {
        const packageManager = new PackageManager(mockRendererConfig);

        const updated = await packageManager.updatePackageJson(
          basePackageJson,
          minimalFormConfig,
          ecosystem,
          'testFunction',
          { env: 'production' }
        );

        const result = JSON.parse(updated);
        const deps = result.dependencies || {};
        const expectedAdapter = adapterPackageMap[ecosystem];

        expect(
          deps[expectedAdapter],
          `Production: ${ecosystem} adapter "${expectedAdapter}" resolved to "${deps[expectedAdapter]}". ` +
            `Must not be "workspace:*" — this will break end users.`
        ).not.toBe('workspace:*');

        expect(
          deps[expectedAdapter],
          `Production: ${ecosystem} adapter "${expectedAdapter}" should start with "^"`
        ).toMatch(/^\^/);

        for (const [pkg, version] of Object.entries(deps)) {
          expect(
            version,
            `Production: dependency "${pkg}" resolved to "${version}" (workspace:* is internal-only)`
          ).not.toBe('workspace:*');
          expect(
            version as string,
            `Production: dependency "${pkg}" resolved to "${version}" (file: is local-only)`
          ).not.toMatch(/^file:/);
        }
      }
    );
  });

  describe('Builder release-channel resolution (published adapters)', () => {
    it('uses npm rc dist-tag for staging when versions.ts holds a stable semver', async () => {
      const versionsModule = await import('../versions');
      const original = { ...versionsModule.packageVersions };
      const testAdapter = adapterPackageMap['evm'];
      (versionsModule.packageVersions as Record<string, string>)[testAdapter] = '1.2.3';

      try {
        const packageManager = new PackageManager(mockRendererConfig);
        const updated = await packageManager.updatePackageJson(
          basePackageJson,
          minimalFormConfig,
          'evm',
          'testFunction',
          { env: 'staging' }
        );
        const deps = JSON.parse(updated).dependencies || {};
        expect(deps[testAdapter]).toBe('rc');
      } finally {
        Object.assign(versionsModule.packageVersions, original);
      }
    });

    it('uses caret stable range in production when versions.ts holds a plain semver', async () => {
      const versionsModule = await import('../versions');
      const original = { ...versionsModule.packageVersions };
      const testAdapter = adapterPackageMap['evm'];
      (versionsModule.packageVersions as Record<string, string>)[testAdapter] = '1.2.3';

      try {
        const packageManager = new PackageManager(mockRendererConfig);
        const updated = await packageManager.updatePackageJson(
          basePackageJson,
          minimalFormConfig,
          'evm',
          'testFunction',
          { env: 'production' }
        );
        const deps = JSON.parse(updated).dependencies || {};
        expect(deps[testAdapter]).toBe('^1.2.3');
      } finally {
        Object.assign(versionsModule.packageVersions, original);
      }
    });
  });

  describe('no workspace:* in staging exports', () => {
    it.each(DEVELOPED_ECOSYSTEMS)(
      'should resolve %s adapter dependency to RC version in staging',
      async (ecosystem) => {
        const packageManager = new PackageManager(mockRendererConfig);

        const updated = await packageManager.updatePackageJson(
          basePackageJson,
          minimalFormConfig,
          ecosystem,
          'testFunction',
          { env: 'staging' }
        );

        const result = JSON.parse(updated);
        const deps = result.dependencies || {};
        const expectedAdapter = adapterPackageMap[ecosystem];

        expect(
          deps[expectedAdapter],
          `Staging: ${ecosystem} adapter "${expectedAdapter}" resolved to "${deps[expectedAdapter]}". ` +
            `Must not be "workspace:*" — this will break end users.`
        ).not.toBe('workspace:*');

        const rcVersionOrTag = /^(rc|\d+\.\d+\.\d+-rc(?:[-.]\d+)?)$/;
        expect(
          deps[expectedAdapter],
          `Staging: ${ecosystem} adapter "${expectedAdapter}" should be RC version or dist-tag`
        ).toMatch(rcVersionOrTag);

        for (const [pkg, version] of Object.entries(deps)) {
          expect(
            version,
            `Staging: dependency "${pkg}" resolved to "${version}" (workspace:* is internal-only)`
          ).not.toBe('workspace:*');
          expect(
            version as string,
            `Staging: dependency "${pkg}" resolved to "${version}" (file: is local-only)`
          ).not.toMatch(/^file:/);
        }
      }
    );
  });
});
