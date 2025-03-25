import { describe, expect, it } from 'vitest';

import { PackageManager } from '../PackageManager';

import type { AdapterConfig } from '../../core/types/AdapterTypes';
import type { ChainType } from '../../core/types/ContractSchema';
import type { BuilderFormConfig } from '../../core/types/FormTypes';

// Define explicit types for our test configs
interface TestFormRendererConfig {
  coreDependencies: Record<string, string>;
  fieldDependencies: Record<
    string,
    {
      runtimeDependencies: Record<string, string>;
      devDependencies?: Record<string, string>;
    }
  >;
}

describe('Configuration Integration Tests', () => {
  // Create different adapter configurations for testing
  const testAdapterConfigs: Record<string, AdapterConfig> = {
    'test-chain-1': {
      dependencies: {
        runtime: {
          'chain1-sdk': '^1.0.0',
          'chain1-signer': '^2.0.0',
        },
        dev: {
          '@types/chain1-sdk': '^1.0.0',
        },
      },
    },
    'test-chain-2': {
      dependencies: {
        runtime: {
          'chain2-sdk': '^3.0.0',
        },
      },
    },
  };

  // Create a test form renderer configuration
  const testFormRendererConfig: TestFormRendererConfig = {
    coreDependencies: {
      'core-lib': '^1.0.0',
      react: '^18.2.0',
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
    },
  };

  // Helper function to create test form configs with different field types
  const createFormConfig = (fieldTypes: string[]): BuilderFormConfig => ({
    functionId: 'testFunction',
    fields: fieldTypes.map((type, index) => ({
      id: `field${index}`,
      name: `field${index}`,
      label: `Field ${index}`,
      type,
      validation: { required: true },
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
  });

  describe('Dynamic Configuration Loading', () => {
    it('should load different dependencies based on chain type', () => {
      // Create a PackageManager with our test configurations
      const packageManager = new PackageManager(
        testAdapterConfigs,
        testFormRendererConfig as TestFormRendererConfig
      );

      // Create a basic form config
      const formConfig = createFormConfig(['text', 'number']);

      // Get dependencies for different chain types
      const chain1Dependencies = packageManager.getDependencies(
        formConfig,
        'test-chain-1' as ChainType
      );
      const chain2Dependencies = packageManager.getDependencies(
        formConfig,
        'test-chain-2' as ChainType
      );

      // Verify chain-specific dependencies are included
      expect(chain1Dependencies).toHaveProperty('chain1-sdk');
      expect(chain1Dependencies).toHaveProperty('chain1-signer');
      expect(chain1Dependencies).not.toHaveProperty('chain2-sdk');

      expect(chain2Dependencies).toHaveProperty('chain2-sdk');
      expect(chain2Dependencies).not.toHaveProperty('chain1-sdk');
      expect(chain2Dependencies).not.toHaveProperty('chain1-signer');

      // Both should have core dependencies
      expect(chain1Dependencies).toHaveProperty('core-lib');
      expect(chain2Dependencies).toHaveProperty('core-lib');
    });

    it('should load different dependencies based on field types', () => {
      // Create a PackageManager with our test configurations
      const packageManager = new PackageManager(
        testAdapterConfigs,
        testFormRendererConfig as TestFormRendererConfig
      );

      // Create forms with different field types
      const basicFormConfig = createFormConfig(['text', 'number']);
      const advancedFormConfig = createFormConfig(['date', 'select']);
      const mixedFormConfig = createFormConfig(['text', 'date', 'select']);

      // Get dependencies for each form config using the same chain
      const basicDeps = packageManager.getDependencies(
        basicFormConfig,
        'test-chain-1' as ChainType
      );
      const advancedDeps = packageManager.getDependencies(
        advancedFormConfig,
        'test-chain-1' as ChainType
      );
      const mixedDeps = packageManager.getDependencies(
        mixedFormConfig,
        'test-chain-1' as ChainType
      );

      // Basic form should not have field-specific dependencies
      expect(basicDeps).not.toHaveProperty('date-picker');
      expect(basicDeps).not.toHaveProperty('select-control');

      // Advanced form should have date and select dependencies
      expect(advancedDeps).toHaveProperty('date-picker');
      expect(advancedDeps).toHaveProperty('select-control');

      // Mixed form should have all field-specific dependencies
      expect(mixedDeps).toHaveProperty('date-picker');
      expect(mixedDeps).toHaveProperty('select-control');

      // All forms should have chain and core dependencies
      expect(basicDeps).toHaveProperty('chain1-sdk');
      expect(basicDeps).toHaveProperty('core-lib');
      expect(advancedDeps).toHaveProperty('chain1-sdk');
      expect(advancedDeps).toHaveProperty('core-lib');
    });
  });

  describe('Package.json Integration', () => {
    it('should generate different package.json files based on form configs', () => {
      // Create a PackageManager with our test configurations
      const packageManager = new PackageManager(
        testAdapterConfigs,
        testFormRendererConfig as TestFormRendererConfig
      );

      // Create template package.json content
      const basePackageJson = JSON.stringify({
        name: 'template-project',
        description: 'Template description',
        dependencies: {},
        devDependencies: {},
      });

      // Create different form configs
      const basicFormConfig = createFormConfig(['text']);
      const advancedFormConfig = createFormConfig(['date', 'select']);

      // Generate package.json for different configs and chains
      const chain1BasicJson = packageManager.updatePackageJson(
        basePackageJson,
        basicFormConfig,
        'test-chain-1' as ChainType,
        'basicFunction'
      );
      const chain2AdvancedJson = packageManager.updatePackageJson(
        basePackageJson,
        advancedFormConfig,
        'test-chain-2' as ChainType,
        'advancedFunction'
      );

      // Parse the generated JSON
      const chain1BasicResult = JSON.parse(chain1BasicJson);
      const chain2AdvancedResult = JSON.parse(chain2AdvancedJson);

      // Check dependencies appropriate to the configuration
      expect(chain1BasicResult.dependencies).toHaveProperty('chain1-sdk');
      expect(chain1BasicResult.dependencies).not.toHaveProperty('date-picker');
      expect(chain1BasicResult.dependencies).not.toHaveProperty('chain2-sdk');

      expect(chain2AdvancedResult.dependencies).toHaveProperty('chain2-sdk');
      expect(chain2AdvancedResult.dependencies).toHaveProperty('date-picker');
      expect(chain2AdvancedResult.dependencies).toHaveProperty('select-control');
      expect(chain2AdvancedResult.dependencies).not.toHaveProperty('chain1-sdk');

      // Check that project names reflect the function IDs
      expect(chain1BasicResult.name).toBe('basicfunction-form');
      expect(chain2AdvancedResult.name).toBe('advancedfunction-form');

      // Verify custom options are applied
      const customOptionsJson = packageManager.updatePackageJson(
        basePackageJson,
        basicFormConfig,
        'test-chain-1' as ChainType,
        'customFunction',
        {
          projectName: 'custom-project',
          description: 'Custom description',
          author: 'Test Author',
          license: 'MIT',
        }
      );
      const customOptionsResult = JSON.parse(customOptionsJson);

      expect(customOptionsResult.name).toBe('custom-project');
      expect(customOptionsResult.description).toBe('Custom description');
      expect(customOptionsResult.author).toBe('Test Author');
      expect(customOptionsResult.license).toBe('MIT');
    });

    it('should apply versioning strategy to package dependencies', () => {
      // Create a PackageManager with our test configurations
      const packageManager = new PackageManager(
        testAdapterConfigs,
        testFormRendererConfig as TestFormRendererConfig
      );

      // Create base package.json that already has a dependency
      const basePackageJson = JSON.stringify({
        name: 'template-project',
        dependencies: {
          'existing-dep': '1.0.0',
        },
      });

      // Create a form config and update the package.json
      const formConfig = createFormConfig(['text']);
      const updated = packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'test-chain-1' as ChainType,
        'testFunction'
      );
      const result = JSON.parse(updated);

      // Verify the existing dependency was preserved
      expect(result.dependencies).toHaveProperty('existing-dep', '1.0.0');

      // Verify our own packages use caret versioning if not already specified
      // Mock our own package by adding it to testFormRendererConfig
      testFormRendererConfig.coreDependencies[
        '@openzeppelin/transaction-form-builder-form-renderer'
      ] = '1.0.0';

      const updatedWithOwnPackage = packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'test-chain-1' as ChainType,
        'testFunction'
      );
      const resultWithOwnPackage = JSON.parse(updatedWithOwnPackage);

      // Verify our package got the caret prefix
      expect(
        resultWithOwnPackage.dependencies['@openzeppelin/transaction-form-builder-form-renderer']
      ).toBe('^1.0.0');
    });
  });
});
