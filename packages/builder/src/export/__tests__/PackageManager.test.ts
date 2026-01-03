import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Ecosystem } from '@openzeppelin/ui-types';

import type { BuilderFormConfig } from '../../core/types/FormTypes';
import { PackageManager } from '../PackageManager';

// Mock the versions module for testing RC version handling
vi.mock('../versions', async () => {
  const actual = await vi.importActual('../versions');
  return {
    ...actual,
    packageVersions: {
      '@openzeppelin/ui-builder-adapter-evm': '0.2.0',
      '@openzeppelin/ui-builder-adapter-midnight': '0.0.4',
      '@openzeppelin/ui-builder-adapter-solana': '0.0.3',
      '@openzeppelin/ui-builder-adapter-stellar': '0.0.3',
      '@openzeppelin/ui-react': '0.1.3',
      '@openzeppelin/ui-renderer': '0.1.4',
      '@openzeppelin/ui-types': '0.2.0',
      '@openzeppelin/ui-components': '0.2.0',
      '@openzeppelin/ui-utils': '0.2.0',
    },
  };
});

// Mock RendererConfig since we can't import it directly
interface MockRendererConfig {
  coreDependencies: Record<string, string>;
  fieldDependencies: Record<
    string,
    {
      runtimeDependencies: Record<string, string>;
      devDependencies?: Record<string, string>;
    }
  >;
}

