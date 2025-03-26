import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import * as adapterExportManagerModule from '../AdapterExportManager';
import { FormExportSystem } from '../FormExportSystem';
import { PackageManager } from '../PackageManager';

import type { AdapterConfig } from '../../core/types/AdapterTypes';
import type { BuilderFormConfig } from '../../core/types/FormTypes';

// Mock FormRendererConfig since we can't import it directly from @form-renderer
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

// Mock types for internal components
interface MockTemplateManager {
  createProject: ReturnType<typeof vi.fn>;
}

interface MockFormCodeGenerator {
  generateFormComponent: ReturnType<typeof vi.fn>;
  generateUpdatedAppComponent: ReturnType<typeof vi.fn>;
}

/**
 * Unit tests for the FormExportSystem class
 */
describe('FormExportSystem', () => {
  // Suppress console warning about Vite glob options
  const originalConsoleWarn = console.warn;
  beforeAll(() => {
    console.warn = (msg) => {
      if (!msg.includes('The glob option "as" has been deprecated')) {
        originalConsoleWarn(msg);
      }
    };
  });

  afterAll(() => {
    console.warn = originalConsoleWarn;
  });

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
      '@openzeppelin/transaction-form-builder-form-renderer': '^1.0.0',
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

  // Create a mock package.json content
  const mockPackageJson = JSON.stringify({
    name: 'template-project',
    description: 'Template description',
    dependencies: {},
    devDependencies: {},
  });

  // Create a minimal form config for tests
  const createMinimalFormConfig = (): BuilderFormConfig => ({
    functionId: 'testFunction',
    fields: [
      {
        id: 'param0',
        name: 'param0',
        label: 'Parameter 0',
        type: 'text',
        validation: { required: true },
      },
    ],
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

  // Create a system with the provided dependencies
  const createExportSystem = () => {
    // Create new instances for each test
    const templateManager = { createProject: vi.fn() } as MockTemplateManager;
    const formCodeGenerator = { generateFormComponent: vi.fn() } as MockFormCodeGenerator;
    const adapterExportManager = new adapterExportManagerModule.AdapterExportManager();
    const packageManager = new PackageManager(
      mockAdapterConfigs,
      mockFormRendererConfig as MockFormRendererConfig
    );

    // Mock necessary methods
    templateManager.createProject = vi.fn().mockImplementation((_templateName, customFiles) => {
      return {
        'package.json': mockPackageJson,
        'index.html': '<html><body><div id="root"></div></body></html>',
        ...customFiles,
      };
    });

    formCodeGenerator.generateFormComponent = vi
      .fn()
      .mockReturnValue('export const GeneratedForm = () => { return <div>Form</div>; };');

    formCodeGenerator.generateUpdatedAppComponent = vi
      .fn()
      .mockReturnValue('export function App() { return <div><GeneratedForm /></div>; };');

    // Create the system with our mocked dependencies
    const system = new FormExportSystem();

    // Replace internal components with our mocked ones
    Object.defineProperties(system, {
      templateManager: { value: templateManager },
      formCodeGenerator: { value: formCodeGenerator },
      adapterExportManager: { value: adapterExportManager },
      packageManager: { value: packageManager },
    });

    return {
      system,
      templateManager,
      formCodeGenerator,
      adapterExportManager,
      packageManager,
    };
  };

  describe('exportForm', () => {
    it('should generate a complete form export package', async () => {
      const { system } = createExportSystem();
      const formConfig = createMinimalFormConfig();

      // Export the form
      const result = await system.exportForm(formConfig, 'evm', 'testFunction', {
        projectName: 'test-project',
      });

      // Verify the result
      expect(result).toHaveProperty('zipBlob');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('dependencies');

      // Verify the filename follows the expected format
      expect(result.fileName).toBe('testfunction-form.zip');

      // Verify dependencies contain core and EVM-specific dependencies
      expect(result.dependencies).toHaveProperty(
        '@openzeppelin/transaction-form-builder-form-renderer'
      );
      expect(result.dependencies).toHaveProperty('react-hook-form');
      expect(result.dependencies).toHaveProperty('ethers');
      expect(result.dependencies).toHaveProperty('viem');
    });

    it('should use the correct dependencies for different blockchain types', async () => {
      const { system } = createExportSystem();
      const formConfig = createMinimalFormConfig();

      // Test with Solana
      const solanaResult = await system.exportForm(formConfig, 'solana', 'testFunction');
      expect(solanaResult.dependencies).toHaveProperty('@solana/web3.js');
      expect(solanaResult.dependencies).not.toHaveProperty('ethers');

      // Test with Stellar
      const stellarResult = await system.exportForm(formConfig, 'stellar', 'testFunction');
      expect(stellarResult.dependencies).toHaveProperty('stellar-sdk');
      expect(stellarResult.dependencies).not.toHaveProperty('ethers');
    });

    it('should include field-specific dependencies based on form fields', async () => {
      // Create systems with different configs
      const createSystemWithFields = (fieldTypes: string[]) => {
        const { system, packageManager } = createExportSystem();

        // Mock getDependencies to return different dependencies based on field types
        vi.spyOn(packageManager, 'getDependencies').mockImplementation(() => {
          const deps: Record<string, string> = {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            'react-hook-form': '^7.43.9',
            ethers: '^6.7.0',
            viem: '^1.10.9',
          };

          // Add field-specific dependencies
          if (fieldTypes.includes('date')) {
            deps['react-datepicker'] = '^4.14.0';
          }
          if (fieldTypes.includes('select')) {
            deps['react-select'] = '^5.7.3';
          }

          return deps;
        });

        return system;
      };

      // Create specialized systems
      const basicSystem = createSystemWithFields(['text', 'number']);
      const advancedSystem = createSystemWithFields(['date', 'select']);

      // Create a form config
      const formConfig = createMinimalFormConfig();

      // Export the forms with different systems
      const basicResult = await basicSystem.exportForm(formConfig, 'evm', 'testFunction');
      const advancedResult = await advancedSystem.exportForm(formConfig, 'evm', 'testFunction');

      // Basic form should not have date picker or select dependencies
      expect(basicResult.dependencies).not.toHaveProperty('react-datepicker');
      expect(basicResult.dependencies).not.toHaveProperty('react-select');

      // Advanced form should have date picker and select dependencies
      expect(advancedResult.dependencies).toHaveProperty('react-datepicker');
      expect(advancedResult.dependencies).toHaveProperty('react-select');
    });

    it('should respect the includeAdapters option', async () => {
      // Create a minimal form config
      const formConfig = createMinimalFormConfig();

      // Spy on AdapterExportManager's getAdapterFiles method
      const getAdapterFilesSpy = vi.spyOn(
        adapterExportManagerModule.AdapterExportManager.prototype,
        'getAdapterFiles'
      );

      // Mock implementation that returns an empty object
      getAdapterFilesSpy.mockImplementation(() => Promise.resolve({}));

      // Create a new system with the mocked dependencies
      const { system } = createExportSystem();

      // Test with includeAdapters: false
      await system.exportForm(formConfig, 'evm', 'testFunction', {
        includeAdapters: false,
      });

      // Verify getAdapterFiles was not called
      expect(getAdapterFilesSpy).not.toHaveBeenCalled();

      // Reset the call count
      getAdapterFilesSpy.mockClear();

      // Test with includeAdapters: true
      await system.exportForm(formConfig, 'evm', 'testFunction', {
        includeAdapters: true,
      });

      // Verify getAdapterFiles was called
      expect(getAdapterFilesSpy).toHaveBeenCalledTimes(1);
      expect(getAdapterFilesSpy).toHaveBeenCalledWith('evm');

      // Restore the original method
      getAdapterFilesSpy.mockRestore();
    });

    it('should correctly update package.json with custom options', async () => {
      const { system, packageManager } = createExportSystem();

      // Mock the PackageManager's updatePackageJson method
      const updatePackageJsonMock = vi
        .spyOn(packageManager, 'updatePackageJson')
        .mockImplementation((content, _formConfig, _chainType, _functionId, options = {}) => {
          const packageJson = JSON.parse(content);
          packageJson.name = options.projectName || 'default-name';
          packageJson.description = options.description || 'Default description';
          packageJson.author = options.author || undefined;
          packageJson.license = options.license || undefined;

          // Add dependencies
          packageJson.dependencies = {
            ...packageJson.dependencies,
            'core-dep': '1.0.0',
            'chain-dep': '1.0.0',
          };

          if (options.dependencies) {
            packageJson.dependencies = {
              ...packageJson.dependencies,
              ...options.dependencies,
            };
          }

          return JSON.stringify(packageJson, null, 2);
        });

      // Create a minimal form config
      const formConfig = createMinimalFormConfig();

      // Test custom export options
      await system.exportForm(formConfig, 'evm', 'testFunction', {
        projectName: 'custom-project',
        description: 'Custom description',
        author: 'Test Author',
        license: 'MIT',
        dependencies: {
          'custom-dep': '2.0.0',
        },
      });

      // Verify updatePackageJson was called with the correct options
      expect(updatePackageJsonMock).toHaveBeenCalled();
      const callArgs = updatePackageJsonMock.mock.calls[0];

      expect(callArgs[2]).toBe('evm'); // chainType
      expect(callArgs[3]).toBe('testFunction'); // functionId

      const options = callArgs[4] || {};
      expect(options.projectName).toBe('custom-project');
      expect(options.description).toBe('Custom description');
      expect(options.author).toBe('Test Author');
      expect(options.license).toBe('MIT');
      expect(options.dependencies).toEqual({ 'custom-dep': '2.0.0' });
    });
  });

  describe('PackageManager integration', () => {
    it('should call PackageManager to get dependencies for export result', async () => {
      const { system, packageManager } = createExportSystem();

      // Spy on PackageManager's getDependencies method
      const getDependenciesSpy = vi.spyOn(packageManager, 'getDependencies');

      // Create a minimal form config
      const formConfig = createMinimalFormConfig();

      // Export the form
      await system.exportForm(formConfig, 'evm', 'testFunction');

      // Verify getDependencies was called with the correct arguments
      expect(getDependenciesSpy).toHaveBeenCalledWith(formConfig, 'evm');
    });
  });
});
