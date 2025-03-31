import { describe, expect, it } from 'vitest';

import { FormExportSystem } from '../FormExportSystem';
import { createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip, validateExportedProject } from '../utils/zipInspector';

describe('FormExportValidation', () => {
  it('should export a valid EVM project structure', async () => {
    // Create the export system
    const exportSystem = new FormExportSystem();

    // Create a test form config
    const formConfig = createMinimalFormConfig('transfer', 'evm');

    // Export the form
    const result = await exportSystem.exportForm(formConfig, 'evm', 'transfer');

    // Extract files from the ZIP using result.data
    expect(result.data).toBeDefined();
    const files = await extractFilesFromZip(result.data);

    // Validate the project structure
    const validation = validateExportedProject(files, {
      requiredFiles: [
        'package.json',
        'src/App.tsx',
        'src/components/GeneratedForm.tsx',
        'src/adapters/evm/adapter.ts',
        'src/adapters/index.ts',
      ],
      contentValidations: {
        'package.json': (content) => {
          try {
            const pkg = JSON.parse(content);
            return pkg.dependencies &&
              (pkg.dependencies['@openzeppelin/transaction-form-renderer'] ||
                pkg.dependencies['@openzeppelin/transaction-form-builder-form-renderer'])
              ? true
              : 'Form renderer dependency not found';
          } catch (e) {
            return `Invalid JSON in package.json: ${String(e)}`;
          }
        },
        'src/components/GeneratedForm.tsx': (content) =>
          content.includes('TransactionForm') || 'TransactionForm component not used',
        'src/App.tsx': (content) =>
          content.includes('GeneratedForm') || 'GeneratedForm not imported in App',
        'src/adapters/index.ts': (content) =>
          content.includes('EvmAdapter') || 'EvmAdapter not exported',
      },
      contentPatterns: {
        'src/adapters/evm/adapter.ts': /EvmAdapter/,
      },
    });

    // Log validation results for debugging
    if (!validation.isValid) {
      console.error('Export validation errors:', validation.errors);
    }

    // Verify the validation passed
    expect(validation.isValid).toBe(true);

    // Verify key files exist and have proper content
    expect(files['src/components/GeneratedForm.tsx']).toContain('TransactionForm');
    expect(files['src/App.tsx']).toContain('GeneratedForm');
    expect(files['src/adapters/index.ts']).toContain('EvmAdapter');

    // Verify package.json has the right structure
    const packageJson = JSON.parse(files['package.json']);
    expect(packageJson).toHaveProperty('name');
    expect(packageJson).toHaveProperty('version');
    expect(packageJson).toHaveProperty('dependencies');
  });

  it('should export a valid Solana project structure', async () => {
    // Create the export system
    const exportSystem = new FormExportSystem();

    // Create a test form config
    const formConfig = createMinimalFormConfig('solanaTransfer', 'solana');

    // Export the form
    const result = await exportSystem.exportForm(formConfig, 'solana', 'solanaTransfer');

    // Extract files from the ZIP using result.data
    expect(result.data).toBeDefined();
    const files = await extractFilesFromZip(result.data);

    // Validate the project structure
    const validation = validateExportedProject(files, {
      requiredFiles: [
        'package.json',
        'src/App.tsx',
        'src/components/GeneratedForm.tsx',
        'src/adapters/solana/adapter.ts',
        'src/adapters/index.ts',
      ],
      contentValidations: {
        'src/adapters/index.ts': (content) =>
          content.includes('solana') || 'Solana adapter not exported',
      },
    });

    // Log validation results for debugging
    if (!validation.isValid) {
      console.error('Export validation errors:', validation.errors);
    }

    // Verify the validation passed
    expect(validation.isValid).toBe(true);

    // Verify the adapter export includes the correct adapter
    expect(files['src/adapters/index.ts']).toContain('solana');
  });
});
