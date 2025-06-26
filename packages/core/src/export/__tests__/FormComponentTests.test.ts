import { describe, expect, it } from 'vitest';

import type { EvmNetworkConfig } from '@openzeppelin/transaction-form-types';
import { Ecosystem } from '@openzeppelin/transaction-form-types';

import { FormExportSystem } from '../FormExportSystem';
import {
  createComplexFormConfig,
  createMinimalContractSchema,
  createMinimalFormConfig,
} from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';

// Define mock network config
const mockEvmNetworkConfig: EvmNetworkConfig = {
  id: 'test-formcomp-evm',
  name: 'Test FormComp EVM',
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

describe('Form Component Tests', () => {
  /**
   * Extract and analyze the generated form component
   */
  async function extractFormComponent(
    ecosystem: Ecosystem,
    functionName: string = 'testFunction',
    useComplexForm: boolean = false
  ) {
    // Create the export system
    const exportSystem = new FormExportSystem();

    // Create form config
    const formConfig = useComplexForm
      ? createComplexFormConfig(functionName, ecosystem)
      : createMinimalFormConfig(functionName, ecosystem);
    const mockContractSchema = createMinimalContractSchema(functionName, ecosystem);

    // Export the form
    const result = await exportSystem.exportForm(
      formConfig,
      mockContractSchema,
      mockEvmNetworkConfig,
      functionName
    );

    // Extract files from the ZIP using result.data
    expect(result.data).toBeDefined();
    const files = await extractFilesFromZip(result.data);

    // Get the form component code
    const formComponentCode = files['src/components/GeneratedForm.tsx'];

    if (!formComponentCode) {
      throw new Error('Form component file not found in export');
    }

    return { formComponentCode, files };
  }

  describe('Form Component Structure', () => {
    it('should generate a valid React component with proper imports', async () => {
      const { formComponentCode } = await extractFormComponent('evm');

      // Check for React import (modern React doesn't require default import)
      expect(formComponentCode).toMatch(/import.*from ['"]react['"]/);

      // Check for TransactionForm import - handle multi-line imports
      expect(formComponentCode).toContain('TransactionForm');
      expect(formComponentCode).toContain('from');
      expect(formComponentCode).toMatch(/@openzeppelin\/transaction-form-renderer/);

      // Check for component definition
      expect(formComponentCode).toMatch(/export default function GeneratedForm/);

      // Check for JSX return
      expect(formComponentCode).toMatch(/<TransactionForm/);
    });

    it('should include adapter props in the component', async () => {
      const { formComponentCode } = await extractFormComponent('evm');

      // Check that the component accepts a generic `ContractAdapter` prop
      expect(formComponentCode).toMatch(/adapter:\s*ContractAdapter/);

      // Check that the adapter prop is used in the TransactionForm
      expect(formComponentCode).toMatch(/adapter={adapter}/);
    });

    it('should include proper TypeScript type definitions', async () => {
      const { formComponentCode } = await extractFormComponent('evm');

      // Check for type imports
      expect(formComponentCode).toMatch(/import (type )?\{.*\} from/);

      // Check for props interface or type (if any)
      expect(formComponentCode).toMatch(/type|interface|Props/);
    });
  });

  describe('Form Schema Transformation', () => {
    it('should transform builder config to render schema correctly', async () => {
      const { formComponentCode } = await extractFormComponent('evm', 'transfer');

      // Check for schema declaration
      expect(formComponentCode).toMatch(/const formSchema: RenderFormSchema =/);

      // Check for fields array in the TypeScript format
      expect(formComponentCode).toMatch(/fields:\s*\[/);

      // Check for layout config in the TypeScript format
      expect(formComponentCode).toMatch(/layout:\s*\{/);

      // Check for validation config in TypeScript format
      expect(formComponentCode).toMatch(/validation:\s*\{/);
    });

    it('should include correct form field definitions', async () => {
      // Test with a complex form to ensure multiple field types are handled
      const { formComponentCode } = await extractFormComponent('evm', 'complexForm', true);

      // Check that each field type from the complex form is included in TypeScript format
      expect(formComponentCode).toMatch(/name:\s*['"]stringParam['"]/);
      expect(formComponentCode).toMatch(/name:\s*['"]numberParam['"]/);
      expect(formComponentCode).toMatch(/name:\s*['"]boolParam['"]/);
      expect(formComponentCode).toMatch(/name:\s*['"]addressParam['"]/);
      expect(formComponentCode).toMatch(/type:\s*['"]text['"]/);
      expect(formComponentCode).toMatch(/type:\s*['"]number['"]/);
      expect(formComponentCode).toMatch(/type:\s*['"]checkbox['"]/);
      expect(formComponentCode).toMatch(/type:\s*['"]blockchain-address['"]/);

      // Check that validation settings are included in TypeScript format
      expect(formComponentCode).toMatch(/required:\s*true/);
    });

    it('should include properly formatted submit button configuration', async () => {
      const { formComponentCode } = await extractFormComponent('evm');

      // Check submit button config in TypeScript format
      expect(formComponentCode).toMatch(/submitButton:\s*\{/);
      expect(formComponentCode).toMatch(/text:/);
      expect(formComponentCode).toMatch(/loadingText:/);
      expect(formComponentCode).toMatch(/variant:/);
    });
  });

  describe('Chain-Specific Components', () => {
    it('should generate EVM-specific form components', async () => {
      const { formComponentCode } = await extractFormComponent('evm');

      // Check EVM-specific imports or configurations
      expect(formComponentCode).toMatch(/evm/i);
    });

    it('should generate Solana-specific form components', async () => {
      const { formComponentCode } = await extractFormComponent('solana');

      // Check Solana-specific imports or configurations
      expect(formComponentCode).toMatch(/solana/i);
    });
  });

  describe('Component Integration', () => {
    it('should import the form component correctly in App.tsx', async () => {
      const { files } = await extractFormComponent('evm');

      const appCode = files['src/App.tsx'];
      expect(appCode).toBeDefined();

      // Check App.tsx imports the form component
      expect(appCode).toMatch(
        /import.*GeneratedForm.*from ['"](\.\/components\/GeneratedForm|@\/components\/GeneratedForm)['"]/
      );

      // Check the component is rendered in App.tsx (with or without props)
      expect(appCode).toMatch(/<GeneratedForm/);
    });
  });
});
