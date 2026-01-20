import { describe, expect, it } from 'vitest';

import type { EvmNetworkConfig, SolanaNetworkConfig } from '@openzeppelin/ui-types';

import { AppExportSystem } from '../AppExportSystem';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip, validateExportedProject } from '../utils/zipInspector';

// Define mock network config
const mockEvmNetworkConfig: EvmNetworkConfig = {
  id: 'test-export-validation-evm',
  name: 'Test Export Validation EVM',
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

describe('AppExportValidation', () => {
  it('should export a valid EVM project structure', async () => {
    // Create the export system
    const exportSystem = new AppExportSystem();

    // Create a test form config
    const formConfig = createMinimalFormConfig('transfer', 'evm');
    const contractSchema = createMinimalContractSchema('transfer', 'evm');

    // Export the form
    const result = await exportSystem.exportApp(
      formConfig,
      contractSchema,
      mockEvmNetworkConfig,
      'transfer'
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
            if (!deps['@openzeppelin/ui-renderer'])
              return 'Missing @openzeppelin/ui-renderer dependency';
            if (!deps['@openzeppelin/ui-types']) return 'Missing @openzeppelin/ui-types dependency';
            if (!deps['@openzeppelin/ui-builder-adapter-evm'])
              return 'Missing @openzeppelin/ui-builder-adapter-evm dependency';
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
    expect(packageJson.dependencies).toHaveProperty('@openzeppelin/ui-builder-adapter-evm');
    expect(packageJson.dependencies).toHaveProperty('@openzeppelin/ui-types');
  });

  it('should export a valid Solana project structure', async () => {
    // Create the export system
    const exportSystem = new AppExportSystem();

    // Create a test form config and schema for Solana
    const formConfig = createMinimalFormConfig('solanaTransfer', 'solana');
    const contractSchema = createMinimalContractSchema('solanaTransfer', 'solana');
    // Use a mock Solana config
    const mockSolanaConfig: SolanaNetworkConfig = {
      id: 'mock-solana-validation',
      name: 'Mock Solana Validation',
      exportConstName: 'mockSolanaConfig',
      ecosystem: 'solana',
      network: 'solana',
      type: 'devnet',
      isTestnet: true,
      rpcEndpoint: 'mock',
      commitment: 'confirmed',
    };

    // Export the form
    const result = await exportSystem.exportApp(
      formConfig,
      contractSchema,
      mockSolanaConfig, // Pass Solana mock config
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
            if (!deps['@openzeppelin/ui-renderer'])
              return 'Missing @openzeppelin/ui-renderer dependency';
            if (!deps['@openzeppelin/ui-types']) return 'Missing @openzeppelin/ui-types dependency';
            if (!deps['@openzeppelin/ui-builder-adapter-solana'])
              return 'Missing @openzeppelin/ui-builder-adapter-solana dependency';
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

  it('should handle different ecosystems correctly (placeholder checks)', async () => {
    const exportSystem = new AppExportSystem();
    const formConfig = createMinimalFormConfig('transfer', 'solana');
    const contractSchema = createMinimalContractSchema('transfer', 'solana');
    // Use the mockSolanaConfig defined earlier in this file
    const mockSolanaConfig: SolanaNetworkConfig = {
      id: 'mock-solana-validation',
      name: 'Mock Solana Validation',
      exportConstName: 'mockSolanaConfig',
      ecosystem: 'solana',
      network: 'solana',
      type: 'devnet',
      isTestnet: true,
      rpcEndpoint: 'mock',
      commitment: 'confirmed',
    };

    await expect(
      exportSystem.exportApp(formConfig, contractSchema, mockSolanaConfig, 'transfer')
    ).resolves.toBeDefined();
  });
});
