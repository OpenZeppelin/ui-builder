import { beforeEach, describe, expect, it } from 'vitest';

import { PackageManager } from '../PackageManager';

import type { AdapterConfig } from '../../core/types/AdapterTypes';
import type { ChainType } from '../../core/types/ContractSchema';
import type { BuilderFormConfig } from '../../core/types/FormTypes';

// Mock FormRendererConfig since we can't import it directly
interface MockFormRendererConfig {
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
  // Mock adapter configs for testing
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
    stellar: {
      dependencies: {
        runtime: {
          'stellar-sdk': '^10.4.1',
        },
      },
    },
  };

  // Mock form renderer config for testing
  const mockFormRendererConfig: MockFormRendererConfig = {
    coreDependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'react-hook-form': '^7.43.9',
      '@openzeppelin/transaction-form-renderer': '1.0.0',
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
  });

  describe('getDependencies', () => {
    let packageManager: PackageManager;

    beforeEach(() => {
      packageManager = new PackageManager(
        mockAdapterConfigs,
        mockFormRendererConfig as MockFormRendererConfig
      );
    });

    it('should include core dependencies for all forms', () => {
      const formConfig = createMinimalFormConfig();
      const dependencies = packageManager.getDependencies(formConfig, 'evm');

      expect(dependencies).toHaveProperty('react');
      expect(dependencies).toHaveProperty('react-dom');
      expect(dependencies).toHaveProperty('react-hook-form');
      expect(dependencies).toHaveProperty('@openzeppelin/transaction-form-renderer');
    });

    it('should include chain-specific dependencies for the specified chain', () => {
      const formConfig = createMinimalFormConfig();

      // Test EVM dependencies
      const evmDependencies = packageManager.getDependencies(formConfig, 'evm');
      expect(evmDependencies).toHaveProperty('ethers');
      expect(evmDependencies).toHaveProperty('viem');
      expect(evmDependencies).not.toHaveProperty('@solana/web3.js');

      // Test Solana dependencies
      const solanaDependencies = packageManager.getDependencies(formConfig, 'solana');
      expect(solanaDependencies).toHaveProperty('@solana/web3.js');
      expect(solanaDependencies).not.toHaveProperty('ethers');

      // Test Stellar dependencies
      const stellarDependencies = packageManager.getDependencies(formConfig, 'stellar');
      expect(stellarDependencies).toHaveProperty('stellar-sdk');
      expect(stellarDependencies).not.toHaveProperty('ethers');
    });

    it('should include field-specific dependencies based on form fields', () => {
      // Form with basic fields
      const basicFormConfig = createMinimalFormConfig(['text', 'number']);
      const basicDependencies = packageManager.getDependencies(basicFormConfig, 'evm');

      // Form with advanced fields
      const advancedFormConfig = createMinimalFormConfig(['date', 'select']);
      const advancedDependencies = packageManager.getDependencies(advancedFormConfig, 'evm');

      // Basic form should not have advanced field dependencies
      expect(basicDependencies).not.toHaveProperty('react-datepicker');
      expect(basicDependencies).not.toHaveProperty('react-select');

      // Advanced form should have those dependencies
      expect(advancedDependencies).toHaveProperty('react-datepicker');
      expect(advancedDependencies).toHaveProperty('react-select');
    });

    it('should handle unknown chain types gracefully', () => {
      const formConfig = createMinimalFormConfig();

      // We still expect core dependencies even for unknown chain
      const dependencies = packageManager.getDependencies(formConfig, 'unknown-chain' as ChainType);

      expect(dependencies).toHaveProperty('react');
      expect(dependencies).toHaveProperty('react-dom');
      expect(dependencies).toHaveProperty('react-hook-form');
      expect(dependencies).not.toHaveProperty('ethers');
      expect(dependencies).not.toHaveProperty('@solana/web3.js');
    });
  });

  describe('getDevDependencies', () => {
    let packageManager: PackageManager;

    beforeEach(() => {
      packageManager = new PackageManager(
        mockAdapterConfigs,
        mockFormRendererConfig as MockFormRendererConfig
      );
    });

    it('should include chain-specific dev dependencies', () => {
      const formConfig = createMinimalFormConfig();

      // EVM has dev dependencies
      const evmDevDependencies = packageManager.getDevDependencies(formConfig, 'evm');
      expect(evmDevDependencies).toHaveProperty('@types/ethers');

      // Solana has different dev dependencies
      const solanaDevDependencies = packageManager.getDevDependencies(formConfig, 'solana');
      expect(solanaDevDependencies).toHaveProperty('@types/bn.js');

      // Stellar doesn't have dev dependencies in our mock
      const stellarDevDependencies = packageManager.getDevDependencies(formConfig, 'stellar');
      expect(Object.keys(stellarDevDependencies)).toHaveLength(0);
    });

    it('should include field-specific dev dependencies', () => {
      // Form with date fields which have dev dependencies
      const dateFormConfig = createMinimalFormConfig(['date']);
      const dateDeps = packageManager.getDevDependencies(dateFormConfig, 'evm');

      // Form with select fields which have dev dependencies
      const selectFormConfig = createMinimalFormConfig(['select']);
      const selectDeps = packageManager.getDevDependencies(selectFormConfig, 'evm');

      // Form with basic fields which don't have dev dependencies
      const basicFormConfig = createMinimalFormConfig(['text', 'number']);
      const basicDeps = packageManager.getDevDependencies(basicFormConfig, 'evm');

      // Check that field-specific dev dependencies are included
      expect(dateDeps).toHaveProperty('@types/react-datepicker');
      expect(selectDeps).toHaveProperty('@types/react-select');

      // Check that basic form only has chain dev dependencies
      expect(basicDeps).toHaveProperty('@types/ethers');
      expect(basicDeps).not.toHaveProperty('@types/react-datepicker');
      expect(basicDeps).not.toHaveProperty('@types/react-select');
    });
  });

  describe('updatePackageJson', () => {
    let packageManager: PackageManager;

    beforeEach(() => {
      packageManager = new PackageManager(
        mockAdapterConfigs,
        mockFormRendererConfig as MockFormRendererConfig
      );
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

    it('should update name and description based on form config', () => {
      const formConfig = createMinimalFormConfig();

      const updated = packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction'
      );

      const result = JSON.parse(updated);
      expect(result.name).toBe('testfunction-form');
      expect(result.description).toBe('Transaction form for testFunction');
    });

    it('should respect custom name and description from options', () => {
      const formConfig = createMinimalFormConfig();

      const updated = packageManager.updatePackageJson(
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

    it('should apply author and license from options', () => {
      const formConfig = createMinimalFormConfig();

      const updated = packageManager.updatePackageJson(
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

    it('should merge dependencies from all sources', () => {
      const formConfig = createMinimalFormConfig(['date']);

      const updated = packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction'
      );

      const result = JSON.parse(updated);

      // Should keep existing dependencies
      expect(result.dependencies).toHaveProperty('existing-dep', '1.0.0');

      // Should add core dependencies
      expect(result.dependencies).toHaveProperty('react');
      expect(result.dependencies).toHaveProperty('react-dom');
      expect(result.dependencies).toHaveProperty('react-hook-form');

      // Should add chain-specific dependencies
      expect(result.dependencies).toHaveProperty('ethers');
      expect(result.dependencies).toHaveProperty('viem');

      // Should add field-specific dependencies
      expect(result.dependencies).toHaveProperty('react-datepicker');
    });

    it('should include additional dependencies from options', () => {
      const formConfig = createMinimalFormConfig();

      const updated = packageManager.updatePackageJson(
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

    it('should apply semantic versioning strategy', () => {
      const formConfig = createMinimalFormConfig();

      const updated = packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction'
      );

      const result = JSON.parse(updated);

      // Our own package should always use caret versioning
      expect(result.dependencies['@openzeppelin/transaction-form-renderer']).toMatch(/^\^/);
    });

    it('should add upgrade instructions through scripts', () => {
      const formConfig = createMinimalFormConfig();

      const updated = packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction'
      );

      const result = JSON.parse(updated);

      // Should add helper scripts
      expect(result.scripts).toHaveProperty('update-form-renderer');
      expect(result.scripts).toHaveProperty('check-deps');
    });
  });
});
