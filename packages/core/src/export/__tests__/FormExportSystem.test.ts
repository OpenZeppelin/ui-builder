import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdapterConfig } from '../../core/types/AdapterTypes';
import type { BuilderFormConfig } from '../../core/types/FormTypes';
import { logger } from '../../core/utils/logger';
import { AdapterExportManager } from '../AdapterExportManager';
import { FormExportSystem } from '../FormExportSystem';
import { PackageManager } from '../PackageManager';
import { StyleManager } from '../StyleManager';
import { TemplateManager } from '../TemplateManager';
import { ZipGenerator } from '../ZipGenerator';
import { FormCodeGenerator } from '../generators/FormCodeGenerator';
import { TemplateProcessor } from '../generators/TemplateProcessor';

// Mock FormRendererConfig since it's not exported from the main package entry
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

  beforeEach(() => {
    // Disable logging during tests
    logger.configure({ enabled: false });
  });

  afterEach(() => {
    // Reset logger configuration after each test
    logger.configure({ enabled: true, level: 'info' });
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
      '@openzeppelin/transaction-form-renderer': '^1.0.0',
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
    // Create REAL instances of dependencies
    const templateManager = new TemplateManager();
    const formCodeGenerator = new FormCodeGenerator();
    const adapterExportManager = new AdapterExportManager();
    const packageManager = new PackageManager(
      mockAdapterConfigs,
      mockFormRendererConfig as MockFormRendererConfig
    );
    const styleManager = new StyleManager();
    const zipGenerator = new ZipGenerator();
    const templateProcessor = new TemplateProcessor({});

    // --- Mock/Spy on specific methods needed for tests ---

    // Mock TemplateManager's createProject
    vi.spyOn(templateManager, 'createProject').mockImplementation(
      async (_templateName, customFiles, _options) => {
        // Return base files PLUS the custom files passed in
        return {
          'package.json': mockPackageJson,
          'index.html': '<html>...</html>',
          'src/styles.css': '/* Template styles */',
          // Ensure customFiles (like adapters, generated form) overwrite if necessary
          ...customFiles,
        };
      }
    );

    // Mock FormCodeGenerator methods
    vi.spyOn(formCodeGenerator, 'generateFormComponent').mockResolvedValue(
      '/* Mock Form Component */'
    );
    vi.spyOn(formCodeGenerator, 'generateUpdatedAppComponent').mockResolvedValue(
      '/* Mock App Component */'
    );

    // Spy on ZipGenerator's createZipFile
    const createZipFileSpy = vi
      .spyOn(zipGenerator, 'createZipFile')
      .mockImplementation(async (_files, fileName, _options) => {
        return {
          data: Buffer.from('mock zip content'),
          fileName: fileName,
        };
      });
    // --- End Mocks/Spies ---

    // Create the system instance, injecting the REAL (but potentially spied) dependencies
    const system = new FormExportSystem({
      templateManager,
      formCodeGenerator,
      adapterExportManager,
      packageManager,
      styleManager,
      zipGenerator, // Inject instance with the spied method
      templateProcessor,
    });

    return {
      system,
      packageManager,
      createZipFileSpy,
    };
  };

  describe('exportForm', () => {
    it('should generate a complete form export package', async () => {
      const { system } = createExportSystem();
      const formConfig = createMinimalFormConfig();

      const result = await system.exportForm(formConfig, 'evm', 'testFunction', {
        projectName: 'test-project',
      });

      // Verify the result structure using 'data'
      expect(result).toHaveProperty('data'); // Updated property name
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('dependencies');
      expect(result.fileName).toBe('testfunction-form.zip');
      expect(Buffer.isBuffer(result.data)).toBe(true); // Check for Buffer

      // Verify dependencies contain core and EVM-specific dependencies
      expect(result.dependencies).toHaveProperty('@openzeppelin/transaction-form-renderer');
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
      // Get system and the spy
      const { system, createZipFileSpy } = createExportSystem();
      const formConfig = createMinimalFormConfig();

      // --- Test Case 1: includeAdapters: false ---
      await system.exportForm(formConfig, 'evm', 'testFunction', { includeAdapters: false });
      expect(createZipFileSpy).toHaveBeenCalled();
      const filesPassedWhenFalse = createZipFileSpy.mock.calls[0][0] as Record<string, string>; // Type assertion
      const fileListWhenFalse = Object.keys(filesPassedWhenFalse);
      const hasAnyAdapterFile = fileListWhenFalse.some((file) => file.startsWith('src/adapters/'));
      expect(hasAnyAdapterFile).toBe(false);

      // --- Test Case 2: includeAdapters: true (Default) ---
      createZipFileSpy.mockClear();
      const resultWithAdapters = await system.exportForm(formConfig, 'evm', 'testFunction', {
        includeAdapters: true,
      });
      expect(createZipFileSpy).toHaveBeenCalled();
      const filesPassedWhenTrue = createZipFileSpy.mock.calls[0][0] as Record<string, string>; // Type assertion
      const fileListWhenTrue = Object.keys(filesPassedWhenTrue);
      expect(fileListWhenTrue.some((file) => file.includes('src/adapters/evm/adapter.ts'))).toBe(
        true
      );
      expect(fileListWhenTrue.some((file) => file.includes('src/adapters/index.ts'))).toBe(true);
      expect(resultWithAdapters.dependencies).toHaveProperty('ethers');
    });

    it('should correctly update package.json with custom options', async () => {
      // Get system and spy
      const { system, createZipFileSpy } = createExportSystem();
      const formConfig = createMinimalFormConfig();
      const customOptions = {
        projectName: 'custom-project',
        description: 'Custom description',
        author: 'Test Author',
        license: 'MIT',
        dependencies: {
          'custom-lib': '^1.0.0',
        },
      };

      await system.exportForm(formConfig, 'evm', 'testFunction', customOptions);
      expect(createZipFileSpy).toHaveBeenCalled();
      const filesPassedToZip = createZipFileSpy.mock.calls[0][0] as Record<string, string>; // Type assertion
      const finalPackageJson = JSON.parse(filesPassedToZip['package.json']);

      // Assertions
      expect(finalPackageJson.name).toBe('custom-project');
      expect(finalPackageJson.description).toBe('Custom description');
      expect(finalPackageJson.author).toBe('Test Author');
      expect(finalPackageJson.license).toBe('MIT');
      expect(finalPackageJson.dependencies).toHaveProperty('custom-lib', '^1.0.0');
      expect(finalPackageJson.dependencies).toHaveProperty('react'); // Verify core deps still present
    });
  });

  describe('PackageManager integration', () => {
    it('should call PackageManager to get dependencies for export result', async () => {
      const { system, packageManager } = createExportSystem();
      const getDependenciesSpy = vi.spyOn(packageManager, 'getDependencies');
      const formConfig = createMinimalFormConfig();

      await system.exportForm(formConfig, 'evm', 'testFunction');

      expect(getDependenciesSpy).toHaveBeenCalled();
      expect(getDependenciesSpy).toHaveBeenCalledWith(formConfig, 'evm');
    });
  });
});
