import { describe, expect, it } from 'vitest';

import type { ContractSchema, FormFieldType } from '@openzeppelin/contracts-ui-builder-types';

import { formatStellarTransactionData } from '../../src/transaction/formatter';

describe('formatStellarTransactionData', () => {
  const mockContractAddress = 'CDVQVKOY2YSXS2IC7KN6MNASSHPAO7UN2UR2ON4OI2SKMFJNVAMDX6DP';

  const mockContractSchema: ContractSchema = {
    name: 'TestContract',
    address: mockContractAddress,
    ecosystem: 'stellar',
    functions: [
      {
        id: 'transfer',
        name: 'transfer',
        displayName: 'Transfer',
        type: 'function',
        modifiesState: true,
        inputs: [
          { name: 'to', type: 'Address', displayName: 'Recipient Address' },
          { name: 'amount', type: 'U128', displayName: 'Amount' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      {
        id: 'approve',
        name: 'approve',
        displayName: 'Approve',
        type: 'function',
        modifiesState: true,
        inputs: [
          { name: 'spender', type: 'Address', displayName: 'Spender Address' },
          { name: 'amount', type: 'U128', displayName: 'Amount' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      {
        id: 'mint',
        name: 'mint',
        displayName: 'Mint',
        type: 'function',
        modifiesState: true,
        inputs: [
          { name: 'to', type: 'Address', displayName: 'Recipient Address' },
          { name: 'amount', type: 'U128', displayName: 'Amount' },
          { name: 'data', type: 'Bytes', displayName: 'Data' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
      {
        id: 'complex_call',
        name: 'complex_call',
        displayName: 'Complex Call',
        type: 'function',
        modifiesState: true,
        inputs: [
          {
            name: 'user_info',
            type: 'UserInfo',
            displayName: 'User Info',
            components: [
              { name: 'name', type: 'ScString' },
              { name: 'age', type: 'U32' },
              { name: 'address', type: 'Address' },
            ],
          },
          { name: 'amounts', type: 'Vec<U128>', displayName: 'Amounts' },
          { name: 'enabled', type: 'Bool', displayName: 'Enabled' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    ],
  };

  describe('basic transaction formatting', () => {
    it('should format simple transfer transaction', () => {
      const submittedInputs = {
        to: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amount: '1000',
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'to',
          label: 'Recipient Address',
          type: 'blockchain-address',
          placeholder: 'Enter address',
          defaultValue: '',
          validation: { required: true },
          width: 'full',
        },
        {
          id: 'field-2',
          name: 'amount',
          label: 'Amount',
          type: 'number',
          placeholder: 'Enter amount',
          defaultValue: 0,
          validation: { required: true },
          width: 'full',
        },
      ];

      const result = formatStellarTransactionData(
        mockContractSchema,
        'transfer',
        submittedInputs,
        fields
      );

      expect(result).toEqual({
        contractAddress: mockContractAddress,
        functionName: 'transfer',
        args: ['GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', '1000'],
        argTypes: ['Address', 'U128'],
        transactionOptions: {},
      });
    });

    it('should format transaction with different parameter types', () => {
      const submittedInputs = {
        user_info: {
          name: 'John Doe',
          age: 30,
          address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        },
        amounts: ['100', '200', '300'],
        enabled: true,
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'user_info',
          label: 'User Info',
          type: 'object',
          placeholder: 'Enter user info',
          defaultValue: {},
          validation: { required: true },
          width: 'full',
          components: [
            { name: 'name', type: 'ScString' },
            { name: 'age', type: 'U32' },
            { name: 'address', type: 'Address' },
          ],
        },
        {
          id: 'field-2',
          name: 'amounts',
          label: 'Amounts',
          type: 'array',
          placeholder: 'Enter amounts',
          defaultValue: [],
          validation: { required: true },
          width: 'full',
        },
        {
          id: 'field-3',
          name: 'enabled',
          label: 'Enabled',
          type: 'checkbox',
          placeholder: 'Check if enabled',
          defaultValue: false,
          validation: { required: true },
          width: 'full',
        },
      ];

      const result = formatStellarTransactionData(
        mockContractSchema,
        'complex_call',
        submittedInputs,
        fields
      );

      expect(result).toEqual({
        contractAddress: mockContractAddress,
        functionName: 'complex_call',
        args: [
          {
            name: 'John Doe',
            age: 30,
            address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          },
          ['100', '200', '300'],
          true,
        ],
        argTypes: ['UserInfo', 'Vec<U128>', 'Bool'],
        transactionOptions: {},
      });
    });
  });

  describe('field handling', () => {
    it('should use hardcoded values when isHardcoded is true', () => {
      const submittedInputs = {
        to: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'to',
          label: 'Recipient Address',
          type: 'blockchain-address',
          placeholder: 'Enter address',
          defaultValue: '',
          validation: { required: true },
          width: 'full',
        },
        {
          id: 'field-2',
          name: 'amount',
          label: 'Amount',
          type: 'number',
          placeholder: 'Enter amount',
          defaultValue: 0,
          validation: { required: true },
          width: 'full',
          isHardcoded: true,
          hardcodedValue: '5000',
        },
      ];

      const result = formatStellarTransactionData(
        mockContractSchema,
        'transfer',
        submittedInputs,
        fields
      );

      expect(result.args).toEqual([
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        '5000', // Should use hardcoded value, not submitted input
      ]);
    });

    it('should throw error for hidden fields without hardcoded values', () => {
      const submittedInputs = {
        to: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'to',
          label: 'Recipient Address',
          type: 'blockchain-address',
          placeholder: 'Enter address',
          defaultValue: '',
          validation: { required: true },
          width: 'full',
        },
        {
          id: 'field-2',
          name: 'amount',
          label: 'Amount',
          type: 'number',
          placeholder: 'Enter amount',
          defaultValue: 0,
          validation: { required: true },
          width: 'full',
          isHidden: true,
          // Missing hardcodedValue
        },
      ];

      expect(() => {
        formatStellarTransactionData(mockContractSchema, 'transfer', submittedInputs, fields);
      }).toThrow("Field 'amount' cannot be hidden without being hardcoded");
    });

    it('should handle hidden fields with hardcoded values', () => {
      const submittedInputs = {
        to: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'to',
          label: 'Recipient Address',
          type: 'blockchain-address',
          placeholder: 'Enter address',
          defaultValue: '',
          validation: { required: true },
          width: 'full',
        },
        {
          id: 'field-2',
          name: 'amount',
          label: 'Amount',
          type: 'number',
          placeholder: 'Enter amount',
          defaultValue: 0,
          validation: { required: true },
          width: 'full',
          isHidden: true,
          isHardcoded: true,
          hardcodedValue: '2500',
        },
      ];

      const result = formatStellarTransactionData(
        mockContractSchema,
        'transfer',
        submittedInputs,
        fields
      );

      expect(result.args).toEqual([
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        '2500',
      ]);
    });
  });

  describe('parameter ordering', () => {
    it('should maintain parameter order from function definition', () => {
      const submittedInputs = {
        amount: '1000', // Submitted in different order
        to: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-2', // Different order in fields array too
          name: 'amount',
          label: 'Amount',
          type: 'number',
          placeholder: 'Enter amount',
          defaultValue: 0,
          validation: { required: true },
          width: 'full',
        },
        {
          id: 'field-1',
          name: 'to',
          label: 'Recipient Address',
          type: 'blockchain-address',
          placeholder: 'Enter address',
          defaultValue: '',
          validation: { required: true },
          width: 'full',
        },
      ];

      const result = formatStellarTransactionData(
        mockContractSchema,
        'transfer',
        submittedInputs,
        fields
      );

      // Should follow function definition order: [to, amount]
      expect(result.args).toEqual([
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        '1000',
      ]);
    });
  });

  describe('error handling', () => {
    it('should throw error when function not found in schema', () => {
      const submittedInputs = {};
      const fields: FormFieldType[] = [];

      expect(() => {
        formatStellarTransactionData(
          mockContractSchema,
          'nonexistent_function',
          submittedInputs,
          fields
        );
      }).toThrow(
        'Function definition for nonexistent_function not found in provided contract schema'
      );
    });

    it('should throw error when field configuration is missing for parameter', () => {
      const submittedInputs = {
        to: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      };

      const fields: FormFieldType[] = [
        // Missing amount field configuration
        {
          id: 'field-1',
          name: 'to',
          label: 'Recipient Address',
          type: 'blockchain-address',
          placeholder: 'Enter address',
          defaultValue: '',
          validation: { required: true },
          width: 'full',
        },
      ];

      expect(() => {
        formatStellarTransactionData(mockContractSchema, 'transfer', submittedInputs, fields);
      }).toThrow('Configuration missing for argument: amount in provided fields');
    });

    it('should throw error when required input is missing from submitted inputs', () => {
      const submittedInputs = {
        // Missing 'amount' input
        to: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'to',
          label: 'Recipient Address',
          type: 'blockchain-address',
          placeholder: 'Enter address',
          defaultValue: '',
          validation: { required: true },
          width: 'full',
        },
        {
          id: 'field-2',
          name: 'amount',
          label: 'Amount',
          type: 'number',
          placeholder: 'Enter amount',
          defaultValue: 0,
          validation: { required: true },
          width: 'full',
          // Not hardcoded, so needs to be in submittedInputs
        },
      ];

      expect(() => {
        formatStellarTransactionData(mockContractSchema, 'transfer', submittedInputs, fields);
      }).toThrow('Missing submitted input for required field: amount');
    });

    it('should throw error when contract address is missing', () => {
      const schemaWithoutAddress: ContractSchema = {
        ...mockContractSchema,
        address: undefined as unknown as string,
      };

      const submittedInputs = {
        to: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amount: '1000',
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'to',
          label: 'Recipient Address',
          type: 'blockchain-address',
          placeholder: 'Enter address',
          defaultValue: '',
          validation: { required: true },
          width: 'full',
        },
        {
          id: 'field-2',
          name: 'amount',
          label: 'Amount',
          type: 'number',
          placeholder: 'Enter amount',
          defaultValue: 0,
          validation: { required: true },
          width: 'full',
        },
      ];

      expect(() => {
        formatStellarTransactionData(schemaWithoutAddress, 'transfer', submittedInputs, fields);
      }).toThrow('Contract address is missing or invalid in the provided schema');
    });

    it('should throw error when contract address is invalid', () => {
      const schemaWithInvalidAddress: ContractSchema = {
        ...mockContractSchema,
        address: 'invalid-address',
      };

      const submittedInputs = {
        to: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amount: '1000',
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'to',
          label: 'Recipient Address',
          type: 'blockchain-address',
          placeholder: 'Enter address',
          defaultValue: '',
          validation: { required: true },
          width: 'full',
        },
        {
          id: 'field-2',
          name: 'amount',
          label: 'Amount',
          type: 'number',
          placeholder: 'Enter amount',
          defaultValue: 0,
          validation: { required: true },
          width: 'full',
        },
      ];

      expect(() => {
        formatStellarTransactionData(schemaWithInvalidAddress, 'transfer', submittedInputs, fields);
      }).toThrow('Contract address is missing or invalid in the provided schema');
    });
  });

  describe('array and complex type handling', () => {
    it('should handle Bytes parameters', () => {
      const submittedInputs = {
        to: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amount: '1000',
        data: '0x48656c6c6f', // "Hello" in hex
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'to',
          label: 'Recipient Address',
          type: 'blockchain-address',
          placeholder: 'Enter address',
          defaultValue: '',
          validation: { required: true },
          width: 'full',
        },
        {
          id: 'field-2',
          name: 'amount',
          label: 'Amount',
          type: 'number',
          placeholder: 'Enter amount',
          defaultValue: 0,
          validation: { required: true },
          width: 'full',
        },
        {
          id: 'field-3',
          name: 'data',
          label: 'Data',
          type: 'text',
          placeholder: 'Enter data',
          defaultValue: '',
          validation: { required: true },
          width: 'full',
        },
      ];

      const result = formatStellarTransactionData(
        mockContractSchema,
        'mint',
        submittedInputs,
        fields
      );

      expect(result.args).toEqual([
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        '1000',
        new Uint8Array([72, 101, 108, 108, 111]),
      ]);
    });

    it('should handle array parameters passed as arrays', () => {
      const submittedInputs = {
        user_info: {
          name: 'Alice',
          age: 25,
          address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        },
        amounts: [100, 200, 300], // Submitted as actual array
        enabled: false,
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'user_info',
          label: 'User Info',
          type: 'object',
          placeholder: 'Enter user info',
          defaultValue: {},
          validation: { required: true },
          width: 'full',
          components: [
            { name: 'name', type: 'ScString' },
            { name: 'age', type: 'U32' },
            { name: 'address', type: 'Address' },
          ],
        },
        {
          id: 'field-2',
          name: 'amounts',
          label: 'Amounts',
          type: 'array',
          placeholder: 'Enter amounts',
          defaultValue: [],
          validation: { required: true },
          width: 'full',
        },
        {
          id: 'field-3',
          name: 'enabled',
          label: 'Enabled',
          type: 'checkbox',
          placeholder: 'Check if enabled',
          defaultValue: false,
          validation: { required: true },
          width: 'full',
        },
      ];

      const result = formatStellarTransactionData(
        mockContractSchema,
        'complex_call',
        submittedInputs,
        fields
      );

      expect(result.args[1]).toEqual(['100', '200', '300']);
    });
  });

  describe('transaction options', () => {
    it('should include empty transaction options by default', () => {
      const submittedInputs = {
        to: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amount: '1000',
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'to',
          label: 'Recipient Address',
          type: 'blockchain-address',
          placeholder: 'Enter address',
          defaultValue: '',
          validation: { required: true },
          width: 'full',
        },
        {
          id: 'field-2',
          name: 'amount',
          label: 'Amount',
          type: 'number',
          placeholder: 'Enter amount',
          defaultValue: 0,
          validation: { required: true },
          width: 'full',
        },
      ];

      const result = formatStellarTransactionData(
        mockContractSchema,
        'transfer',
        submittedInputs,
        fields
      );

      expect(result).toHaveProperty('transactionOptions');
      expect(result.transactionOptions).toEqual({});
    });
  });
});
