/**
 * Export CLI Wrapper Test
 *
 * This is a helper test that serves as an interface between the CLI and the export system.
 * This test file can be run with specific environment variables to export a form with the desired configuration.
 */
import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';
import { Ecosystem, NetworkConfig } from '@openzeppelin/transaction-form-types';

// Import ecosystemManager utils
import { getNetworkById, getNetworksByEcosystem } from '../../core/ecosystemManager';
// Import others as needed for different ecosystem tests
// import { solanaDevnet } from '@openzeppelin/transaction-form-adapter-solana';

import { FormExportSystem } from '../FormExportSystem';
import { ZipProgress } from '../ZipGenerator';
import {
  createComplexFormConfig,
  createMinimalContractSchema,
  createMinimalFormConfig,
} from '../utils/testConfig';

// Keep track of created files for cleanup
const createdFiles: string[] = [];

// Check if we're running from the CLI tool
const isRunningFromCLI = process.env.EXPORT_CLI_MODE === 'true';

describe('Export CLI Wrapper', () => {
  beforeEach(() => {
    // Only disable logging when not running from CLI
    if (!isRunningFromCLI) {
      logger.configure({ enabled: false });
    }
  });

  afterEach(() => {
    // Reset logger configuration after each test
    if (!isRunningFromCLI) {
      logger.configure({ enabled: true, level: 'info' });
    }
  });

  // Clean up after all tests complete
  afterAll(() => {
    // Only perform cleanup if NOT running from CLI
    if (!isRunningFromCLI) {
      try {
        createdFiles.forEach((file) => {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        });

        // Check if exports directory is empty and remove it if it is
        const defaultExportDir = path.resolve('./exports');
        if (fs.existsSync(defaultExportDir)) {
          const files = fs.readdirSync(defaultExportDir);
          if (files.length === 0) {
            fs.rmdirSync(defaultExportDir);
          }
        }
      } catch (error) {
        // Log cleanup errors only if running interactively (not from CLI)
        console.error('Error during test cleanup:', error);
      }
    } else {
      // Optional: Log that cleanup is skipped when running from CLI
      logger.info(
        'CLI Wrapper Test',
        'Running in CLI mode, skipping automatic test artifact cleanup.'
      );
    }
  });

  it('exports a form with provided configuration', async () => {
    // Read configuration from environment variables
    const ecosystem = (process.env.EXPORT_TEST_ECOSYSTEM || 'evm') as Ecosystem;
    const networkId = process.env.EXPORT_TEST_NETWORK_ID; // New optional env var
    const func = process.env.EXPORT_TEST_FUNCTION || 'transfer';
    const template = process.env.EXPORT_TEST_TEMPLATE || 'typescript-react-vite';
    const includeAdapters = process.env.EXPORT_TEST_INCLUDE_ADAPTERS !== 'false';
    const isComplex = process.env.EXPORT_TEST_COMPLEX === 'true';
    const outputDir = process.env.EXPORT_TEST_OUTPUT_DIR || './exports';
    const env = (process.env.EXPORT_CLI_ENV || 'local') as 'local' | 'production';

    // console.log('Export configuration:'); // Remove logging
    // console.log(`Chain: ${chain}`); // Remove logging
    // console.log(`Function: ${func}`); // Remove logging
    // console.log(`Template: ${template}`); // Remove logging
    // console.log(`Include Adapters: ${includeAdapters}`); // Remove logging
    // console.log(`Complex Form: ${isComplex}`); // Remove logging
    // console.log(`Output Directory: ${outputDir}`); // Remove logging
    // console.log(`Environment: ${env}`); // Remove logging

    // Create form config
    const formConfig = isComplex
      ? createComplexFormConfig(func, ecosystem)
      : createMinimalFormConfig(func, ecosystem);

    const mockContractSchema = createMinimalContractSchema(func, ecosystem);

    // Select the network config dynamically using ecosystemManager
    let networkConfigToUse: NetworkConfig | undefined;

    if (networkId) {
      logger.info('CLI Wrapper Test', `Attempting to load specific network ID: ${networkId}`);
      networkConfigToUse = await getNetworkById(networkId);
      if (!networkConfigToUse) {
        logger.error('CLI Wrapper Test', `Specified network ID not found: ${networkId}`);
        throw new Error(`Specified network ID not found: ${networkId}`);
      }
      // Optional: Check if the found network's ecosystem matches the one specified, although getNetworkById doesn't require ecosystem
      if (networkConfigToUse.ecosystem !== ecosystem) {
        logger.warn(
          'CLI Wrapper Test',
          `Specified network ID ${networkId} belongs to ecosystem ${networkConfigToUse.ecosystem}, but testing for ${ecosystem}. Proceeding anyway.`
        );
        // Decide whether to throw an error or allow mismatch based on desired strictness
        // throw new Error(`Network ID ${networkId} ecosystem mismatch: expected ${ecosystem}, got ${networkConfigToUse.ecosystem}`);
      }
    } else {
      logger.info(
        'CLI Wrapper Test',
        `No specific network ID provided. Loading networks for ecosystem: ${ecosystem}`
      );
      const networksForEcosystem = await getNetworksByEcosystem(ecosystem);
      if (networksForEcosystem.length > 0) {
        networkConfigToUse = networksForEcosystem[0]; // Default to the first network
        logger.info(
          'CLI Wrapper Test',
          `Using first available network for ${ecosystem}: ${networkConfigToUse.id}`
        );
      } else {
        logger.error('CLI Wrapper Test', `No networks found for ecosystem: ${ecosystem}`);
        throw new Error(`No networks found for ecosystem: ${ecosystem}`);
      }
    }

    // Ensure networkConfigToUse is defined before proceeding
    if (!networkConfigToUse) {
      // This case should theoretically be caught above, but ensures type safety
      throw new Error('Failed to determine network configuration to use.');
    }

    const exportSystem = new FormExportSystem();

    // Pass the actual NetworkConfig object
    const result = await exportSystem.exportForm(
      formConfig,
      mockContractSchema,
      networkConfigToUse,
      func,
      {
        projectName: `${func}-form`,
        template,
        includeAdapters,
        env,
        isCliBuildTarget: isRunningFromCLI,
        onProgress: isRunningFromCLI
          ? (progress: ZipProgress) =>
              logger.info(
                'CLI Wrapper Test',
                `Progress: ${progress.percent?.toFixed(1) || '0'}% - ${progress.currentFile || 'unknown'}`
              )
          : undefined,
      }
    );

    // Ensure we have a valid result
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.fileName).toBeDefined();
    expect(result.dependencies).toBeDefined();

    // Save the export
    const outputPath = path.resolve(outputDir, result.fileName);

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Use JSZip to directly save the zip file
    try {
      const zip = new JSZip();

      // Load the data (which will be a Buffer in this Node.js context)
      await zip.loadAsync(result.data);

      // Generate as nodebuffer
      const buffer = await zip.generateAsync({ type: 'nodebuffer' });

      // Save the file
      fs.writeFileSync(outputPath, buffer);

      // Track the file for cleanup
      createdFiles.push(outputPath);
    } catch (error) {
      logger.error('CLI Wrapper Test', 'Error saving zip file:', error);
      throw error;
    }

    // Return success (this line won't be reached if an error is thrown)
    return true;
  });
});
