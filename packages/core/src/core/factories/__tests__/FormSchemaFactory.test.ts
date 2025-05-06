// Import types from form-renderer
import { v4 as uuidv4 } from 'uuid';
import { describe, expect, it, vi } from 'vitest';

import { Ecosystem, NetworkConfig } from '@openzeppelin/transaction-form-types';
import type {
  ContractAdapter,
  ContractSchema,
  FieldType,
  FormFieldType,
} from '@openzeppelin/transaction-form-types';

import type { BuilderFormConfig } from '../../types/FormTypes';
import { FormSchemaFactory } from '../FormSchemaFactory';

const mockAdapterInstance: ContractAdapter = {
  mapParameterTypeToFieldType: vi.fn((type: string): FieldType => {
    if (type === 'address') return 'blockchain-address';
    if (type === 'uint256') return 'number';
    if (type === 'bool') return 'checkbox';
    if (type.startsWith('tuple')) return 'textarea';
    if (type.includes('[')) return 'textarea';
    return 'text';
  }),
  generateDefaultField: vi.fn((param): FormFieldType => {
    const fieldType = mockAdapterInstance.mapParameterTypeToFieldType(param.type) as FieldType;
    return {
      id: `field-${param.name}-${uuidv4()}`,
      name: param.name,
      label: param.displayName || param.name,
      type: fieldType,
      placeholder: `Enter ${param.name}`,
      helperText: '',
      defaultValue: fieldType === 'number' ? 0 : fieldType === 'checkbox' ? false : '',
      validation: { required: true },
      width: 'full',
      originalParameterType: param.type,
    } as FormFieldType;
  }),
  // Add other methods from ContractAdapter if FormSchemaFactory uses them
  // For now, these two are the primary ones used by generateFields
  // Add dummy implementations or mocks for other required ContractAdapter methods if needed by tests
  loadContract: vi.fn(),
  loadMockContract: vi.fn(),
  getWritableFunctions: vi.fn(() => []),
  formatTransactionData: vi.fn(),
  signAndBroadcast: vi.fn(),
  isValidAddress: vi.fn(),
  getSupportedExecutionMethods: vi.fn(),
  validateExecutionConfig: vi.fn(),
  isViewFunction: vi.fn(),
  queryViewFunction: vi.fn(),
  formatFunctionResult: vi.fn(),
  getCompatibleFieldTypes: vi.fn((type: string): FieldType[] => {
    if (type === 'address') return ['blockchain-address', 'text'] as FieldType[];
    if (type === 'uint256') return ['number', 'text'] as FieldType[];
    return ['text'] as FieldType[]; // Ensure these are valid FieldType strings
  }),
  supportsWalletConnection: vi.fn(),
  getAvailableConnectors: vi.fn(),
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
  getWalletConnectionStatus: vi.fn(),
  getExplorerUrl: vi.fn(),
  getExplorerTxUrl: vi.fn(),
};

vi.mock('../../core/adapterRegistry', () => ({
  // getAdapter is now called with NetworkConfig
  // For this test, we assume the factory receives the correct adapter directly
  // So, this mock might not be strictly needed if factory is passed adapter directly.
  // However, if factory *still* uses getAdapter internally, this needs to match:
  getAdapter: vi.fn((networkConfig: NetworkConfig) => {
    if (networkConfig.ecosystem === 'evm') {
      return mockAdapterInstance;
    }
    throw new Error(`Mock getAdapter called with unhandled ecosystem: ${networkConfig.ecosystem}`);
  }),
}));

