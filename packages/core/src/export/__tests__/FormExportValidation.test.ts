import { describe, expect, it } from 'vitest';

import { FormExportSystem } from '../FormExportSystem';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip, validateExportedProject } from '../utils/zipInspector';

describe('FormExportValidation', () => {
  it('should export a valid EVM project structure', async () => {
    // Create the export system
    const exportSystem = new FormExportSystem();

    // Create a test form config
    const formConfig = createMinimalFormConfig('transfer', 'evm');
    const contractSchema = createMinimalContractSchema('transfer', 'evm');

    // Export the form
    const result = await exportSystem.exportForm(formConfig, contractSchema, 'evm', 'transfer');

    // Extract files from the ZIP using result.data
    expect(result.data).toBeDefined();
    const files = await extractFilesFromZip(result.data as Blob);

    // Validate the project structure
    const validation = validateExportedProject(files, {
      requiredFiles: ['package.json', 'src/App.tsx', 'src/components/GeneratedForm.tsx'],
      contentValidations: {
        'package.json': (content) => {
          try {
            const pkg = JSON.parse(content);
            const deps = pkg.dependencies || {};
            if (!deps['@openzeppelin/transaction-form-renderer'])
              return 'Missing @openzeppelin/transaction-form-renderer dependency';
            if (!deps['@openzeppelin/transaction-form-types'])
              return 'Missing @openzeppelin/transaction-form-types dependency';
            if (!deps['@openzeppelin/transaction-form-adapter-evm'])
              return 'Missing @openzeppelin/transaction-form-adapter-evm dependency';
            return true;
          } catch (e) {
            return `Invalid JSON in package.json: ${String(e)}`;
          }
        },
        'src/components/GeneratedForm.tsx': (content) =>
          content.includes('TransactionForm') || 'TransactionForm component not used',
        'src/App.tsx': (content) =>
          content.includes('GeneratedForm') || 'GeneratedForm not imported in App',
      },
    });

    // Log validation results for debugging
    if (validation.errors) {
      console.error('EVM Export validation errors:', validation.errors);
    }

    // Verify the validation passed
    expect(validation.isValid).toBe(true);

    // Verify package.json has the right structure and dependencies
    const packageJson = JSON.parse(files['package.json']);
    expect(packageJson).toHaveProperty('name');
    expect(packageJson).toHaveProperty('dependencies');
    expect(packageJson.dependencies).toHaveProperty('@openzeppelin/transaction-form-adapter-evm');
    expect(packageJson.dependencies).toHaveProperty('@openzeppelin/transaction-form-types');
  });

  it('should export a valid Solana project structure', async () => {
    // Create the export system
    const exportSystem = new FormExportSystem();

    // Create a test form config
    const formConfig = createMinimalFormConfig('solanaTransfer', 'solana');
    const contractSchema = createMinimalContractSchema('solanaTransfer', 'solana');

    // Export the form
    const result = await exportSystem.exportForm(
      formConfig,
      contractSchema,
      'solana',
      'solanaTransfer'
    );

    // Extract files from the ZIP using result.data
    expect(result.data).toBeDefined();
    const files = await extractFilesFromZip(result.data as Blob);

    // Validate the project structure
    const validation = validateExportedProject(files, {
      requiredFiles: ['package.json', 'src/App.tsx', 'src/components/GeneratedForm.tsx'],
      contentValidations: {
        'package.json': (content) => {
          try {
            const pkg = JSON.parse(content);
            const deps = pkg.dependencies || {};
            if (!deps['@openzeppelin/transaction-form-renderer'])
              return 'Missing @openzeppelin/transaction-form-renderer dependency';
            if (!deps['@openzeppelin/transaction-form-types'])
              return 'Missing @openzeppelin/transaction-form-types dependency';
            if (!deps['@openzeppelin/transaction-form-adapter-solana'])
              return 'Missing @openzeppelin/transaction-form-adapter-solana dependency';
            return true;
          } catch (e) {
            return `Invalid JSON in package.json: ${String(e)}`;
          }
        },
      },
    });

    // Log validation results for debugging
    if (validation.errors) {
      console.error('Solana Export validation errors:', validation.errors);
    }

    // Verify the validation passed
    expect(validation.isValid).toBe(true);
  });
});
