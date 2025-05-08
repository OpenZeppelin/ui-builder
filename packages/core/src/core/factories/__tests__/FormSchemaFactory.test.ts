// Import types from form-renderer
import { v4 as uuidv4 } from 'uuid';
import { describe, expect, it, vi } from 'vitest';

import { Ecosystem } from '@openzeppelin/transaction-form-types';
import type {
  ContractAdapter,
  ContractSchema,
  EvmNetworkConfig,
  FieldType,
  FormFieldType,
} from '@openzeppelin/transaction-form-types';

import type { BuilderFormConfig } from '../../types/FormTypes';
import { FormSchemaFactory } from '../FormSchemaFactory';

// Define mock config for this test file
const mockTestEvmConfig: EvmNetworkConfig = {
  id: 'test-factory-evm',
  name: 'Test Factory EVM',
  exportConstName: 'mockTestEvmConfig',
  ecosystem: 'evm',
  network: 'ethereum',
  type: 'testnet',
  isTestnet: true,
  chainId: 1337,
  rpcUrl: 'http://localhost:8545',
  nativeCurrency: { name: 'TETH', symbol: 'TETH', decimals: 18 },
  apiUrl: '',
};

// Mock adapter instance (ensure it fulfills ContractAdapter)
const mockAdapterInstance: ContractAdapter = {
  networkConfig: mockTestEvmConfig,
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
  getCompatibleFieldTypes: vi.fn((type: string): FieldType[] => {
    if (type === 'address') return ['blockchain-address', 'text'] as FieldType[];
    if (type === 'uint256') return ['number', 'text'] as FieldType[];
    return ['text'] as FieldType[];
  }),
  // Add dummy implementations for ALL methods in ContractAdapter
  loadContract: vi.fn().mockResolvedValue({} as ContractSchema),
  loadMockContract: vi.fn().mockResolvedValue({} as ContractSchema),
  getWritableFunctions: vi.fn(() => []),
  formatTransactionData: vi.fn(() => ({})),
  signAndBroadcast: vi.fn().mockResolvedValue({ txHash: '0xmockhash' }),
  isValidAddress: vi.fn(() => true),
  getSupportedExecutionMethods: vi.fn().mockResolvedValue([]),
  validateExecutionConfig: vi.fn().mockResolvedValue(true),
  isViewFunction: vi.fn(() => false),
  queryViewFunction: vi.fn().mockResolvedValue(undefined),
  formatFunctionResult: vi.fn(() => ''),
  supportsWalletConnection: vi.fn(() => false),
  getAvailableConnectors: vi.fn().mockResolvedValue([]),
  connectWallet: vi.fn().mockResolvedValue({ connected: false }),
  disconnectWallet: vi.fn().mockResolvedValue({ disconnected: true }),
  getWalletConnectionStatus: vi.fn().mockReturnValue({ isConnected: false }),
  getExplorerUrl: vi.fn(() => null),
  getExplorerTxUrl: vi.fn(() => null),
  waitForTransactionConfirmation: vi.fn().mockResolvedValue({ status: 'success' }),
  onWalletConnectionChange: vi.fn(() => () => {}),
};

describe('FormSchemaFactory', () => {
  const factory = new FormSchemaFactory();
  const testAdapter = mockAdapterInstance; // Use the mock adapter directly

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
      testAdapter,
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
    }).toThrow();
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
