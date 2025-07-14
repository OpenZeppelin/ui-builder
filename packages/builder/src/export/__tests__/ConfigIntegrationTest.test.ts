import { describe, expect, it } from 'vitest';

import type { BuilderFormConfig } from '../../core/types/FormTypes';
import { PackageManager } from '../PackageManager';

// Define explicit types for our test configs
interface TestRendererConfig {
  coreDependencies: Record<string, string>;
  fieldDependencies: Record<
    string,
    {
      runtimeDependencies: Record<string, string>;
      devDependencies?: Record<string, string>;
    }
  >;
}

describe('PackageManager Integration Tests', () => {
  // Create a test renderer configuration
  const testRendererConfig: TestRendererConfig = {
    coreDependencies: {
      'core-lib': '^1.0.0', // Mock external core dep
      react: '^19.0.0',
      // Add renderer and types packages here as they are expected by PackageManager
      '@openzeppelin/contracts-ui-builder-renderer': '^1.0.0', // Use a placeholder caret version
      '@openzeppelin/contracts-ui-builder-types': '^0.1.0', // Use a placeholder caret version
    },
    fieldDependencies: {
      text: {
        runtimeDependencies: {},
      },
      number: {
        runtimeDependencies: {},
      },
      date: {
        runtimeDependencies: {
          'date-picker': '^2.0.0',
        },
        devDependencies: {
          '@types/date-picker': '^2.0.0',
        },
      },
      select: {
        runtimeDependencies: {
          'select-control': '^1.5.0',
        },
      },
      // Add mocks for other field types if needed by tests
      'blockchain-address': { runtimeDependencies: {} },
      checkbox: { runtimeDependencies: {} },
    },
  };

  // Helper function to create test form configs with different field types
  const createFormConfig = (
    fieldTypes: string[],
    functionId = 'testFunction'
  ): BuilderFormConfig => ({
    functionId,
    fields: fieldTypes.map((type, index) => ({
      id: `field${index}`,
      name: `field${index}`,
      label: `Field ${index}`,
      type,
      validation: { required: true },
      // Simulate original type needed for transforms, though not directly used by PackageManager
      originalParameterType: type === 'blockchain-address' ? 'address' : type,
    })) as unknown as BuilderFormConfig['fields'],
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
    it('should include core, renderer, types, and specific adapter package based on chain type', async () => {
      const packageManager = new PackageManager(testRendererConfig);
      const formConfig = createFormConfig(['text']); // Basic form

      // EVM
      const evmDeps = await packageManager.getDependencies(formConfig, 'evm');
      expect(evmDeps).toHaveProperty('core-lib', '^1.0.0'); // From mock renderer config
      expect(evmDeps).toHaveProperty('react', '^19.0.0'); // From mock renderer config
      expect(evmDeps).toHaveProperty('@openzeppelin/contracts-ui-builder-renderer', 'workspace:*'); // Added by PM
      expect(evmDeps).toHaveProperty('@openzeppelin/contracts-ui-builder-types', 'workspace:*'); // Added by PM
      expect(evmDeps).toHaveProperty('@openzeppelin/transaction-form-adapter-evm', 'workspace:*'); // Added by PM
      expect(evmDeps).not.toHaveProperty('@openzeppelin/transaction-form-adapter-solana');

      // Solana
      const solanaDeps = await packageManager.getDependencies(formConfig, 'solana');
      expect(solanaDeps).toHaveProperty('core-lib', '^1.0.0');
      expect(solanaDeps).toHaveProperty('react', '^19.0.0');
      expect(solanaDeps).toHaveProperty(
        '@openzeppelin/contracts-ui-builder-renderer',
        'workspace:*'
      ); // Added by PM
      expect(solanaDeps).toHaveProperty('@openzeppelin/contracts-ui-builder-types', 'workspace:*'); // Added by PM
      expect(solanaDeps).toHaveProperty(
        '@openzeppelin/transaction-form-adapter-solana',
        'workspace:*'
      ); // Added by PM
      expect(solanaDeps).not.toHaveProperty('@openzeppelin/transaction-form-adapter-evm');
    });

    it('should include field-specific dependencies based on form fields', async () => {
      const packageManager = new PackageManager(testRendererConfig);

      const basicFormConfig = createFormConfig(['text', 'number']);
      const advancedFormConfig = createFormConfig(['date', 'select']);
      const mixedFormConfig = createFormConfig(['text', 'date']);

      const basicDeps = await packageManager.getDependencies(basicFormConfig, 'evm');
      const advancedDeps = await packageManager.getDependencies(advancedFormConfig, 'evm');
      const mixedDeps = await packageManager.getDependencies(mixedFormConfig, 'evm');

      // Basic checks
      expect(basicDeps).not.toHaveProperty('date-picker');
      expect(basicDeps).not.toHaveProperty('select-control');

      // Advanced checks
      expect(advancedDeps).toHaveProperty('date-picker', '^2.0.0');
      expect(advancedDeps).toHaveProperty('select-control', '^1.5.0');

      // Mixed checks
      expect(mixedDeps).toHaveProperty('date-picker', '^2.0.0');
      expect(mixedDeps).not.toHaveProperty('select-control');

      // Core/Adapter checks remain - Check for PRESENCE and workspace:*
      expect(advancedDeps).toHaveProperty(
        '@openzeppelin/transaction-form-adapter-evm',
        'workspace:*'
      );
      expect(mixedDeps).toHaveProperty('@openzeppelin/contracts-ui-builder-types', 'workspace:*');
    });

    it('should use workspace protocol for internal packages', async () => {
      const packageManager = new PackageManager(testRendererConfig);
      const formConfig = createFormConfig(['text']);
      const deps = await packageManager.getDependencies(formConfig, 'evm');

      expect(deps['@openzeppelin/contracts-ui-builder-renderer']).toBe('workspace:*'); // Added by PM
      expect(deps['@openzeppelin/contracts-ui-builder-types']).toBe('workspace:*'); // Added by PM
      expect(deps['@openzeppelin/transaction-form-adapter-evm']).toBe('workspace:*'); // Added by PM
    });
  });

  describe('updatePackageJson', () => {
    const basePackageJson = JSON.stringify(
      {
        name: 'template-project',
        version: '0.1.0',
        description: 'Template description',
        dependencies: { 'existing-dep': '1.0.0', react: '*' },
        devDependencies: { 'existing-dev-dep': '1.0.0' },
      },
      null,
      2
    );

    it('should merge dependencies correctly, preserving existing ones and applying strategy', async () => {
      const packageManager = new PackageManager(testRendererConfig);
      const formConfig = createFormConfig(['date', 'text'], 'mergeTest');

      const updatedJson = await packageManager.updatePackageJson(
        basePackageJson, // This base includes react: '*'
        formConfig,
        'evm',
        'mergeTest'
        // No env specified, defaults to 'production' in applyVersioningStrategy
      );
      const result = JSON.parse(updatedJson);

      // Check preservation
      expect(result.dependencies).toHaveProperty('existing-dep', '1.0.0');
      expect(result.devDependencies).toHaveProperty('existing-dev-dep', '1.0.0');

      // Check merged runtime deps
      expect(result.dependencies).toHaveProperty('core-lib', '^1.0.0'); // From mock
      expect(result.dependencies).toHaveProperty('react', '^19.0.0'); // Updated from mock
      expect(result.dependencies).toHaveProperty('date-picker', '^2.0.0'); // From field
      // Check for caret versions (default 'production' env applies versioning)
      expect(result.dependencies).toHaveProperty(
        '@openzeppelin/transaction-form-adapter-evm',
        expect.stringMatching(/^\^/)
      );
      expect(result.dependencies).toHaveProperty(
        '@openzeppelin/contracts-ui-builder-types',
        expect.stringMatching(/^\^/)
      );
      expect(result.dependencies).toHaveProperty(
        '@openzeppelin/contracts-ui-builder-renderer',
        expect.stringMatching(/^\^/)
      );

      // Check merged dev deps
      expect(result.devDependencies).toHaveProperty('@types/date-picker', '^2.0.0');
    });

    it('should update basic package metadata (name, description)', async () => {
      const packageManager = new PackageManager(testRendererConfig);
      const formConfig = createFormConfig(['text'], 'metadataTest');

      const updatedJson = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'metadataTest',
        { env: 'local' }
      );
      const result = JSON.parse(updatedJson);

      // Default name generation
      expect(result.name).toBe('metadatatest-form'); // Kebab-case functionId + -form
      // Default description check - check it contains the function name
      expect(result.description).toContain('metadataTest');
    });

    it('should apply custom metadata from export options', async () => {
      const packageManager = new PackageManager(testRendererConfig);
      const formConfig = createFormConfig(['text'], 'customMeta');

      const updatedJson = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'customMeta',
        {
          env: 'local',
          projectName: 'my-custom-project',
          description: 'My custom description.',
          author: 'Test Author <test@example.com>',
          license: 'MIT',
          // Note: custom dependencies are not handled by this test focus
        }
      );
      const result = JSON.parse(updatedJson);

      expect(result.name).toBe('my-custom-project');
      expect(result.description).toBe('My custom description.');
      expect(result.author).toBe('Test Author <test@example.com>');
      expect(result.license).toBe('MIT');
    });

    it('should only add devDependencies if contributed by adapters or fields', async () => {
      const packageManager = new PackageManager(testRendererConfig);
      const formConfig = createFormConfig(['text']); // This field has no dev deps
      const baseJsonNoDev = JSON.stringify({ name: 'no-dev', dependencies: {} });

      const updatedJson = await packageManager.updatePackageJson(
        baseJsonNoDev,
        formConfig,
        'evm', // The EVM adapter now adds @types/lodash
        'devDepsTest',
        { env: 'local' }
      );
      const result = JSON.parse(updatedJson);

      // Expect devDependencies to BE present because the EVM adapter adds @types/lodash
      expect(result.hasOwnProperty('devDependencies')).toBe(true);
      expect(result.devDependencies).toHaveProperty('@types/lodash');
    });

    it('should include UI kit dependencies when a UI kit is configured', async () => {
      const packageManager = new PackageManager(testRendererConfig);
      const formConfig: BuilderFormConfig = {
        ...createFormConfig(['text'], 'uiKitTest'),
        uiKitConfig: {
          kitName: 'rainbowkit',
          kitConfig: {}, // Empty config is fine for this test
        },
      };

      const updatedJson = await packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'uiKitTest',
        { env: 'local' }
      );
      const result = JSON.parse(updatedJson);

      // Check for RainbowKit dependency
      expect(result.dependencies).toHaveProperty('@rainbow-me/rainbowkit');
    });
  });
});
