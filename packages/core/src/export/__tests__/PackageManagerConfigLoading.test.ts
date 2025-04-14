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
import type { FieldType } from '@openzeppelin/transaction-form-renderer';

import { describe, expect, it, vi } from 'vitest';

import { PackageManager } from '../PackageManager';

import type { AdapterConfig } from '../../core/types/AdapterTypes';
import type { ChainType } from '../../core/types/ContractSchema';
import type { ExportOptions } from '../../core/types/ExportTypes';
import type { BuilderFormConfig } from '../../core/types/FormTypes';

vi.mock('virtual:adapter-configs', () => {
  const adapterConfigs = {
    evm: {
      dependencies: {
        runtime: {
          ethers: '^6.7.0',
          viem: '^1.10.9',
        },
        dev: {
          '@types/ethers': '^6.7.0',
        },
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

vi.mock('virtual:form-renderer-config', () => {
  const formRendererConfig = {
    coreDependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      '@openzeppelin/transaction-form-renderer': '^1.0.0',
    },
    fieldDependencies: {
      text: { runtimeDependencies: {} },
      date: {
        runtimeDependencies: { 'react-datepicker': '^4.14.0' },
        devDependencies: { '@types/react-datepicker': '^4.11.2' },
      },
    },
  };
  return { formRendererConfig };
});

/**
 * FormRendererConfig interface mirrors the structure from form-renderer package.
 * We define it here rather than importing to avoid test dependencies on implementation details
 * and to make the test more resilient to changes in the original type.
 */
interface FormRendererConfig {
  coreDependencies: Record<string, string>;
  fieldDependencies: Record<
    string,
    {
      runtimeDependencies: Record<string, string>;
      devDependencies?: Record<string, string>;
    }
  >;
}

/**
 * Mock adapter configurations that simulate what would be loaded from adapter config files.
 * Each adapter defines its own runtime and development dependencies.
 */
const mockAdapterConfigs: Record<string, AdapterConfig> = {
  evm: {
    dependencies: {
      runtime: {
        ethers: '^6.7.0',
        viem: '^1.10.9',
      },
      dev: {
        '@types/ethers': '^6.7.0',
      },
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

/**
 * Mock form renderer configuration that defines dependencies for specific field types.
 * This mimics what would be loaded from the form-renderer package's config.
 */
const mockFormRendererConfig: FormRendererConfig = {
  coreDependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    '@openzeppelin/transaction-form-renderer': '^1.0.0',
  },
  fieldDependencies: {
    text: { runtimeDependencies: {} },
    date: {
      runtimeDependencies: { 'react-datepicker': '^4.14.0' },
      devDependencies: { '@types/react-datepicker': '^4.11.2' },
    },
  },
};

describe('PackageManager configuration loading', () => {
  /**
   * This test suite focuses on testing the PackageManager with configurations
   * passed directly to the constructor, bypassing the dynamic loading mechanism.
   * This approach allows us to test the core functionality without relying on
   * the mocked import.meta.glob.
   */
  describe('Using constructor injection', () => {
    it('should properly load adapter configs from constructor', () => {
      const packageManager = new PackageManager(mockAdapterConfigs);

      // Get chain dependencies
      const evmDependencies = packageManager.getDependencies(
        {
          functionId: 'test',
          fields: [],
          layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
          validation: { mode: 'onChange', showErrors: 'inline' },
          theme: {},
        },
        'evm'
      );

      // Verify the configs were loaded correctly
      expect(evmDependencies).toHaveProperty('ethers', '^6.7.0');
      expect(evmDependencies).toHaveProperty('viem', '^1.10.9');
    });

    it('should properly load form renderer config from constructor', () => {
      const packageManager = new PackageManager(mockAdapterConfigs, mockFormRendererConfig);

      // Get dependencies including form-renderer core deps
      const dependencies = packageManager.getDependencies(
        {
          functionId: 'test',
          fields: [],
          layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
          validation: { mode: 'onChange', showErrors: 'inline' },
          theme: {},
        },
        'evm'
      );

      // Verify form renderer configs were loaded
      expect(dependencies).toHaveProperty('react', '^18.2.0');
      expect(dependencies).toHaveProperty('react-dom', '^18.2.0');
    });

    it('should include field-specific dependencies based on form config', () => {
      const packageManager = new PackageManager(mockAdapterConfigs, mockFormRendererConfig);

      /**
       * TRICKY PART: Form Configuration Typing
       *
       * Creating a test form config that matches the expected BuilderFormConfig type
       * requires careful type assertions since we're constructing it manually.
       *
       * We use 'as FieldType' and other type assertions to ensure TypeScript treats
       * string literals as the expected enum types.
       */
      const formConfig = {
        functionId: 'test',
        fields: [
          {
            id: 'dateField',
            name: 'dateField',
            label: 'Date Field',
            type: 'date' as FieldType, // Type assertion required for string literal
            validation: { required: true },
          },
        ],
        layout: {
          columns: 1,
          spacing: 'normal' as 'normal' | 'compact' | 'relaxed',
          labelPosition: 'top' as 'top' | 'left' | 'hidden',
        },
        validation: {
          mode: 'onChange' as 'onChange' | 'onBlur' | 'onSubmit',
          showErrors: 'inline' as 'inline' | 'summary' | 'both',
        },
        theme: {},
      };

      // Test that dependencies for a specific field type are correctly resolved
      const dependencies = packageManager.getDependencies(formConfig, 'evm');

      // Since our form uses the 'date' field type, its dependencies should be included
      expect(dependencies).toHaveProperty('react-datepicker', '^4.14.0');
    });

    /**
     * This test verifies that PackageManager correctly updates a package.json
     * with all required dependencies based on the form configuration and chain type.
     */
    it('should properly update package.json with dependencies', () => {
      const packageManager = new PackageManager(mockAdapterConfigs, mockFormRendererConfig);

      // Start with a minimal package.json
      const basePackageJson = JSON.stringify({
        name: 'test-project',
        dependencies: {},
      });

      // Create a form config that uses a date field
      const formConfig = {
        functionId: 'test',
        fields: [
          {
            id: 'dateField',
            name: 'dateField',
            label: 'Date Field',
            type: 'date' as FieldType,
            validation: { required: true },
          },
        ],
        layout: {
          columns: 1,
          spacing: 'normal' as 'normal' | 'compact' | 'relaxed',
          labelPosition: 'top' as 'top' | 'left' | 'hidden',
        },
        validation: {
          mode: 'onChange' as 'onChange' | 'onBlur' | 'onSubmit',
          showErrors: 'inline' as 'inline' | 'summary' | 'both',
        },
        theme: {},
      };

      // Test package.json updating
      const updated = packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction'
      );

      // Parse the result back to an object for assertions
      const result = JSON.parse(updated);

      // Verify all expected dependencies are included:
      // 1. Chain-specific dependencies (ethers for EVM)
      // 2. Core dependencies (react)
      // 3. Field-specific dependencies (react-datepicker for date fields)
      expect(result.dependencies).toHaveProperty('ethers');
      expect(result.dependencies).toHaveProperty('react');
      expect(result.dependencies).toHaveProperty('react-datepicker');
    });

    it('should handle dev dependencies correctly', () => {
      const packageManager = new PackageManager(mockAdapterConfigs, mockFormRendererConfig);

      const formConfig: BuilderFormConfig = {
        functionId: 'test',
        fields: [
          {
            id: 'dateField',
            name: 'dateField',
            label: 'Date Field',
            type: 'date' as FieldType,
            validation: { required: true },
          },
        ],
        layout: {
          columns: 1,
          spacing: 'normal' as const,
          labelPosition: 'top' as const,
        },
        validation: {
          mode: 'onChange' as const,
          showErrors: 'inline' as const,
        },
        theme: {},
      };

      const devDeps = packageManager.getDevDependencies(formConfig, 'evm');

      // Verify chain-specific dev dependencies
      expect(devDeps).toHaveProperty('@types/ethers', '^6.7.0');
      // Verify field-specific dev dependencies
      expect(devDeps).toHaveProperty('@types/react-datepicker', '^4.11.2');
    });

    it('should apply correct versioning for local environment', () => {
      const packageManager = new PackageManager(mockAdapterConfigs, mockFormRendererConfig);

      // Mock form config that includes at least one field to trigger core dependencies
      const formConfig: BuilderFormConfig = {
        functionId: 'testFunction',
        fields: [
          {
            id: 'field1',
            type: 'text', // A basic field type is enough to pull in core deps
            name: 'param1',
            label: 'Param 1',
            validation: { required: false },
          },
        ],
        layout: { columns: 1, spacing: 'normal', labelPosition: 'top', sections: [] },
        validation: { mode: 'onChange', showErrors: 'inline' },
        theme: {},
      };
      const chainType: ChainType = 'evm';
      const exportOptions: Partial<ExportOptions> = { env: 'local' };

      // Call updatePackageJson with local environment
      const result = JSON.parse(
        packageManager.updatePackageJson(
          '{"dependencies": {}, "devDependencies": {}}',
          formConfig,
          chainType,
          'testFunction',
          exportOptions
        )
      );

      // Verify workspace protocol is used for internal packages
      expect(result.dependencies['@openzeppelin/transaction-form-renderer']).toBe('workspace:*');
      // Verify external dependencies remain unchanged (assuming some were added by getDependencies)
      // Add an assertion for an external dependency if applicable based on the mock configs
    });

    it('should include upgrade instructions in package.json', () => {
      const packageManager = new PackageManager(mockAdapterConfigs, mockFormRendererConfig);

      const basePackageJson = JSON.stringify({
        name: 'test-project',
        dependencies: {},
      });

      const formConfig: BuilderFormConfig = {
        functionId: 'test',
        fields: [],
        layout: {
          columns: 1,
          spacing: 'normal' as const,
          labelPosition: 'top' as const,
        },
        validation: {
          mode: 'onChange' as const,
          showErrors: 'inline' as const,
        },
        theme: {},
      };

      const updated = packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction'
      );

      const result = JSON.parse(updated);

      // Verify upgrade scripts are added
      expect(result.scripts).toHaveProperty('update-form-renderer');
      expect(result.scripts).toHaveProperty('check-deps');
    });

    it('should handle custom dependencies from export options', () => {
      const packageManager = new PackageManager(mockAdapterConfigs, mockFormRendererConfig);

      const basePackageJson = JSON.stringify({
        name: 'test-project',
        dependencies: {},
      });

      const formConfig: BuilderFormConfig = {
        functionId: 'test',
        fields: [],
        layout: {
          columns: 1,
          spacing: 'normal' as const,
          labelPosition: 'top' as const,
        },
        validation: {
          mode: 'onChange' as const,
          showErrors: 'inline' as const,
        },
        theme: {},
      };

      const customDeps = {
        'custom-package': '^1.0.0',
      };

      const updated = packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        { dependencies: customDeps }
      );

      const result = JSON.parse(updated);

      // Verify custom dependencies are included
      expect(result.dependencies).toHaveProperty('custom-package', '^1.0.0');
    });
  });

  /**
   * Additional tests could be added here to test the dynamic loading mechanism
   * using the mocked import.meta.glob. This would verify that the PackageManager
   * correctly loads configurations from the expected file paths.
   */

  describe('Error handling', () => {
    it('should handle unknown chain types gracefully', () => {
      const packageManager = new PackageManager(mockAdapterConfigs, mockFormRendererConfig);

      const formConfig: BuilderFormConfig = {
        functionId: 'test',
        fields: [],
        layout: {
          columns: 1,
          spacing: 'normal' as const,
          labelPosition: 'top' as const,
        },
        validation: {
          mode: 'onChange' as const,
          showErrors: 'inline' as const,
        },
        theme: {},
      };

      const deps = packageManager.getDependencies(formConfig, 'unknown-chain' as ChainType);

      // Should still include core dependencies even if chain type is unknown
      expect(deps).toHaveProperty('react');
      expect(deps).toHaveProperty('react-dom');
    });

    it('should handle unknown field types gracefully', () => {
      const packageManager = new PackageManager(mockAdapterConfigs, mockFormRendererConfig);

      const formConfig: BuilderFormConfig = {
        functionId: 'test',
        fields: [
          {
            id: 'unknownField',
            name: 'unknownField',
            label: 'Unknown Field',
            type: 'unknown-type' as FieldType, // Type assertion needed for test
            validation: { required: true },
          },
        ],
        layout: {
          columns: 1,
          spacing: 'normal' as const,
          labelPosition: 'top' as const,
        },
        validation: {
          mode: 'onChange' as const,
          showErrors: 'inline' as const,
        },
        theme: {},
      };

      const deps = packageManager.getDependencies(formConfig, 'evm');

      // Should still include core and chain dependencies
      expect(deps).toHaveProperty('react');
      expect(deps).toHaveProperty('ethers');
    });

    it('should handle malformed package.json gracefully', () => {
      const packageManager = new PackageManager(mockAdapterConfigs, mockFormRendererConfig);

      const malformedJson = 'not-a-json';

      const formConfig: BuilderFormConfig = {
        functionId: 'test',
        fields: [],
        layout: {
          columns: 1,
          spacing: 'normal' as const,
          labelPosition: 'top' as const,
        },
        validation: {
          mode: 'onChange' as const,
          showErrors: 'inline' as const,
        },
        theme: {},
      };

      expect(() =>
        packageManager.updatePackageJson(malformedJson, formConfig, 'evm', 'testFunction')
      ).toThrow();
    });
  });
});