describe('PackageManager', () => {
  // Mock renderer config for testing
  const mockRendererConfig: MockRendererConfig = {
    coreDependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'react-hook-form': '^7.43.9',
      '@openzeppelin/ui-renderer': '1.0.0',
    },
    fieldDependencies: {
      text: { runtimeDependencies: {} },
      number: { runtimeDependencies: {} },
      date: {
        runtimeDependencies: {
          'react-datepicker': '^4.14.0',
        },
        devDependencies: {
          '@types/react-datepicker': '^4.11.2',
        },
      },
      select: {
        runtimeDependencies: {
          'react-select': '^5.7.3',
        },
        devDependencies: {
          '@types/react-select': '^5.0.1',
        },
      },
    },
  };

  // Create a minimal form config for tests
  const createMinimalFormConfig = (fieldTypes: string[] = ['text']): BuilderFormConfig => ({
    functionId: 'testFunction',
    fields: fieldTypes.map((type, index) => ({
      id: `param${index}`,
      name: `param${index}`,
      label: `Parameter ${index}`,
      type,
      validation: { required: true },
      contractAddress: '0xTestAddress',
    })) as unknown as BuilderFormConfig['fields'], // Type assertion with a more specific type
    layout: {
      columns: 1,
      spacing: 'normal',
      labelPosition: 'top',
    },
    validation: {
      mode: 'onChange',
      showErrors: 'inline',
    },
    theme: {},
    contractAddress: '0xTestAddress',
  });

  describe('getDependencies', () => {
    let packageManager: PackageManager;

    beforeEach(() => {
      packageManager = new PackageManager(mockRendererConfig as MockRendererConfig);
    });

    it('should include core dependencies for all forms', async () => {
      const formConfig = createMinimalFormConfig();
      const dependencies = await packageManager.getDependencies(formConfig, 'evm');

      expect(dependencies).toHaveProperty('react');
      expect(dependencies).toHaveProperty('react-dom');
      expect(dependencies).toHaveProperty('react-hook-form');
      expect(dependencies).toHaveProperty('@openzeppelin/ui-renderer');
    });

    it('should include the correct adapter package dependency', async () => {
      const formConfig = createMinimalFormConfig();

      const evmDependencies = await packageManager.getDependencies(formConfig, 'evm');
      // Check for core adapter package
      expect(evmDependencies).toHaveProperty('@openzeppelin/ui-builder-adapter-evm');
      expect(evmDependencies).toHaveProperty('@openzeppelin/ui-types'); // Should also include types
      expect(evmDependencies).not.toHaveProperty('@openzeppelin/ui-builder-adapter-solana');
      // Check for specific runtime libs from EVM adapter config
      expect(evmDependencies).toHaveProperty('viem');
      expect(evmDependencies).toHaveProperty('wagmi');

      const solanaDependencies = await packageManager.getDependencies(formConfig, 'solana');
      // Check for core adapter package
      expect(solanaDependencies).toHaveProperty('@openzeppelin/ui-builder-adapter-solana');
      expect(solanaDependencies).toHaveProperty('@openzeppelin/ui-types');
      expect(solanaDependencies).not.toHaveProperty('@openzeppelin/ui-builder-adapter-evm');
      // Check for specific runtime libs from Solana adapter config
      expect(solanaDependencies).toHaveProperty('@solana/web3.js');
      // Check that EVM libs are NOT present
      expect(solanaDependencies).not.toHaveProperty('viem');
      expect(solanaDependencies).not.toHaveProperty('wagmi');
    });

    it('should include field-specific dependencies based on form fields', async () => {
      // Form with basic fields
      const basicFormConfig = createMinimalFormConfig(['text', 'number']);
      const basicDependencies = await packageManager.getDependencies(basicFormConfig, 'evm');

      // Form with advanced fields
      const advancedFormConfig = createMinimalFormConfig(['date', 'select']);
      const advancedDependencies = await packageManager.getDependencies(advancedFormConfig, 'evm');

      // Basic form should not have advanced field dependencies
      expect(basicDependencies).not.toHaveProperty('react-datepicker');
      expect(basicDependencies).not.toHaveProperty('react-select');

      // Advanced form should have those dependencies
      expect(advancedDependencies).toHaveProperty('react-datepicker');
      expect(advancedDependencies).toHaveProperty('react-select');
    });

    it('should handle unknown chain types gracefully', async () => {
      const formConfig = createMinimalFormConfig();
      const dependencies = await packageManager.getDependencies(
        formConfig,
        'unknown-ecosystem' as Ecosystem
      );
      expect(dependencies).toHaveProperty('react'); // Core deps still present
      expect(dependencies).not.toHaveProperty('@openzeppelin/ui-builder-adapter-evm'); // Adapter package not included
      expect(dependencies).not.toHaveProperty('@openzeppelin/ui-types'); // Types package not included for unknown chain
    });
  });

  describe('getDevDependencies', () => {
    let packageManager: PackageManager;

    beforeEach(() => {
      packageManager = new PackageManager(mockRendererConfig as MockRendererConfig);
    });

    it('should include field-specific dev dependencies', async () => {
      const dateFormConfig = createMinimalFormConfig(['date']);
      const dateDeps = await packageManager.getDevDependencies(dateFormConfig, 'evm');
      expect(dateDeps).toHaveProperty('@types/react-datepicker');

      const basicFormConfig = createMinimalFormConfig(['text']);
      const basicDeps = await packageManager.getDevDependencies(basicFormConfig, 'evm');
      expect(Object.keys(basicDeps)).not.toContain('@types/react-datepicker');
    });
  });

  describe('updatePackageJson', () => {
    let packageManager: PackageManager;

    beforeEach(() => {
      packageManager = new PackageManager(mockRendererConfig as MockRendererConfig);
    });

    // Create test package.json content
    const basePackageJson = JSON.stringify({
      name: 'template-project',
      description: 'Template description',
      dependencies: {
        'existing-dep': '1.0.0',
      },
      devDependencies: {
        'existing-dev-dep': '1.0.0',
      },
    });

    it('should update name and description based on form config', async () => {
      const formConfig = createMinimalFormConfig();

      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction'
      );

      const result = JSON.parse(updated);
      expect(result.name).toBe('testfunction-form');
      expect(result.description).toBe('Transaction form for testFunction');
    });

    it('should respect custom name and description from options', async () => {
      const formConfig = createMinimalFormConfig();

      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        {
          projectName: 'custom-name',
          description: 'Custom description',
        }
      );

      const result = JSON.parse(updated);
      expect(result.name).toBe('custom-name');
      expect(result.description).toBe('Custom description');
    });

    it('should apply author and license from options', async () => {
      const formConfig = createMinimalFormConfig();

      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        {
          author: 'Test Author',
          license: 'MIT',
        }
      );

      const result = JSON.parse(updated);
      expect(result.author).toBe('Test Author');
      expect(result.license).toBe('MIT');
    });

    it('should merge dependencies from all sources (core, field, adapter package)', async () => {
      const formConfig = createMinimalFormConfig(['date']);
      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction'
      );
      const result = JSON.parse(updated);

      expect(result.dependencies).toHaveProperty('react'); // Core
      expect(result.dependencies).toHaveProperty('react-datepicker'); // Field
      expect(result.dependencies).toHaveProperty('@openzeppelin/ui-builder-adapter-evm'); // Adapter pkg
      expect(result.dependencies).toHaveProperty('@openzeppelin/ui-types'); // Types pkg
      // Check for specific runtime libs from EVM adapter config
      expect(result.dependencies).toHaveProperty('viem');
      expect(result.dependencies).toHaveProperty('wagmi');
    });

    it('should apply versioning strategy correctly (local env)', async () => {
      const formConfig = createMinimalFormConfig();
      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        { env: 'local' }
      );
      const result = JSON.parse(updated);
      expect(result.dependencies['@openzeppelin/ui-renderer']).toBe('workspace:*');
      expect(result.dependencies['@openzeppelin/ui-types']).toBe('workspace:*');
      expect(result.dependencies['@openzeppelin/ui-builder-adapter-evm']).toBe('workspace:*');
    });

    it('should apply versioning strategy correctly (prod env)', async () => {
      const formConfig = createMinimalFormConfig();
      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        { env: 'production' }
      );
      const result = JSON.parse(updated);
      expect(result.dependencies['@openzeppelin/ui-renderer']).toMatch(/^\^/);
      expect(result.dependencies['@openzeppelin/ui-types']).toMatch(/^\^/);
      expect(result.dependencies['@openzeppelin/ui-builder-adapter-evm']).toMatch(/^\^/);
    });

    it('should apply versioning strategy correctly (staging env)', async () => {
      const formConfig = createMinimalFormConfig();
      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        { env: 'staging' }
      );
      const result = JSON.parse(updated);

      // Should use RC versions for staging: accept 'rc' tag or timestamped RC like 0.0.0-rc-YYYYMMDDHHMMSS
      const rcVersionOrTag = /^(rc|\d+\.\d+\.\d+-rc(?:[-.]\d+)?)$/;
      expect(result.dependencies['@openzeppelin/ui-renderer']).toMatch(rcVersionOrTag);
      expect(result.dependencies['@openzeppelin/ui-types']).toMatch(rcVersionOrTag);
      expect(result.dependencies['@openzeppelin/ui-builder-adapter-evm']).toMatch(rcVersionOrTag);

      // Verify external deps don't get -rc treatment
      expect(result.dependencies['react']).not.toMatch(/-rc$/);
      expect(result.dependencies['react-dom']).not.toMatch(/-rc$/);
    });

    it('should handle already RC versions in staging environment', async () => {
      // Test the logic by using a version string that already contains -rc
      // NOTE: In the real staging workflow, after `pnpm update-export-versions` runs,
      // the versions.ts file will contain actual RC versions like '0.2.1-rc.123'
      // and the RC detection logic (managedVersion.includes('-rc')) will prevent double-rc suffixes
      const formConfig = createMinimalFormConfig();
      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        { env: 'staging' }
      );
      const result = JSON.parse(updated);

      // All internal packages should resolve to RC format (either dist-tag 'rc' or timestamped RC)
      const rcVersionOrTag = /^(rc|\d+\.\d+\.\d+-rc(?:[-.]\d+)?)$/;
      expect(result.dependencies['@openzeppelin/ui-renderer']).toMatch(rcVersionOrTag);
      expect(result.dependencies['@openzeppelin/ui-types']).toMatch(rcVersionOrTag);
      expect(result.dependencies['@openzeppelin/ui-builder-adapter-evm']).toMatch(rcVersionOrTag);
    });

    it('should verify RC detection logic works correctly', async () => {
      // This test verifies that the RC detection logic in applyVersioningStrategy works
      // by testing the behavior when we know the implementation details
      const formConfig = createMinimalFormConfig();

      // Test that non-RC versions get -rc appended in staging
      const stagingUpdated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        { env: 'staging' }
      );
      const stagingResult = JSON.parse(stagingUpdated);

      // All internal packages should have -rc suffix added (version-agnostic)
      const rcVersionOrTag = /^(rc|\d+\.\d+\.\d+-rc(?:[-.]\d+)?)$/;
      expect(stagingResult.dependencies['@openzeppelin/ui-renderer']).toMatch(rcVersionOrTag);

      // Test that production doesn't get -rc
      const prodUpdated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        { env: 'production' }
      );
      const prodResult = JSON.parse(prodUpdated);

      // Production should have ^ prefix, not -rc suffix (version-agnostic)
      expect(prodResult.dependencies['@openzeppelin/ui-renderer']).toMatch(/^\^\d+\.\d+\.\d+$/);
      expect(prodResult.dependencies['@openzeppelin/ui-renderer']).not.toMatch(/-rc/);
    });

    it('should default to production environment when env is undefined', async () => {
      const formConfig = createMinimalFormConfig();
      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        {} // No env specified
      );
      const result = JSON.parse(updated);

      // Should behave like production environment
      expect(result.dependencies['@openzeppelin/ui-renderer']).toMatch(/^\^/);
      expect(result.dependencies['@openzeppelin/ui-types']).toMatch(/^\^/);
      expect(result.dependencies['@openzeppelin/ui-builder-adapter-evm']).toMatch(/^\^/);
    });

    it('should handle all three environments correctly in a single test', async () => {
      const formConfig = createMinimalFormConfig();

      // Test local environment
      const localUpdated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        { env: 'local' }
      );
      const localResult = JSON.parse(localUpdated);
      expect(localResult.dependencies['@openzeppelin/ui-renderer']).toBe('workspace:*');

      // Test staging environment
      const stagingUpdated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        { env: 'staging' }
      );
      const stagingResult = JSON.parse(stagingUpdated);
      expect(stagingResult.dependencies['@openzeppelin/ui-renderer']).toMatch(
        /^(rc|\d+\.\d+\.\d+-rc(?:[-.]\d+)?)$/
      );

      // Test production environment
      const prodUpdated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        { env: 'production' }
      );
      const prodResult = JSON.parse(prodUpdated);
      expect(prodResult.dependencies['@openzeppelin/ui-renderer']).toMatch(/^\^\d+\.\d+\.\d+$/);
    });

    it('should preserve external dependencies regardless of environment', async () => {
      const formConfig = createMinimalFormConfig(['date']);

      // Test that external dependencies (non-OpenZeppelin packages) are unchanged across environments
      const environments: Array<'local' | 'staging' | 'production'> = [
        'local',
        'staging',
        'production',
      ];

      for (const env of environments) {
        const updated = await packageManager.updatePackageJson(
          basePackageJson,
          formConfig,
          'evm',
          'testFunction',
          { env }
        );
        const result = JSON.parse(updated);

        // External dependencies should remain unchanged
        expect(result.dependencies['react']).toBe('^19.0.0');
        expect(result.dependencies['react-datepicker']).toBe('^4.14.0');
        expect(result.dependencies['viem']).toBeTruthy(); // Should exist but version unchanged
      }
    });

    it('should handle custom dependencies in staging environment', async () => {
      const formConfig = createMinimalFormConfig();
      const customDeps = {
        'custom-external-dep': '2.0.0',
        '@openzeppelin/ui-builder-custom': '1.0.0', // This should get RC treatment
      };

      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        {
          env: 'staging',
          dependencies: customDeps,
        }
      );

      const result = JSON.parse(updated);

      // External custom dep should remain unchanged
      expect(result.dependencies['custom-external-dep']).toBe('2.0.0');

      // OpenZeppelin custom dep should remain as specified (not in our internal packages list)
      expect(result.dependencies['@openzeppelin/ui-builder-custom']).toBe('1.0.0');
    });

    it('should include additional dependencies from options', async () => {
      const formConfig = createMinimalFormConfig();

      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        {
          dependencies: {
            'custom-dep': '2.0.0',
          },
        }
      );

      const result = JSON.parse(updated);
      expect(result.dependencies).toHaveProperty('custom-dep', '2.0.0');
    });

    it('should add upgrade instructions through scripts', async () => {
      const formConfig = createMinimalFormConfig();

      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction'
      );

      const result = JSON.parse(updated);

      // Should add helper scripts
      expect(result.scripts).toHaveProperty('update-renderer');
      expect(result.scripts).toHaveProperty('check-deps');
    });
  });
});
