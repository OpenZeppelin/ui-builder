import { describe, expect, it, vi } from 'vitest';

import { FormSchemaFactory } from '../FormSchemaFactory';

import type { FieldType } from '../../../../../form-renderer/src/types/FormTypes';
import type { ChainType, ContractSchema } from '../../types/ContractSchema';

// Mock the adapter and other dependencies
vi.mock('../../../adapters', () => ({
  getContractAdapter: vi.fn(() => ({
    mapParameterTypeToFieldType: vi.fn((type: string): FieldType => {
      if (type === 'address') return 'blockchain-address';
      if (type === 'uint256') return 'number';
      if (type === 'bool') return 'checkbox';
      if (type.startsWith('tuple')) return 'textarea';
      if (type.includes('[')) return 'textarea';
      return 'text';
    }),
    generateDefaultField: vi.fn((param) => {
      const fieldType =
        param.type === 'address' ? 'address' : param.type === 'uint256' ? 'number' : 'text';

      return {
        id: `field-${param.name}`,
        name: param.name,
        label: param.displayName || param.name,
        type: fieldType,
        placeholder: `Enter ${param.name}`,
        helperText: '',
        defaultValue: fieldType === 'number' ? 0 : '',
        validation: { required: true },
        width: 'full',
      };
    }),
    isValidAddress: vi.fn((address: string) => address.startsWith('0x') && address.length === 42),
  })),
}));

describe('FormSchemaFactory', () => {
  const factory = new FormSchemaFactory();

  const mockContractSchema: ContractSchema = {
    chainType: 'evm' as ChainType,
    name: 'TestContract',
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
      mockContractSchema,
      'transfer_address_uint256',
      'evm'
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
      factory.generateFormSchema(mockContractSchema, 'nonexistent_function', 'evm');
    }).toThrow('Function nonexistent_function not found in contract schema');
  });

  it('should add transform functions to fields', () => {
    const schema = factory.generateFormSchema(
      mockContractSchema,
      'transfer_address_uint256',
      'evm'
    );

    // Check transforms exist for address and number fields
    expect(schema.fields[0].transforms).toBeDefined();
    expect(schema.fields[1].transforms).toBeDefined();
  });
});
