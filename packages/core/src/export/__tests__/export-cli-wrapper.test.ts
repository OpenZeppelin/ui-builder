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

import { logger } from '@openzeppelin/transaction-form-renderer';
import { Ecosystem } from '@openzeppelin/transaction-form-types';

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

    // Create export system
    const exportSystem = new FormExportSystem();

    // Generate the export
    const result = await exportSystem.exportForm(formConfig, mockContractSchema, ecosystem, func, {
      projectName: `${func}-form`,
      template,
      includeAdapters,
      env,
      isCliBuildTarget: isRunningFromCLI,
      // Only provide onProgress callback if running from CLI
      onProgress: isRunningFromCLI
        ? (progress: ZipProgress) =>
            logger.info(
              'CLI Wrapper Test',
              `Progress: ${progress.percent?.toFixed(1) || '0'}% - ${progress.currentFile || 'unknown'}`
            )
        : undefined,
    });

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
      // console.log( // Remove logging
      //   `Exporting form for chain: ${chain}, function: ${func}, template: ${template}...`
      // ); // Remove logging
      const zip = new JSZip();

      // Load the data (which will be a Buffer in this Node.js context)
      await zip.loadAsync(result.data);

      // Generate as nodebuffer
      const buffer = await zip.generateAsync({ type: 'nodebuffer' });

      // Save the file
      fs.writeFileSync(outputPath, buffer);

      // Track the file for cleanup
      createdFiles.push(outputPath);

      // console.log(`Export saved to: ${outputPath}`); // Remove logging
    } catch (error) {
      logger.error('CLI Wrapper Test', 'Error saving zip file:', error); // Log the error
      throw error; // Re-throw the error to ensure Vitest fails the test
    }

    // Return success (this line won't be reached if an error is thrown)
    return true;
  });
});
