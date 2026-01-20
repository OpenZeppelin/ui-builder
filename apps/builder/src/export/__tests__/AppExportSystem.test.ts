import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ecosystem, EvmNetworkConfig, SolanaNetworkConfig } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import type { ExportOptions } from '../../core/types/ExportTypes';
import type { BuilderFormConfig } from '../../core/types/FormTypes';
import { AppExportSystem } from '../AppExportSystem';
import { AppCodeGenerator } from '../generators/AppCodeGenerator';
import { TemplateProcessor } from '../generators/TemplateProcessor';
import { PackageManager } from '../PackageManager';
import { StyleManager } from '../StyleManager';
import { TemplateManager } from '../TemplateManager';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { ZipGenerator } from '../ZipGenerator';

// Mock RendererConfig (define before use)
interface MockRendererConfig {
  coreDependencies: Record<string, string>;
  fieldDependencies: Record<
    string,
    { runtimeDependencies: Record<string, string>; devDependencies?: Record<string, string> }
  >;
}
const mockRendererConfig: MockRendererConfig = {
  coreDependencies: {
    /* ... */
  },
  fieldDependencies: {
    /* ... */
  },
};

// Define mock network config
const mockEvmNetworkConfig: EvmNetworkConfig = {
  id: 'test-fesyse-evm',
  name: 'Test FESys EVM',
  exportConstName: 'mockEvmNetworkConfig',
  ecosystem: 'evm',
  network: 'ethereum',
  type: 'testnet',
  isTestnet: true,
  chainId: 1337,
  rpcUrl: 'http://localhost:8545',
  nativeCurrency: { name: 'TETH', symbol: 'TETH', decimals: 18 },
  apiUrl: '',
};

/**
 * Unit tests for the AppExportSystem class
 */
