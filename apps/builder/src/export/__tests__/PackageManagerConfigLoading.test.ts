/**
 * PackageManagerConfigLoading.test.ts
 *
 * This file tests the configuration loading mechanism of the PackageManager class.
 *
 * The PackageManager is responsible for managing dependencies in exported form projects.
 * It dynamically loads adapter configurations for different blockchain types and form field
 * configurations, which makes it complex to test properly.
 *
 * KEY TESTING CHALLENGES:
 * 1. Mocking Vite's import.meta.glob for dynamic configuration loading
 * 2. Properly typing form configurations to match expected interfaces
 * 3. Testing dependencies resolution across different blockchain types
 * 4. Validating package.json updates with the correct dependencies
 */
// Mock declarations must come before imports
import { describe, expect, it, vi } from 'vitest';

import type { RendererConfig } from '@openzeppelin/ui-renderer';
import { Ecosystem } from '@openzeppelin/ui-types';

import type { BuilderFormConfig } from '../../core/types/FormTypes';
import { PackageManager } from '../PackageManager';

vi.mock('virtual:adapter-configs', () => {
  const adapterConfigs = {
    evm: {
      dependencies: {
        runtime: {
          viem: '^1.10.9',
        },
        dev: {},
      },
    },
    solana: {
      dependencies: {
        runtime: {
          '@solana/web3.js': '^1.73.0',
        },
        dev: {
          '@types/bn.js': '^5.1.1',
        },
      },
    },
  };
  return { adapterConfigs };
});

vi.mock('virtual:renderer-config', () => {
  const rendererConfig = {
    coreDependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      '@openzeppelin/ui-renderer': '^1.0.0',
    },
    fieldDependencies: {
      text: { runtimeDependencies: {} },
      date: {
        runtimeDependencies: { 'react-datepicker': '^4.14.0' },
        devDependencies: { '@types/react-datepicker': '^4.11.2' },
      },
    },
  };
  return { rendererConfig };
});

/**
 * Mock renderer configuration that defines dependencies for specific field types.
 * This mimics what would be loaded from the renderer package's config.
 */
const mockRendererConfig: RendererConfig = {
  coreDependencies: {
    react: '^19.0.0',
    'react-dom': '^19.0.0',
    '@openzeppelin/ui-renderer': '^1.0.0',
  },
  fieldDependencies: {
    text: { runtimeDependencies: {} },
    date: {
      runtimeDependencies: { 'react-datepicker': '^4.14.0' },
      devDependencies: { '@types/react-datepicker': '^4.11.2' },
    },
  },
};

