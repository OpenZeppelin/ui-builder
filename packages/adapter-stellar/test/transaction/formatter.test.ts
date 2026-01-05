import { describe, expect, it } from 'vitest';

import type { ContractSchema, FormFieldType } from '@openzeppelin/ui-types';

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
        argSchema: [
          { name: 'to', type: 'Address', displayName: 'Recipient Address' },
          { name: 'amount', type: 'U128', displayName: 'Amount' },
        ],
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
        argSchema: [
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

  describe('enum value handling', () => {
    const mockEnumContractSchema: ContractSchema = {
      name: 'DemoEnumContract',
      address: mockContractAddress,
      ecosystem: 'stellar',
      functions: [
        {
          id: 'set_enum_DemoEnum',
          name: 'set_enum',
          displayName: 'Set Enum',
          type: 'function',
          modifiesState: true,
          inputs: [{ name: 'choice', type: 'DemoEnum', displayName: 'Choice' }],
          outputs: [],
          stateMutability: 'nonpayable',
        },
        {
          id: 'process_priority',
          name: 'process_priority',
          displayName: 'Process Priority',
          type: 'function',
          modifiesState: true,
          inputs: [{ name: 'priority', type: 'Priority', displayName: 'Priority Level' }],
          outputs: [],
          stateMutability: 'nonpayable',
        },
      ],
    };

    it('should handle unit enum variants correctly', () => {
      const submittedInputs = {
        choice: { tag: 'One' },
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'choice',
          label: 'Choice',
          type: 'enum',
          placeholder: 'Select choice',
          defaultValue: { tag: 'One' },
          validation: { required: true },
          width: 'full',
          enumMetadata: {
            name: 'DemoEnum',
            variants: [
              { name: 'One', type: 'void' },
              { name: 'Two', type: 'tuple', payloadTypes: ['U32'] },
              { name: 'Three', type: 'tuple', payloadTypes: ['ScString'] },
            ],
            isUnitOnly: false,
          },
        },
      ];

      const result = formatStellarTransactionData(
        mockEnumContractSchema,
        'set_enum_DemoEnum',
        submittedInputs,
        fields
      );

      expect(result.contractAddress).toBe(mockContractAddress);
      expect(result.functionName).toBe('set_enum');
      expect(result.args).toHaveLength(1);
      expect(result.args[0]).toEqual({ tag: 'One' });
    });

    it('should handle tuple enum variants with payloads correctly', () => {
      const submittedInputs = {
        choice: {
          tag: 'Two',
          values: [{ type: 'U32', value: '42' }],
        },
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'choice',
          label: 'Choice',
          type: 'enum',
          placeholder: 'Select choice',
          defaultValue: { tag: 'One' },
          validation: { required: true },
          width: 'full',
          enumMetadata: {
            name: 'DemoEnum',
            variants: [
              { name: 'One', type: 'void' },
              { name: 'Two', type: 'tuple', payloadTypes: ['U32'] },
              { name: 'Three', type: 'tuple', payloadTypes: ['ScString'] },
            ],
            isUnitOnly: false,
          },
        },
      ];

      const result = formatStellarTransactionData(
        mockEnumContractSchema,
        'set_enum_DemoEnum',
        submittedInputs,
        fields
      );

      expect(result.contractAddress).toBe(mockContractAddress);
      expect(result.functionName).toBe('set_enum');
      expect(result.args).toHaveLength(1);
      expect(result.args[0]).toEqual({
        tag: 'Two',
        values: [{ type: 'U32', value: '42' }],
      });
    });

    it('should handle tuple enum variants with string payloads correctly', () => {
      const submittedInputs = {
        choice: {
          tag: 'Three',
          values: [{ type: 'ScString', value: 'hello world' }],
        },
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'choice',
          label: 'Choice',
          type: 'enum',
          placeholder: 'Select choice',
          defaultValue: { tag: 'One' },
          validation: { required: true },
          width: 'full',
          enumMetadata: {
            name: 'DemoEnum',
            variants: [
              { name: 'One', type: 'void' },
              { name: 'Two', type: 'tuple', payloadTypes: ['U32'] },
              { name: 'Three', type: 'tuple', payloadTypes: ['ScString'] },
            ],
            isUnitOnly: false,
          },
        },
      ];

      const result = formatStellarTransactionData(
        mockEnumContractSchema,
        'set_enum_DemoEnum',
        submittedInputs,
        fields
      );

      expect(result.contractAddress).toBe(mockContractAddress);
      expect(result.functionName).toBe('set_enum');
      expect(result.args).toHaveLength(1);
      expect(result.args[0]).toEqual({
        tag: 'Three',
        values: [{ type: 'ScString', value: 'hello world' }],
      });
    });

    it('should handle integer enum variants correctly', () => {
      const submittedInputs = {
        priority: { enum: 1 },
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'priority',
          label: 'Priority Level',
          type: 'enum',
          placeholder: 'Select priority',
          defaultValue: { enum: 0 },
          validation: { required: true },
          width: 'full',
          enumMetadata: {
            name: 'Priority',
            variants: [
              { name: 'Low', type: 'integer', value: 0 },
              { name: 'Medium', type: 'integer', value: 1 },
              { name: 'High', type: 'integer', value: 2 },
            ],
            isUnitOnly: true,
          },
        },
      ];

      const result = formatStellarTransactionData(
        mockEnumContractSchema,
        'process_priority',
        submittedInputs,
        fields
      );

      expect(result.contractAddress).toBe(mockContractAddress);
      expect(result.functionName).toBe('process_priority');
      expect(result.args).toHaveLength(1);
      expect(result.args[0]).toEqual({ enum: 1 });
    });

    it('should handle complex enum variants with multiple payload types', () => {
      const complexEnumSchema: ContractSchema = {
        name: 'ComplexEnumContract',
        address: mockContractAddress,
        ecosystem: 'stellar',
        functions: [
          {
            id: 'process_complex',
            name: 'process_complex',
            displayName: 'Process Complex',
            type: 'function',
            modifiesState: true,
            inputs: [{ name: 'data', type: 'ComplexEnum', displayName: 'Complex Data' }],
            outputs: [],
            stateMutability: 'nonpayable',
          },
        ],
      };

      const submittedInputs = {
        data: {
          tag: 'MultiPayload',
          values: [
            { type: 'U32', value: '123' },
            { type: 'ScString', value: 'test' },
            { type: 'Bool', value: true },
          ],
        },
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'data',
          label: 'Complex Data',
          type: 'enum',
          placeholder: 'Select data',
          defaultValue: { tag: 'Empty' },
          validation: { required: true },
          width: 'full',
          enumMetadata: {
            name: 'ComplexEnum',
            variants: [
              { name: 'Empty', type: 'void' },
              { name: 'MultiPayload', type: 'tuple', payloadTypes: ['U32', 'ScString', 'Bool'] },
            ],
            isUnitOnly: false,
          },
        },
      ];

      const result = formatStellarTransactionData(
        complexEnumSchema,
        'process_complex',
        submittedInputs,
        fields
      );

      expect(result.contractAddress).toBe(mockContractAddress);
      expect(result.functionName).toBe('process_complex');
      expect(result.args).toHaveLength(1);
      expect(result.args[0]).toEqual({
        tag: 'MultiPayload',
        values: [
          { type: 'U32', value: '123' },
          { type: 'ScString', value: 'test' },
          { type: 'Bool', value: true },
        ],
      });
    });

    describe('enum payload processing with raw values', () => {
      it('should handle enum values when specEntries is missing', () => {
        const schemaWithoutSpecEntries: ContractSchema = {
          name: 'DemoEnumContract',
          address: mockContractAddress,
          ecosystem: 'stellar',
          functions: [
            {
              id: 'set_enum_DemoEnum',
              name: 'set_enum',
              displayName: 'Set Enum',
              type: 'function',
              modifiesState: true,
              inputs: [{ name: 'choice', type: 'DemoEnum', displayName: 'Choice' }],
              outputs: [],
              stateMutability: 'nonpayable',
            },
          ],
          metadata: undefined,
        };

        const submittedInputs = {
          choice: {
            tag: 'Two',
            values: [444],
          },
        };

        const fields: FormFieldType[] = [
          {
            id: 'field-1',
            name: 'choice',
            label: 'Choice',
            type: 'enum',
            placeholder: 'Select choice',
            defaultValue: { tag: 'One' },
            validation: { required: true },
            width: 'full',
          },
        ];

        const result = formatStellarTransactionData(
          schemaWithoutSpecEntries,
          'set_enum_DemoEnum',
          submittedInputs,
          fields
        );

        expect(result.contractAddress).toBe(mockContractAddress);
        expect(result.functionName).toBe('set_enum');
        expect(result.args).toHaveLength(1);
        // Should pass through unchanged when no metadata available
        expect(result.args[0]).toEqual({
          tag: 'Two',
          values: [444],
        });
      });

      it('should handle non-enum values normally', () => {
        const schemaWithoutSpecEntries: ContractSchema = {
          name: 'DemoEnumContract',
          address: mockContractAddress,
          ecosystem: 'stellar',
          functions: [
            {
              id: 'set_enum_DemoEnum',
              name: 'set_enum',
              displayName: 'Set Enum',
              type: 'function',
              modifiesState: true,
              inputs: [{ name: 'choice', type: 'DemoEnum', displayName: 'Choice' }],
              outputs: [],
              stateMutability: 'nonpayable',
            },
          ],
          metadata: undefined,
        };

        const submittedInputs = {
          choice: 'not an enum value', // Regular string value
        };

        const fields: FormFieldType[] = [
          {
            id: 'field-1',
            name: 'choice',
            label: 'Choice',
            type: 'text',
            placeholder: 'Enter choice',
            defaultValue: '',
            validation: { required: true },
            width: 'full',
          },
        ];

        const result = formatStellarTransactionData(
          schemaWithoutSpecEntries,
          'set_enum_DemoEnum',
          submittedInputs,
          fields
        );

        expect(result.contractAddress).toBe(mockContractAddress);
        expect(result.functionName).toBe('set_enum');
        expect(result.args).toHaveLength(1);
        // Should be processed normally by parseStellarInput
        expect(result.args[0]).toBe('not an enum value');
      });
    });

    it('should preserve existing schema components when field components are absent', () => {
      const tupleSchema: ContractSchema = {
        name: 'TupleStructContract',
        address: mockContractAddress,
        ecosystem: 'stellar',
        functions: [
          {
            id: 'tuple_strukt_TupleStruct',
            name: 'tuple_strukt',
            displayName: 'Tuple Strukt',
            type: 'function',
            modifiesState: true,
            inputs: [
              {
                name: 'tuple_strukt',
                type: 'TupleStruct',
                components: [
                  {
                    name: '0',
                    type: 'Test',
                    components: [
                      { name: 'a', type: 'U32' },
                      { name: 'b', type: 'Bool' },
                      { name: 'c', type: 'ScSymbol' },
                    ],
                  },
                  {
                    name: '1',
                    type: 'SimpleEnum',
                  },
                ],
              },
            ],
            outputs: [],
            stateMutability: 'nonpayable',
          },
        ],
      };

      const submittedInputs = {
        tuple_strukt: {
          '0': { a: 1, b: true, c: 'sym' },
          '1': 'First',
        },
      };

      const fields: FormFieldType[] = [
        {
          id: 'field-1',
          name: 'tuple_strukt',
          label: 'Tuple Strukt',
          type: 'object',
          placeholder: 'Enter tuple struct',
          validation: { required: true },
          width: 'full',
        },
      ];

      const result = formatStellarTransactionData(
        tupleSchema,
        'tuple_strukt_TupleStruct',
        submittedInputs,
        fields
      );

      expect(result.argSchema?.[0].components?.[0].components).toHaveLength(3);
      expect(result.argSchema?.[0].components?.[0].components?.[0].name).toBe('a');
    });
  });
});
