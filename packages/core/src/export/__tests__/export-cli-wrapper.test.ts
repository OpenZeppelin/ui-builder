/**
 * Export CLI Wrapper Test
 *
 * This is a helper test that serves as an interface between the CLI and the export system.
 * This test file can be run with specific environment variables to export a form with the desired configuration.
 */

import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import { afterAll, describe, expect, it } from 'vitest';

import { FormExportSystem } from '../FormExportSystem';
import { createComplexFormConfig, createMinimalFormConfig } from '../utils/testConfig';

import type { ChainType } from '../../core/types/ContractSchema';

// Keep track of created files for cleanup
const createdFiles: string[] = [];

// Check if we're running from the CLI tool
const isRunningFromCLI = process.env.EXPORT_CLI_MODE === 'true';

describe('Export CLI Wrapper', () => {
  // Clean up after all tests complete
  afterAll(() => {
    // Skip cleanup when running from CLI
    if (isRunningFromCLI) {
      console.log('Running in CLI mode - skipping cleanup to preserve export files');
      return;
    }

    try {
      // Delete any files created during testing
      createdFiles.forEach((filePath) => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up test artifact: ${filePath}`);
        }
      });

      // Check if exports directory is empty and remove it if it is
      const defaultExportDir = path.resolve('./exports');
      if (fs.existsSync(defaultExportDir)) {
        const files = fs.readdirSync(defaultExportDir);
        if (files.length === 0) {
          fs.rmdirSync(defaultExportDir);
          console.log('Removed empty exports directory');
        } else {
          console.log(`Export directory not empty, contains ${files.length} files`);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
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

    console.log('Export configuration:');
    console.log(`Chain: ${chain}`);
    console.log(`Function: ${func}`);
    console.log(`Template: ${template}`);
    console.log(`Include Adapters: ${includeAdapters}`);
    console.log(`Complex Form: ${isComplex}`);
    console.log(`Output Directory: ${outputDir}`);

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
      onProgress: (progress) =>
        console.log(
          `Progress: ${progress.percent?.toFixed(1) || '0'}% - ${progress.currentFile || 'unknown'}`
        ),
    });

    // Ensure we have a valid result
    expect(result).toBeDefined();
    expect(result.zipBlob).toBeDefined();
    expect(result.fileName).toBeDefined();

    // Save the export
    const outputPath = path.resolve(outputDir, result.fileName);

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Use JSZip to directly save the zip file
    try {
      const zip = new JSZip();
      // Load the blob into a zip
      await zip.loadAsync(result.zipBlob);
      // Generate as nodebuffer (works in Node.js environment)
      const buffer = await zip.generateAsync({ type: 'nodebuffer' });
      // Save the file
      fs.writeFileSync(outputPath, buffer);

      // Track the file for cleanup
      createdFiles.push(outputPath);

      console.log(`Export saved to: ${outputPath}`);
    } catch (error) {
      console.error('Error saving zip file:', error);
      throw error;
    }

    // Return success
    return true;
  });
});