const createMinimalFormConfig = (fieldTypes: string[] = ['text']): BuilderFormConfig => ({
  functionId: 'testFunction',
  fields: fieldTypes.map((type, index) => ({
    id: `field${index}`,
    name: `field${index}`,
    label: `Field ${index}`,
    type,
    validation: { required: true },
  })) as unknown as BuilderFormConfig['fields'], // Type assertion needed
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

describe('PackageManager configuration loading', () => {
  // Accept either the 'rc' dist-tag or timestamped RC variants like "0.0.0-rc-20250813180014"
  const rcVersionOrTag = /^(rc|\d+\.\d+\.\d+-rc(?:[-.]\d+)?)$/;
  /**
   * This test suite focuses on testing the PackageManager with configurations
   * passed directly to the constructor, bypassing the dynamic loading mechanism.
   * This approach allows us to test the core functionality without relying on
   * the mocked import.meta.glob.
   */
  describe('Using constructor injection', () => {
    it('should properly load renderer config from constructor', async () => {
      const packageManager = new PackageManager(mockRendererConfig);
      const dependencies = await packageManager.getDependencies(createMinimalFormConfig(), 'evm');
      expect(dependencies).toHaveProperty('react', '^19.0.0');
      expect(dependencies).toHaveProperty('@openzeppelin/ui-renderer', 'workspace:*');
    });

    it('should include field-specific dependencies based on form config', async () => {
      const packageManager = new PackageManager(mockRendererConfig);
      const formConfig = createMinimalFormConfig(['text', 'date']);
      const dependencies = await packageManager.getDependencies(formConfig, 'evm');
      expect(dependencies).toHaveProperty('react-datepicker', '^4.14.0');
    });

    it('should properly update package.json with dependencies', async () => {
      const packageManager = new PackageManager(mockRendererConfig);
      const formConfig = createMinimalFormConfig(['date']);
      const basePackageJson = JSON.stringify({ name: 'test', version: '0.1.0' });
      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'func1'
      );
      const result = JSON.parse(updated);
      expect(result.dependencies).toHaveProperty('react-datepicker');
      expect(result.dependencies).toHaveProperty('@openzeppelin/ui-builder-adapter-evm');
    });

    it('should handle dev dependencies correctly', async () => {
      const packageManager = new PackageManager(mockRendererConfig);
      const formConfig = createMinimalFormConfig(['date']);
      const devDependencies = await packageManager.getDevDependencies(formConfig, 'evm');
      expect(devDependencies).toHaveProperty('@types/react-datepicker', '^4.11.2');
    });

    it('should apply correct versioning for local environment', async () => {
      const packageManager = new PackageManager(mockRendererConfig);
      const formConfig = createMinimalFormConfig();
      const basePackageJson = JSON.stringify({ name: 'test', version: '0.1.0' });
      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'func1',
        { env: 'local' }
      );
      const result = JSON.parse(updated);
      // UI packages from openzeppelin-ui use file: protocol for local development
      expect(result.dependencies['@openzeppelin/ui-types']).toMatch(/^file:.*\/packages\/types$/);
      // Adapter packages still use workspace:* (they're in contracts-ui-builder monorepo)
      expect(result.dependencies['@openzeppelin/ui-builder-adapter-evm']).toBe('workspace:*');
    });

    it('should apply correct versioning for staging environment', async () => {
      const packageManager = new PackageManager(mockRendererConfig);
      const formConfig = createMinimalFormConfig();
      const basePackageJson = JSON.stringify({ name: 'test', version: '0.1.0' });
      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'func1',
        { env: 'staging' }
      );
      const result = JSON.parse(updated);
      // UI packages from openzeppelin-ui use stable versions (no RC pipeline)
      expect(result.dependencies['@openzeppelin/ui-types']).toMatch(/^\^/);
      // Adapter packages use RC versions for staging
      expect(result.dependencies['@openzeppelin/ui-builder-adapter-evm']).toMatch(rcVersionOrTag);

      // External dependencies should remain unchanged
      expect(result.dependencies['react']).toBe('^19.0.0');
    });

    it('should handle three environments consistently', async () => {
      const packageManager = new PackageManager(mockRendererConfig);
      const formConfig = createMinimalFormConfig();
      const basePackageJson = JSON.stringify({ name: 'test', version: '0.1.0' });

      // Test all three environments
      const environments: Array<'local' | 'staging' | 'production'> = [
        'local',
        'staging',
        'production',
      ];
      const results = await Promise.all(
        environments.map((env) =>
          packageManager.updatePackageJson(basePackageJson, formConfig, 'evm', 'func1', { env })
        )
      );

      const [localResult, stagingResult, prodResult] = results.map((r) => JSON.parse(r));

      // UI packages from openzeppelin-ui: file: for local, ^version for staging/production
      expect(localResult.dependencies['@openzeppelin/ui-types']).toMatch(
        /^file:.*\/packages\/types$/
      );
      expect(stagingResult.dependencies['@openzeppelin/ui-types']).toMatch(/^\^/);
      expect(prodResult.dependencies['@openzeppelin/ui-types']).toMatch(/^\^/);

      // Adapter packages: workspace:* for local, rc for staging, ^version for production
      expect(localResult.dependencies['@openzeppelin/ui-builder-adapter-evm']).toBe('workspace:*');
      expect(stagingResult.dependencies['@openzeppelin/ui-builder-adapter-evm']).toMatch(
        rcVersionOrTag
      );
      expect(prodResult.dependencies['@openzeppelin/ui-builder-adapter-evm']).toMatch(/^\^/);

      // All should have same external dependencies
      expect(localResult.dependencies['react']).toBe('^19.0.0');
      expect(stagingResult.dependencies['react']).toBe('^19.0.0');
      expect(prodResult.dependencies['react']).toBe('^19.0.0');
    });

    it('should include upgrade instructions in package.json', async () => {
      const packageManager = new PackageManager(mockRendererConfig);
      const formConfig = createMinimalFormConfig();
      const basePackageJson = JSON.stringify({});
      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction'
      );
      const result = JSON.parse(updated);
      expect(result.scripts).toHaveProperty('update-renderer');
    });

    it('should handle custom dependencies from export options', async () => {
      const packageManager = new PackageManager(mockRendererConfig);
      const formConfig = createMinimalFormConfig();
      const basePackageJson = JSON.stringify({});
      const customDeps = { 'custom-dep': '^1.0.0' };
      const updated = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'test',
        {
          dependencies: customDeps,
        }
      );
      const result = JSON.parse(updated);
      expect(result.dependencies).toHaveProperty('custom-dep', '^1.0.0');
    });
  });

  /**
   * Additional tests could be added here to test the dynamic loading mechanism
   * using the mocked import.meta.glob. This would verify that the PackageManager
   * correctly loads configurations from the expected file paths.
   */

  describe('Error handling', () => {
    it('should handle unknown chain types gracefully', async () => {
      const packageManager = new PackageManager(mockRendererConfig);
      const formConfig = createMinimalFormConfig();
      const deps = await packageManager.getDependencies(formConfig, 'unknown' as Ecosystem);
      expect(deps).toHaveProperty('react');
      expect(Object.keys(deps)).not.toContain('@openzeppelin/ui-builder-adapter-evm');
    });

    it('should handle unknown field types gracefully', async () => {
      const packageManager = new PackageManager(mockRendererConfig);
      const formConfig = createMinimalFormConfig(['unknown-type']);
      const deps = await packageManager.getDependencies(formConfig, 'evm');
      expect(deps).toHaveProperty('@openzeppelin/ui-builder-adapter-evm');
      expect(deps).not.toHaveProperty('unknown-field-dep'); // Assuming no dep for unknown type
    });

    it('should handle malformed package.json gracefully', async () => {
      const packageManager = new PackageManager(mockRendererConfig);
      const malformedJson = 'not-a-json';
      const formConfig = createMinimalFormConfig();
      await expect(
        packageManager.updatePackageJson(malformedJson, formConfig, 'evm', 'testFunction')
      ).rejects.toThrow();
    });
  });
});
