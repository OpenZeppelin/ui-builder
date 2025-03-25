import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import * as adapterExportManagerModule from '../AdapterExportManager';
import { FormExportSystem } from '../FormExportSystem';

import type { BuilderFormConfig } from '../../core/types/FormTypes';

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

  describe('exportForm', () => {
    it('should generate a complete form export package', async () => {
      const system = new FormExportSystem();

      // Create a minimal form config for testing
      const formConfig: BuilderFormConfig = {
        functionId: 'testFunction',
        fields: [
          {
            id: 'param1',
            name: 'param1',
            label: 'Parameter 1',
            type: 'text',
            validation: {
              required: true,
            },
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
      };

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
    });

    it('should use the correct dependencies for different blockchain types', async () => {
      const system = new FormExportSystem();

      // Create a minimal form config
      const formConfig: BuilderFormConfig = {
        functionId: 'testFunction',
        fields: [],
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
      };

      // Test with Solana
      const solanaResult = await system.exportForm(formConfig, 'solana', 'testFunction');
      expect(solanaResult.dependencies).toHaveProperty('@solana/web3.js');
      expect(solanaResult.dependencies).not.toHaveProperty('ethers');

      // Test with Stellar
      const stellarResult = await system.exportForm(formConfig, 'stellar', 'testFunction');
      expect(stellarResult.dependencies).toHaveProperty('stellar-sdk');
      expect(stellarResult.dependencies).not.toHaveProperty('ethers');
    });

    it('should respect the includeAdapters option', async () => {
      // Create a minimal form config
      const formConfig: BuilderFormConfig = {
        functionId: 'testFunction',
        fields: [],
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
      };

      // Spy on AdapterExportManager's getAdapterFiles method
      const getAdapterFilesSpy = vi.spyOn(
        adapterExportManagerModule.AdapterExportManager.prototype,
        'getAdapterFiles'
      );

      // Mock implementation that returns an empty object
      getAdapterFilesSpy.mockImplementation(() => ({}));

      // Create a new system with the mocked dependencies
      const system = new FormExportSystem();

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
  });
});