describe('FormSchemaFactory', () => {
  const factory = new FormSchemaFactory();
  // The factory's generateFormSchema now expects the adapter as the first argument
  const testAdapter = mockAdapterInstance; // Use the fully mocked adapter

  const mockContractSchema: ContractSchema = {
    ecosystem: 'evm' as Ecosystem,
    name: 'TestContract',
    address: '0x1234567890123456789012345678901234567890',
    functions: [
      {
        id: 'transfer_address_uint256',
        name: 'transfer',
        displayName: 'Transfer',
        description: 'Transfer tokens to another address',
        inputs: [
          {
            name: 'recipient',
            type: 'address',
            displayName: 'Recipient Address',
          },
          {
            name: 'amount',
            type: 'uint256',
            displayName: 'Amount',
          },
        ],
        type: 'function',
        stateMutability: 'nonpayable',
        modifiesState: true,
      },
      {
        id: 'approve_address_uint256',
        name: 'approve',
        displayName: 'Approve',
        description: 'Approve tokens for another address to spend',
        inputs: [
          {
            name: 'spender',
            type: 'address',
            displayName: 'Spender Address',
          },
          {
            name: 'amount',
            type: 'uint256',
            displayName: 'Amount',
          },
        ],
        type: 'function',
        stateMutability: 'nonpayable',
        modifiesState: true,
      },
    ],
  };

  it('should generate a form schema from a contract function', () => {
    const schema = factory.generateFormSchema(
      testAdapter, // Pass adapter instance
      mockContractSchema,
      'transfer_address_uint256'
    );

    // Check basic schema properties
    expect(schema.id).toBe('form-transfer_address_uint256');
    expect(schema.title).toBe('Transfer');
    expect(schema.description).toBe('Transfer tokens to another address');

    // Check fields
    expect(schema.fields).toHaveLength(2);
    expect(schema.fields[0].name).toBe('recipient');
    expect(schema.fields[1].name).toBe('amount');

    // Check layout
    expect(schema.layout.columns).toBe(1);
    expect(schema.layout.spacing).toBe('normal');

    // Check submit button
    expect(schema.submitButton.text).toBe('Execute Transfer');
    expect(schema.submitButton.loadingText).toBe('Processing...');
  });

  it('should throw an error if function is not found', () => {
    expect(() => {
      factory.generateFormSchema(testAdapter, mockContractSchema, 'nonexistent_function');
    }).toThrow('Function nonexistent_function not found in contract schema');
  });

  it('should add transform functions to fields', () => {
    const schema = factory.generateFormSchema(
      testAdapter,
      mockContractSchema,
      'transfer_address_uint256'
    );

    // Check transforms exist for address and number fields
    expect(schema.fields[0].transforms).toBeDefined();
    expect(schema.fields[1].transforms).toBeDefined();
  });

  describe('builderConfigToRenderSchema', () => {
    const baseBuilderConfig: BuilderFormConfig = {
      functionId: 'testFunc',
      fields: [
        {
          id: uuidv4(),
          name: 'visibleParam',
          label: 'Visible',
          type: 'text',
          validation: { required: true },
          originalParameterType: 'string',
        },
        {
          id: uuidv4(),
          name: 'hiddenParam',
          label: 'Hidden',
          type: 'number',
          validation: {},
          isHidden: true,
          originalParameterType: 'uint256',
        },
        {
          id: uuidv4(),
          name: 'hardcodedParam',
          label: 'Hardcoded',
          type: 'text',
          validation: {},
          isHardcoded: true,
          hardcodedValue: 'fixed',
          originalParameterType: 'string',
        },
        {
          id: uuidv4(),
          name: 'readOnlyParam',
          label: 'Read Only',
          type: 'text',
          validation: {},
          isReadOnly: true,
          originalParameterType: 'string',
        },
        {
          id: uuidv4(),
          name: 'hardcodedReadOnlyParam',
          label: 'Hardcoded ReadOnly',
          type: 'number',
          validation: {},
          isHardcoded: true,
          hardcodedValue: 999,
          isReadOnly: true,
          originalParameterType: 'uint256',
        },
      ],
      layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
      validation: { mode: 'onChange', showErrors: 'inline' },
      contractAddress: '0xTestAddress',
    };

    it('should filter out fields where isHidden is true', () => {
      const renderSchema = factory.builderConfigToRenderSchema(baseBuilderConfig, 'Test Function');
      expect(renderSchema.fields).toHaveLength(4);
      expect(renderSchema.fields.find((f) => f.name === 'hiddenParam')).toBeUndefined();
    });

    it('should set defaultValue for fields where isHardcoded is true', () => {
      const renderSchema = factory.builderConfigToRenderSchema(baseBuilderConfig, 'Test Function');
      const hardcodedField = renderSchema.fields.find((f) => f.name === 'hardcodedParam');
      const hardcodedReadOnlyField = renderSchema.fields.find(
        (f) => f.name === 'hardcodedReadOnlyParam'
      );

      expect(hardcodedField?.defaultValue).toBe('fixed');
      expect(hardcodedReadOnlyField?.defaultValue).toBe(999);
    });

    it('should propagate isReadOnly flag to render schema fields', () => {
      const renderSchema = factory.builderConfigToRenderSchema(baseBuilderConfig, 'Test Function');
      const readOnlyField = renderSchema.fields.find((f) => f.name === 'readOnlyParam');
      const hardcodedReadOnlyField = renderSchema.fields.find(
        (f) => f.name === 'hardcodedReadOnlyParam'
      );
      const visibleField = renderSchema.fields.find((f) => f.name === 'visibleParam');

      expect(readOnlyField?.isReadOnly).toBe(true);
      expect(hardcodedReadOnlyField?.isReadOnly).toBe(true);
      expect(visibleField?.isReadOnly).toBeUndefined(); // Or false if default is applied
    });

    it('should populate defaultValues object for hardcoded fields', () => {
      const renderSchema = factory.builderConfigToRenderSchema(baseBuilderConfig, 'Test Function');
      expect(renderSchema.defaultValues).toBeDefined();
      expect(renderSchema.defaultValues?.hardcodedParam).toBe('fixed');
      expect(renderSchema.defaultValues?.hardcodedReadOnlyParam).toBe(999);
      expect(renderSchema.defaultValues?.visibleParam).toBeUndefined();
      expect(renderSchema.defaultValues?.hiddenParam).toBeUndefined(); // Should not be included
    });

    it('should retain common properties like layout, title, etc.', () => {
      const renderSchema = factory.builderConfigToRenderSchema(
        baseBuilderConfig,
        'Test Function',
        'Desc'
      );
      expect(renderSchema.id).toBe('form-testFunc');
      expect(renderSchema.title).toBe('Test Function');
      expect(renderSchema.description).toBe('Desc');
      expect(renderSchema.layout).toEqual(baseBuilderConfig.layout);
      expect(renderSchema.validation).toEqual(baseBuilderConfig.validation);
      expect(renderSchema.submitButton).toBeDefined();
    });
  });
});