describe('AppExportSystem', () => {
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

  // Create a mock package.json content
  const mockPackageJson = JSON.stringify({
    name: 'template-project',
    description: 'Template description',
    dependencies: {},
    devDependencies: {},
  });

  // Create a system with the provided dependencies
  const createExportSystem = () => {
    const templateManager = new TemplateManager();
    const appCodeGenerator = new AppCodeGenerator();
    const styleManager = new StyleManager();
    const zipGenerator = new ZipGenerator();
    const templateProcessor = new TemplateProcessor({});

    // Mock PackageManager instance
    const packageManager = {
      getDependencies: vi
        .fn()
        .mockImplementation(async (_formConfig: BuilderFormConfig, ecosystem: Ecosystem) => {
          // Simulate dependency logic: return base + adapter with correct versions
          const baseDeps = {
            react: '^19.0.0', // Correct version for assertion
            '@openzeppelin/ui-renderer': 'workspace:*', // Use consistent placeholder version
            '@openzeppelin/ui-types': 'workspace:*', // Use consistent placeholder version
          };
          const adapterDep = `@openzeppelin/ui-builder-adapter-${ecosystem}`;
          return Promise.resolve({ ...baseDeps, [adapterDep]: 'workspace:*' });
        }),
      updatePackageJson: vi
        .fn()
        .mockImplementation(
          async (
            originalContent: string,
            _formConfig: BuilderFormConfig,
            ecosystem: Ecosystem,
            functionId: string,
            options?: Partial<ExportOptions>
          ) => {
            const packageJson = JSON.parse(originalContent);
            // Apply options correctly
            packageJson.name = options?.projectName || `${functionId}-form`; // Use projectName from options
            packageJson.description = options?.description || _formConfig?.description || ''; // Use optional chaining for safety
            packageJson.author = options?.author || '';
            packageJson.license = options?.license || 'UNLICENSED';
            // Get deps and merge
            const newDeps = await packageManager.getDependencies(_formConfig, ecosystem);
            packageJson.dependencies = {
              ...(packageJson.dependencies || {}),
              ...newDeps,
              ...(options?.dependencies || {}),
            };
            return JSON.stringify(packageJson, null, 2);
          }
        ),
      loadRendererConfig: vi.fn().mockResolvedValue(mockRendererConfig),
    } as unknown as PackageManager;

    // Mock ZipGenerator
    const createZipFileSpy = vi
      .spyOn(zipGenerator, 'createZipFile')
      .mockImplementation(async (_files, fileName, _options) => {
        return { data: Buffer.from([1, 2, 3, 4]), fileName: fileName }; // Return passed filename
      });

    // --- Mock/Spy on other dependencies' methods ---
    vi.spyOn(templateManager, 'createProject').mockResolvedValue({
      'package.json': mockPackageJson,
      'index.html': '<html>...</html>',
      'src/styles.css': '/* Template styles */',
    });
    const generateFormComponentSpy = vi
      .spyOn(appCodeGenerator, 'generateFormComponent')
      .mockResolvedValue('/* Mock Form */');

    // Create the system instance, injecting mocks
    const system = new AppExportSystem({
      templateManager,
      appCodeGenerator,
      packageManager, // Inject the mock object
      styleManager,
      zipGenerator,
      templateProcessor,
    });

    return {
      system,
      mocks: {
        templateManager,
        appCodeGenerator,
        packageManager, // Return the mock object
        styleManager,
        zipGenerator,
        templateProcessor,
        createZipFileSpy,
        generateFormComponentSpy,
      },
    };
  };

  describe('exportApp', () => {
    it('should generate a complete app export package', async () => {
      const { system } = createExportSystem();
      const formConfig = createMinimalFormConfig();
      const contractSchema = createMinimalContractSchema('testFunction', 'evm');

      const result = await system.exportApp(
        formConfig,
        contractSchema,
        mockEvmNetworkConfig,
        'testFunction',
        {
          projectName: 'test-project',
        }
      );

      // Verify the result structure using 'data'
      expect(result).toHaveProperty('data'); // Updated property name
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('dependencies');
      expect(result.fileName).toBe('testfunction-form.zip');
      expect(Buffer.isBuffer(result.data)).toBe(true); // Check for Buffer

      // Verify dependencies contain types, renderer, and EVM adapter packages
      // Check PRESENCE only, as applyVersioningStrategy might change value
      expect(result.dependencies).toHaveProperty('@openzeppelin/ui-renderer');
      expect(result.dependencies).toHaveProperty('@openzeppelin/ui-types');
      expect(result.dependencies).toHaveProperty('@openzeppelin/ui-builder-adapter-evm');
      // Check a base dependency from the mock config is still present
      expect(result.dependencies).toHaveProperty('react', '^19.0.0');
    });

    it('should use the correct dependencies for different blockchain types', async () => {
      const { system } = createExportSystem();
      const formConfig = createMinimalFormConfig();
      const contractSchemaEvm = createMinimalContractSchema('testFunction', 'evm');
      const contractSchemaSol = createMinimalContractSchema('testFunction', 'solana');
      const funcId = 'testFunction';

      // Define Solana mock config
      const mockSolanaConfig = {
        id: 'test-solana-dep',
        name: 'Test Solana Dep',
        exportConstName: 'mockSolanaConfig',
        ecosystem: 'solana' as const,
        network: 'solana',
        type: 'testnet' as const,
        isTestnet: true,
        rpcEndpoint: 'mock',
        commitment: 'confirmed' as const,
      } as SolanaNetworkConfig;

      // Test with Solana config
      const solanaResult = await system.exportApp(
        formConfig,
        contractSchemaSol,
        mockSolanaConfig,
        funcId
      );
      expect(solanaResult.dependencies).toHaveProperty(
        '@openzeppelin/ui-builder-adapter-solana',
        'workspace:*'
      );
      expect(solanaResult.dependencies).not.toHaveProperty('@openzeppelin/ui-builder-adapter-evm');

      // Test with EVM config (use the mock defined at top level)
      const evmResult = await system.exportApp(
        formConfig,
        contractSchemaEvm,
        mockEvmNetworkConfig,
        funcId
      );
      expect(evmResult.dependencies).toHaveProperty(
        '@openzeppelin/ui-builder-adapter-evm',
        'workspace:*'
      );
      expect(evmResult.dependencies).not.toHaveProperty('@openzeppelin/ui-builder-adapter-solana');
    });

    it('should include field-specific dependencies based on form fields', async () => {
      // Create systems with different configs
      const createSystemWithFields = (fieldTypes: string[]) => {
        const { system, mocks } = createExportSystem();

        // Mock getDependencies to return different dependencies based on field types
        vi.spyOn(mocks.packageManager, 'getDependencies').mockImplementation(async () => {
          const deps: Record<string, string> = {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            'react-hook-form': '^7.43.9',
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
      const contractSchema = createMinimalContractSchema('testFunction', 'evm');

      // Export the forms with different systems
      const basicResult = await basicSystem.exportApp(
        formConfig,
        contractSchema,
        mockEvmNetworkConfig,
        'testFunction'
      );
      const advancedResult = await advancedSystem.exportApp(
        formConfig,
        contractSchema,
        mockEvmNetworkConfig,
        'testFunction'
      );

      // Basic form should not have date picker or select dependencies
      expect(basicResult.dependencies).not.toHaveProperty('react-datepicker');
      expect(basicResult.dependencies).not.toHaveProperty('react-select');

      // Advanced form should have date picker and select dependencies
      expect(advancedResult.dependencies).toHaveProperty('react-datepicker');
      expect(advancedResult.dependencies).toHaveProperty('react-select');
    });

    it('should correctly update package.json with custom options', async () => {
      // Get system and spy
      const { system, mocks } = createExportSystem();
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
      const contractSchema = createMinimalContractSchema('testFunction', 'evm');
      await system.exportApp(
        formConfig,
        contractSchema,
        mockEvmNetworkConfig,
        'testFunction',
        customOptions
      );
      expect(mocks.createZipFileSpy).toHaveBeenCalled();
      const filesPassedToZip = mocks.createZipFileSpy.mock.calls[0][0] as Record<string, string>; // Type assertion
      const finalPackageJson = JSON.parse(filesPassedToZip['package.json']);

      // Assertions
      expect(finalPackageJson.name).toBe('custom-project');
      expect(finalPackageJson.description).toBe('Custom description');
      expect(finalPackageJson.author).toBe('Test Author');
      expect(finalPackageJson.license).toBe('MIT');
      expect(finalPackageJson.dependencies).toHaveProperty('custom-lib', '^1.0.0');
      expect(finalPackageJson.dependencies).toHaveProperty('react'); // Verify core deps still present
    });

    it('should call PackageManager to get dependencies for export result', async () => {
      // Correctly destructure mocks
      const { system, mocks } = createExportSystem();
      // Spy on the *instance* provided by the helper
      const getDependenciesSpy = vi.spyOn(mocks.packageManager, 'getDependencies');
      const formConfig = createMinimalFormConfig();
      const contractSchema = createMinimalContractSchema('testFunction', 'evm');
      await system.exportApp(formConfig, contractSchema, mockEvmNetworkConfig, 'testFunction');
      expect(getDependenciesSpy).toHaveBeenCalledWith(formConfig, 'evm');
    });

    it('should handle errors during ZIP generation', async () => {
      const { system, mocks } = createExportSystem();
      // Mock the method implementation on the instance to throw an error
      vi.spyOn(mocks.zipGenerator, 'createZipFile').mockRejectedValue(new Error('Zip Error'));
      const formConfig = createMinimalFormConfig();
      const contractSchema = createMinimalContractSchema('testFunction', 'evm');
      const funcId = 'testFunction'; // Define funcId

      await expect(
        system.exportApp(formConfig, contractSchema, mockEvmNetworkConfig, funcId)
      ).rejects.toThrow('Zip Error');
    });
  });
});
