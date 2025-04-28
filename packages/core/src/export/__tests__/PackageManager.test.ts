import { beforeEach, describe, expect, it } from 'vitest';

import type { ChainType } from '@openzeppelin/transaction-form-types/contracts';

import type { BuilderFormConfig } from '../../core/types/FormTypes';
import { PackageManager } from '../PackageManager';

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
      packageManager = new PackageManager(mockFormRendererConfig as MockFormRendererConfig);
    });

    it('should include core dependencies for all forms', () => {
      const formConfig = createMinimalFormConfig();
      const dependencies = packageManager.getDependencies(formConfig, 'evm');

      expect(dependencies).toHaveProperty('react');
      expect(dependencies).toHaveProperty('react-dom');
      expect(dependencies).toHaveProperty('react-hook-form');
      expect(dependencies).toHaveProperty('@openzeppelin/transaction-form-renderer');
    });

    it('should include the correct adapter package dependency', () => {
      const formConfig = createMinimalFormConfig();

      const evmDependencies = packageManager.getDependencies(formConfig, 'evm');
      expect(evmDependencies).toHaveProperty('@openzeppelin/transaction-form-adapter-evm');
      expect(evmDependencies).toHaveProperty('@openzeppelin/transaction-form-types'); // Should also include types
      expect(evmDependencies).not.toHaveProperty('@openzeppelin/transaction-form-adapter-solana');
      // Remove assertions for specific libs like ethers
      expect(evmDependencies).not.toHaveProperty('ethers');

      const solanaDependencies = packageManager.getDependencies(formConfig, 'solana');
      expect(solanaDependencies).toHaveProperty('@openzeppelin/transaction-form-adapter-solana');
      expect(solanaDependencies).toHaveProperty('@openzeppelin/transaction-form-types');
      expect(solanaDependencies).not.toHaveProperty('@openzeppelin/transaction-form-adapter-evm');
      // Remove assertions for specific libs like @solana/web3.js
      expect(solanaDependencies).not.toHaveProperty('@solana/web3.js');
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
      const dependencies = packageManager.getDependencies(formConfig, 'unknown-chain' as ChainType);
      expect(dependencies).toHaveProperty('react'); // Core deps still present
      expect(dependencies).not.toHaveProperty('@openzeppelin/transaction-form-adapter-evm'); // Adapter package not included
      expect(dependencies).not.toHaveProperty('@openzeppelin/transaction-form-types'); // Types package not included for unknown chain
    });
  });

  describe('getDevDependencies', () => {
    let packageManager: PackageManager;

    beforeEach(() => {
      packageManager = new PackageManager(mockFormRendererConfig as MockFormRendererConfig);
    });

    it('should include field-specific dev dependencies', () => {
      const dateFormConfig = createMinimalFormConfig(['date']);
      const dateDeps = packageManager.getDevDependencies(dateFormConfig, 'evm');
      expect(dateDeps).toHaveProperty('@types/react-datepicker');

      const basicFormConfig = createMinimalFormConfig(['text']);
      const basicDeps = packageManager.getDevDependencies(basicFormConfig, 'evm');
      expect(Object.keys(basicDeps)).not.toContain('@types/react-datepicker');
    });
  });

  describe('updatePackageJson', () => {
    let packageManager: PackageManager;

    beforeEach(() => {
      packageManager = new PackageManager(mockFormRendererConfig as MockFormRendererConfig);
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

    it('should merge dependencies from all sources (core, field, adapter package)', () => {
      const formConfig = createMinimalFormConfig(['date']);
      const updated = packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction'
      );
      const result = JSON.parse(updated);

      expect(result.dependencies).toHaveProperty('react'); // Core
      expect(result.dependencies).toHaveProperty('react-datepicker'); // Field
      expect(result.dependencies).toHaveProperty('@openzeppelin/transaction-form-adapter-evm'); // Adapter pkg
      expect(result.dependencies).toHaveProperty('@openzeppelin/transaction-form-types'); // Types pkg
      expect(result.dependencies).not.toHaveProperty('ethers'); // Specific lib removed
      expect(result.dependencies).not.toHaveProperty('viem'); // Specific lib removed
    });

    it('should apply versioning strategy correctly (local env)', () => {
      const formConfig = createMinimalFormConfig();
      const updated = packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        { env: 'local' }
      );
      const result = JSON.parse(updated);
      expect(result.dependencies['@openzeppelin/transaction-form-renderer']).toBe('workspace:*');
      expect(result.dependencies['@openzeppelin/transaction-form-types']).toBe('workspace:*');
      expect(result.dependencies['@openzeppelin/transaction-form-adapter-evm']).toBe('workspace:*');
    });

    it('should apply versioning strategy correctly (prod env)', () => {
      const formConfig = createMinimalFormConfig();
      const updated = packageManager.updatePackageJson(
        basePackageJson,
        formConfig,
        'evm',
        'testFunction',
        { env: 'production' }
      );
      const result = JSON.parse(updated);
      expect(result.dependencies['@openzeppelin/transaction-form-renderer']).toMatch(/^\^/);
      expect(result.dependencies['@openzeppelin/transaction-form-types']).toMatch(/^\^/);
      expect(result.dependencies['@openzeppelin/transaction-form-adapter-evm']).toMatch(/^\^/);
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
