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

import { logger } from '../../core/utils/logger';
import { FormExportSystem } from '../FormExportSystem';
import { createComplexFormConfig, createMinimalFormConfig } from '../utils/testConfig';

import type { ChainType } from '../../core/types/ContractSchema';

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
    try {
      // Only log cleanup messages if running from CLI
      if (isRunningFromCLI) {
        logger.info('CLI Wrapper Test', 'Running cleanup...');
      }
      createdFiles.forEach((file) => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          if (isRunningFromCLI) {
            logger.info('CLI Wrapper Test', `Cleaned up test artifact: ${file}`);
          }
        }
      });

      // Check if exports directory is empty and remove it if it is
      const defaultExportDir = path.resolve('./exports');
      if (fs.existsSync(defaultExportDir)) {
        const files = fs.readdirSync(defaultExportDir);
        if (files.length === 0) {
          fs.rmdirSync(defaultExportDir);
          if (isRunningFromCLI) {
            logger.info('CLI Wrapper Test', 'Removed empty exports directory');
          }
        } else {
          if (isRunningFromCLI) {
            logger.info(
              'CLI Wrapper Test',
              `Export directory not empty, contains ${files.length} files`
            );
          }
        }
      }
    } catch (error) {
      // Log error only if running from CLI
      if (isRunningFromCLI) {
        logger.error('CLI Wrapper Test', 'Error during cleanup:', error);
      }
    }
  });

  it('exports a form with provided configuration', async () => {
    // Read configuration from environment variables
    const chain = (process.env.EXPORT_TEST_CHAIN || 'evm') as ChainType;
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
      ? createComplexFormConfig(func, chain)
      : createMinimalFormConfig(func, chain);

    // Create export system
    const exportSystem = new FormExportSystem();

    // Generate the export
    const result = await exportSystem.exportForm(formConfig, chain, func, {
      projectName: `${func}-form`,
      template,
      includeAdapters,
      env,
      // Only provide onProgress callback if running from CLI
      onProgress: isRunningFromCLI
        ? (progress) =>
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
      // console.error('Error saving zip file:', error); // Remove logging
      process.exit(1);
    }

    // Return success
    return true;
  });
});
