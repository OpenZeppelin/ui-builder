import { describe, expect, it } from 'vitest';

import type {
  ContractSchema,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/ui-builder-types';

import { generateStellarDefaultField } from '../../src/mapping/field-generator';
import { mapStellarParameterTypeToFieldType } from '../../src/mapping/type-mapper';
import { formatStellarTransactionData } from '../../src/transaction/formatter';

describe('Enum Field End-to-End Integration', () => {
  const mockContractAddress = 'CCEYLMR3GDYQ7J273PHIMBNU5FR73UCUMU7G3S66ESADEWLSHZWY23IM';

  // Mock contract schema that matches the DemoEnum contract structure
  const demoEnumContractSchema: ContractSchema = {
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
    metadata: {
      specEntries: [], // Would contain actual spec entries in real scenario
    },
  };

  // Helper functions to simulate adapter behavior without importing the full adapter
  const simulateFieldGeneration = (
    parameter: FunctionParameter,
    contractSchema?: ContractSchema
  ) => {
    return generateStellarDefaultField(parameter, contractSchema);
  };

  const simulateTypeMapping = (parameterType: string) => {
    return mapStellarParameterTypeToFieldType(parameterType);
  };

  describe('DemoEnum variants', () => {
    it('should handle unit variant "One" end-to-end', () => {
      // Step 1: Generate field configuration (simulating what the UI builder would do)
      const parameter = { name: 'choice', type: 'DemoEnum', displayName: 'Choice' };
      const field = simulateFieldGeneration(parameter, demoEnumContractSchema);

      // Simulate the field having enum metadata (normally extracted from spec)
      const fieldWithMetadata: FormFieldType = {
        ...field,
        type: 'enum',
        enumMetadata: {
          name: 'DemoEnum',
          variants: [
            { name: 'One', type: 'void' },
            { name: 'Two', type: 'tuple', payloadTypes: ['U32'] },
            { name: 'Three', type: 'tuple', payloadTypes: ['ScString'] },
          ],
          isUnitOnly: false,
        },
      };

      // Step 2: Simulate form submission with unit variant
      const submittedInputs = {
        choice: { tag: 'One' },
      };

      // Step 3: Format transaction data
      const transactionData = formatStellarTransactionData(
        demoEnumContractSchema,
        'set_enum_DemoEnum',
        submittedInputs,
        [fieldWithMetadata]
      );

      // Step 4: Verify the complete transaction structure
      expect(transactionData).toEqual({
        contractAddress: mockContractAddress,
        functionName: 'set_enum',
        args: [{ tag: 'One' }],
        argTypes: ['DemoEnum'],
        argSchema: [
          {
            name: 'choice',
            type: 'DemoEnum',
            displayName: 'Choice',
          },
        ],
        transactionOptions: {},
      });

      // Step 5: Verify the transaction data is properly structured for execution
      expect(transactionData.contractAddress).toBe(mockContractAddress);
      expect(transactionData.functionName).toBe('set_enum');
      expect(transactionData.args).toHaveLength(1);
      expect(transactionData.argTypes).toEqual(['DemoEnum']);
    });

    it('should handle tuple variant "Two(u32)" end-to-end', () => {
      // Step 1: Generate field configuration
      const parameter = { name: 'choice', type: 'DemoEnum', displayName: 'Choice' };
      const field = simulateFieldGeneration(parameter, demoEnumContractSchema);

      const fieldWithMetadata: FormFieldType = {
        ...field,
        type: 'enum',
        enumMetadata: {
          name: 'DemoEnum',
          variants: [
            { name: 'One', type: 'void' },
            { name: 'Two', type: 'tuple', payloadTypes: ['U32'] },
            { name: 'Three', type: 'tuple', payloadTypes: ['ScString'] },
          ],
          isUnitOnly: false,
        },
      };

      // Step 2: Simulate form submission with tuple variant containing u32
      const submittedInputs = {
        choice: {
          tag: 'Two',
          values: [{ type: 'U32', value: '42' }],
        },
      };

      // Step 3: Format transaction data
      const transactionData = formatStellarTransactionData(
        demoEnumContractSchema,
        'set_enum_DemoEnum',
        submittedInputs,
        [fieldWithMetadata]
      );

      // Step 4: Verify the complete transaction structure
      expect(transactionData).toEqual({
        contractAddress: mockContractAddress,
        functionName: 'set_enum',
        args: [
          {
            tag: 'Two',
            values: [{ type: 'U32', value: '42' }],
          },
        ],
        argTypes: ['DemoEnum'],
        argSchema: [
          {
            name: 'choice',
            type: 'DemoEnum',
            displayName: 'Choice',
          },
        ],
        transactionOptions: {},
      });

      // Step 5: Verify the transaction data is properly structured for execution
      expect(transactionData.contractAddress).toBe(mockContractAddress);
      expect(transactionData.functionName).toBe('set_enum');
      expect(transactionData.args).toHaveLength(1);
      expect(transactionData.argTypes).toEqual(['DemoEnum']);
    });

    it('should handle tuple variant "Three(String)" end-to-end', () => {
      // Step 1: Generate field configuration
      const parameter = { name: 'choice', type: 'DemoEnum', displayName: 'Choice' };
      const field = simulateFieldGeneration(parameter, demoEnumContractSchema);

      const fieldWithMetadata: FormFieldType = {
        ...field,
        type: 'enum',
        enumMetadata: {
          name: 'DemoEnum',
          variants: [
            { name: 'One', type: 'void' },
            { name: 'Two', type: 'tuple', payloadTypes: ['U32'] },
            { name: 'Three', type: 'tuple', payloadTypes: ['ScString'] },
          ],
          isUnitOnly: false,
        },
      };

      // Step 2: Simulate form submission with tuple variant containing string
      const submittedInputs = {
        choice: {
          tag: 'Three',
          values: [{ type: 'ScString', value: 'hello world' }],
        },
      };

      // Step 3: Format transaction data
      const transactionData = formatStellarTransactionData(
        demoEnumContractSchema,
        'set_enum_DemoEnum',
        submittedInputs,
        [fieldWithMetadata]
      );

      // Step 4: Verify the complete transaction structure
      expect(transactionData).toEqual({
        contractAddress: mockContractAddress,
        functionName: 'set_enum',
        args: [
          {
            tag: 'Three',
            values: [{ type: 'ScString', value: 'hello world' }],
          },
        ],
        argTypes: ['DemoEnum'],
        argSchema: [
          {
            name: 'choice',
            type: 'DemoEnum',
            displayName: 'Choice',
          },
        ],
        transactionOptions: {},
      });

      // Step 5: Verify the transaction data is properly structured for execution
      expect(transactionData.contractAddress).toBe(mockContractAddress);
      expect(transactionData.functionName).toBe('set_enum');
      expect(transactionData.args).toHaveLength(1);
      expect(transactionData.argTypes).toEqual(['DemoEnum']);
    });

    it('should handle complex scenarios with multiple enum parameters', () => {
      // Mock a more complex contract with multiple enum parameters
      const complexContractSchema: ContractSchema = {
        name: 'ComplexEnumContract',
        address: mockContractAddress,
        ecosystem: 'stellar',
        functions: [
          {
            id: 'process_multiple_enums',
            name: 'process_multiple_enums',
            displayName: 'Process Multiple Enums',
            type: 'function',
            modifiesState: true,
            inputs: [
              { name: 'choice1', type: 'DemoEnum', displayName: 'First Choice' },
              { name: 'choice2', type: 'DemoEnum', displayName: 'Second Choice' },
            ],
            outputs: [],
            stateMutability: 'nonpayable',
          },
        ],
      };

      // Generate fields for both parameters
      const field1 = simulateFieldGeneration(
        { name: 'choice1', type: 'DemoEnum', displayName: 'First Choice' },
        complexContractSchema
      );
      const field2 = simulateFieldGeneration(
        { name: 'choice2', type: 'DemoEnum', displayName: 'Second Choice' },
        complexContractSchema
      );

      const fieldsWithMetadata: FormFieldType[] = [
        {
          ...field1,
          type: 'enum',
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
        {
          ...field2,
          type: 'enum',
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

      // Simulate form submission with different variants for each parameter
      const submittedInputs = {
        choice1: { tag: 'One' },
        choice2: {
          tag: 'Two',
          values: [{ type: 'U32', value: '123' }],
        },
      };

      // Format transaction data
      const transactionData = formatStellarTransactionData(
        complexContractSchema,
        'process_multiple_enums',
        submittedInputs,
        fieldsWithMetadata
      );

      // Verify the complete transaction structure
      expect(transactionData).toEqual({
        contractAddress: mockContractAddress,
        functionName: 'process_multiple_enums',
        args: [{ tag: 'One' }, { tag: 'Two', values: [{ type: 'U32', value: '123' }] }],
        argTypes: ['DemoEnum', 'DemoEnum'],
        argSchema: [
          {
            name: 'choice1',
            type: 'DemoEnum',
            displayName: 'First Choice',
          },
          {
            name: 'choice2',
            type: 'DemoEnum',
            displayName: 'Second Choice',
          },
        ],
        transactionOptions: {},
      });
    });
  });

  describe('Field type mapping', () => {
    it('should correctly map enum parameters to enum field type', () => {
      const parameter = { name: 'choice', type: 'DemoEnum', displayName: 'Choice' };

      // Test the field type mapping - without spec entries, enum types fall back to 'select'
      const mappedType = simulateTypeMapping('DemoEnum');
      expect(mappedType).toBe('select');

      // Test field generation
      const field = simulateFieldGeneration(parameter, demoEnumContractSchema);
      expect(field.type).toBe('enum');
      expect(field.name).toBe('choice');
      expect(field.label).toBe('Choice');
    });

    it('should provide compatible field types for enum parameters', () => {
      // Test that enum types are mapped to select field type as fallback
      const mappedType = simulateTypeMapping('DemoEnum');
      expect(mappedType).toBe('select');

      // The field generator with enum detection logic upgrades this to 'enum'
      const parameter = { name: 'choice', type: 'DemoEnum', displayName: 'Choice' };
      const field = simulateFieldGeneration(parameter, demoEnumContractSchema);
      expect(field.type).toBe('enum');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid enum values gracefully', () => {
      const parameter = { name: 'choice', type: 'DemoEnum', displayName: 'Choice' };
      const field = simulateFieldGeneration(parameter, demoEnumContractSchema);

      const fieldWithMetadata: FormFieldType = {
        ...field,
        type: 'enum',
        enumMetadata: {
          name: 'DemoEnum',
          variants: [
            { name: 'One', type: 'void' },
            { name: 'Two', type: 'tuple', payloadTypes: ['U32'] },
            { name: 'Three', type: 'tuple', payloadTypes: ['ScString'] },
          ],
          isUnitOnly: false,
        },
      };

      // Test with invalid enum structure (missing tag)
      const invalidSubmittedInputs = {
        choice: { invalidProperty: 'invalid' },
      };

      // The formatter should still pass the value through to the input parser
      // The input parser will handle the validation and conversion
      expect(() => {
        formatStellarTransactionData(
          demoEnumContractSchema,
          'set_enum_DemoEnum',
          invalidSubmittedInputs,
          [fieldWithMetadata]
        );
      }).not.toThrow();
    });

    it('should handle missing enum metadata gracefully', () => {
      const parameter = { name: 'choice', type: 'DemoEnum', displayName: 'Choice' };
      const field = simulateFieldGeneration(parameter, demoEnumContractSchema);

      // Field without enum metadata (fallback scenario)
      const fieldWithoutMetadata: FormFieldType = {
        ...field,
        type: 'enum',
        // No enumMetadata property
      };

      const submittedInputs = {
        choice: { tag: 'One' },
      };

      // Should still work - the formatter passes values through to the input parser
      const transactionData = formatStellarTransactionData(
        demoEnumContractSchema,
        'set_enum_DemoEnum',
        submittedInputs,
        [fieldWithoutMetadata]
      );

      expect(transactionData.args[0]).toEqual({ tag: 'One' });
    });
  });
});
