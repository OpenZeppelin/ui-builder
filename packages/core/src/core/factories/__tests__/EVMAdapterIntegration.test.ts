import { beforeAll, describe, expect, it } from 'vitest';

import { getContractAdapter } from '../../../adapters';
import type { ContractSchema } from '../../types/ContractSchema';
import { FormSchemaFactory } from '../FormSchemaFactory';
import { TEST_FIXTURES } from './fixtures/evm-test-fixtures';

/**
 * EVM Adapter Integration Tests
 *
 * These tests verify the integration between FormSchemaFactory and the EVMAdapter.
 *
 * Areas tested:
 * - Field mapping for different parameter types
 * - Transform functions for data conversion
 * - Error handling for edge cases
 * - End-to-end form generation
 */
describe('EVM Adapter Integration Tests', () => {
  // Initialize the factory and adapter
  const factory = new FormSchemaFactory();
  const adapter = getContractAdapter('evm');
  let erc20Schema: ContractSchema;
  let inputTesterSchema: ContractSchema;

  // Load common schema fixtures before tests
  beforeAll(async () => {
    erc20Schema = await adapter.loadMockContract('erc20');
    inputTesterSchema = await adapter.loadMockContract('input-tester');
  });

  describe('ERC20 Function Integration', () => {
    it('should generate a form schema for ERC20 transfer function', async () => {
      const transferFunction = erc20Schema.functions.find((f) => f.name === 'transfer');

      expect(transferFunction).toBeDefined();
      if (!transferFunction) return; // TypeScript check

      const formSchema = factory.generateFormSchema(erc20Schema, transferFunction.id, 'evm');

      // Validate basic schema properties
      expect(formSchema.id).toBe(`form-${transferFunction.id}`);
      expect(formSchema.title).toBe('Transfer');

      // Validate fields
      expect(formSchema.fields).toHaveLength(2);

      // Check recipient field (address type) - parameter name has underscore in the mock
      const recipientField = formSchema.fields.find((f) => f.name === '_to');
      expect(recipientField).toBeDefined();
      expect(recipientField?.type).toBe('address');
      expect(recipientField?.transforms).toBeDefined();

      // Check amount field (number type) - parameter name has underscore in the mock
      const amountField = formSchema.fields.find((f) => f.name === '_value');
      expect(amountField).toBeDefined();
      expect(amountField?.type).toBe('number');
      expect(amountField?.transforms).toBeDefined();

      // Test transforms for address field
      if (recipientField?.transforms?.input && recipientField?.transforms?.output) {
        // Input transform (blockchain -> UI)
        expect(recipientField.transforms.input('0x1234567890123456789012345678901234567890')).toBe(
          '0x1234567890123456789012345678901234567890'
        );

        // Output transform (UI -> blockchain)
        expect(recipientField.transforms.output('0x1234567890123456789012345678901234567890')).toBe(
          '0x1234567890123456789012345678901234567890'
        );
        expect(recipientField.transforms.output('invalid-address')).toBe('');
      }

      // Test transforms for number field
      if (amountField?.transforms?.input && amountField?.transforms?.output) {
        // Input transform (blockchain -> UI)
        expect(amountField.transforms.input(1000)).toBe('1000');

        // Output transform (UI -> blockchain)
        expect(amountField.transforms.output('1000')).toBe(1000);
        expect(amountField.transforms.output('not-a-number')).toBe(0);
      }
    });

    it('should generate a form schema for ERC20 approve function', async () => {
      const approveFunction = erc20Schema.functions.find((f) => f.name === 'approve');

      expect(approveFunction).toBeDefined();
      if (!approveFunction) return; // TypeScript check

      const formSchema = factory.generateFormSchema(erc20Schema, approveFunction.id, 'evm');

      // Validate basic schema properties
      expect(formSchema.id).toBe(`form-${approveFunction.id}`);
      expect(formSchema.title).toBe('Approve');

      // Validate fields
      expect(formSchema.fields).toHaveLength(2);

      // Check spender field (address type) - parameter name has underscore in the mock
      const spenderField = formSchema.fields.find((f) => f.name === '_spender');
      expect(spenderField).toBeDefined();
      expect(spenderField?.type).toBe('address');

      // Check amount field (number type) - parameter name has underscore in the mock
      const amountField = formSchema.fields.find((f) => f.name === '_value');
      expect(amountField).toBeDefined();
      expect(amountField?.type).toBe('number');
    });
  });

  describe('Complex Parameter Type Integration', () => {
    it('should handle boolean parameters correctly', async () => {
      const boolFunction = inputTesterSchema.functions.find((f) => f.name === 'inputBool');

      expect(boolFunction).toBeDefined();
      if (!boolFunction) return; // TypeScript check

      const formSchema = factory.generateFormSchema(inputTesterSchema, boolFunction.id, 'evm');

      // Validate the boolean field
      expect(formSchema.fields).toHaveLength(1);
      const boolField = formSchema.fields[0];
      expect(boolField.type).toBe('checkbox');

      // Test transforms
      if (boolField.transforms?.input && boolField.transforms?.output) {
        // Input transform (blockchain -> UI)
        expect(boolField.transforms.input(true)).toBe(true);
        expect(boolField.transforms.input(false)).toBe(false);

        // Output transform (UI -> blockchain)
        expect(boolField.transforms.output(true)).toBe(true);
        expect(boolField.transforms.output('true')).toBe(true);
        expect(boolField.transforms.output(false)).toBe(false);
        expect(boolField.transforms.output('')).toBe(false);
      }
    });

    it('should handle array parameters correctly', async () => {
      const arrayFunction = inputTesterSchema.functions.find(
        (f) => f.name === 'inputUnlimitedUints'
      );

      expect(arrayFunction).toBeDefined();
      if (!arrayFunction) return; // TypeScript check

      const formSchema = factory.generateFormSchema(inputTesterSchema, arrayFunction.id, 'evm');

      // Validate the array field
      expect(formSchema.fields).toHaveLength(1);
      const arrayField = formSchema.fields[0];
      // Now array types should be properly mapped to textarea
      expect(arrayField.type).toBe('textarea');

      // Test transforms
      if (arrayField.transforms?.input && arrayField.transforms?.output) {
        // Input transform (blockchain -> UI)
        expect(arrayField.transforms.input([1, 2, 3])).toBe(JSON.stringify([1, 2, 3], null, 2));

        // Output transform (UI -> blockchain)
        expect(arrayField.transforms.output('[1,2,3]')).toEqual([1, 2, 3]);
        expect(arrayField.transforms.output('invalid-json')).toBeNull();
      }
    });

    it('should handle complex struct parameters', async () => {
      const structFunction = inputTesterSchema.functions.find(
        (f) => f.name === 'inputNestedStruct'
      );

      expect(structFunction).toBeDefined();
      if (!structFunction) return;

      const formSchema = factory.generateFormSchema(inputTesterSchema, structFunction.id, 'evm');

      // Verify that complex struct parameters are mapped to textarea fields
      expect(formSchema.fields).toHaveLength(1);
      const structField = formSchema.fields[0];
      expect(structField.type).toBe('textarea');

      // Test that the transforms can handle JSON conversion
      if (structField.transforms?.input && structField.transforms?.output) {
        const complexObject = {
          isToggled: true,
          title: 'Test Book',
          author: 'Test Author',
          book_id: 12345,
          addr: '0x1234567890123456789012345678901234567890',
          tags: ['fiction', 'fantasy'],
          meta: {
            subtitle: 'Test Subtitle',
            pages: 300,
          },
        };

        // Input transform (blockchain -> UI)
        expect(structField.transforms.input(complexObject)).toBe(
          JSON.stringify(complexObject, null, 2)
        );

        // Output transform (UI -> blockchain)
        const jsonString = JSON.stringify(complexObject);
        expect(structField.transforms.output(jsonString)).toEqual(complexObject);
      }
    });
  });

  describe('Integer Type Parameter Integration', () => {
    it('should handle different integer sizes correctly', () => {
      const intFixture = TEST_FIXTURES.integerTypes;

      // Test uint8 field
      const uint8Function = intFixture.functions.find((f) => f.id === 'function-uint8');
      expect(uint8Function).toBeDefined();
      const uint8Schema = factory.generateFormSchema(intFixture, 'function-uint8', 'evm');

      expect(uint8Schema.fields).toHaveLength(1);
      const uint8Field = uint8Schema.fields[0];
      expect(uint8Field.type).toBe('number');
      // Numbers should have appropriate validation
      expect(uint8Field.validation).toBeDefined();

      // Transform validation
      if (uint8Field.transforms?.output) {
        // Should handle different inputs
        expect(uint8Field.transforms.output('42')).toBe(42);
        expect(uint8Field.transforms.output('256')).toBe(256); // No range validation in transform
        expect(uint8Field.transforms.output('-1')).toBe(-1); // No range validation in transform
      }

      // Test uint256 field
      const uint256Function = intFixture.functions.find((f) => f.id === 'function-uint256');
      expect(uint256Function).toBeDefined();
      const uint256Schema = factory.generateFormSchema(intFixture, 'function-uint256', 'evm');

      expect(uint256Schema.fields).toHaveLength(1);
      const uint256Field = uint256Schema.fields[0];
      expect(uint256Field.type).toBe('number');

      // Transform validation
      if (uint256Field.transforms?.output) {
        // Should handle large numbers (up to JS number limit)
        expect(uint256Field.transforms.output('1000000000')).toBe(1000000000);
      }
    });
  });

  describe('Bytes Type Parameter Integration', () => {
    it('should handle different byte types correctly', () => {
      const byteFixture = TEST_FIXTURES.byteTypes;

      // Test dynamic bytes field
      const bytesFunction = byteFixture.functions.find((f) => f.id === 'function-bytes');
      expect(bytesFunction).toBeDefined();
      const bytesSchema = factory.generateFormSchema(byteFixture, 'function-bytes', 'evm');

      expect(bytesSchema.fields).toHaveLength(1);
      const bytesField = bytesSchema.fields[0];
      // Dynamic bytes should be handled as textarea for better multi-line input
      expect(bytesField.type).toBe('textarea');

      // Test bytes32 field
      const bytes32Function = byteFixture.functions.find((f) => f.id === 'function-bytes32');
      expect(bytes32Function).toBeDefined();
      const bytes32Schema = factory.generateFormSchema(byteFixture, 'function-bytes32', 'evm');

      expect(bytes32Schema.fields).toHaveLength(1);
      const bytes32Field = bytes32Schema.fields[0];
      // bytes32 should be handled as text with hex validation
      expect(bytes32Field.type).toBe('text');
    });
  });

  describe('Array Type Parameter Integration', () => {
    it('should handle different array types correctly', () => {
      const arrayFixture = TEST_FIXTURES.arrayTypes;

      // Test dynamic array
      const dynamicArrayFunction = arrayFixture.functions.find(
        (f) => f.id === 'function-dynamic-array'
      );
      expect(dynamicArrayFunction).toBeDefined();
      const dynamicArraySchema = factory.generateFormSchema(
        arrayFixture,
        'function-dynamic-array',
        'evm'
      );

      expect(dynamicArraySchema.fields).toHaveLength(1);
      const dynamicArrayField = dynamicArraySchema.fields[0];
      expect(dynamicArrayField.type).toBe('textarea'); // Dynamic arrays should be textarea

      // Test fixed array
      const fixedArrayFunction = arrayFixture.functions.find(
        (f) => f.id === 'function-fixed-array'
      );
      expect(fixedArrayFunction).toBeDefined();
      const fixedArraySchema = factory.generateFormSchema(
        arrayFixture,
        'function-fixed-array',
        'evm'
      );

      expect(fixedArraySchema.fields).toHaveLength(1);
      const fixedArrayField = fixedArraySchema.fields[0];
      expect(fixedArrayField.type).toBe('textarea'); // Fixed arrays should also be textarea

      // Transform validation for both types
      if (dynamicArrayField.transforms?.output && fixedArrayField.transforms?.output) {
        // For dynamic array
        expect(dynamicArrayField.transforms.output('[1,2,3]')).toEqual([1, 2, 3]);
        expect(dynamicArrayField.transforms.output('[]')).toEqual([]);
        expect(dynamicArrayField.transforms.output('invalid-json')).toBeNull();

        // For fixed array
        expect(fixedArrayField.transforms.output('[1,2,3]')).toEqual([1, 2, 3]);
        expect(fixedArrayField.transforms.output('[1]')).toEqual([1]); // No length validation in transform
      }
    });
  });

  describe('Error and Edge Cases', () => {
    it('should handle functions with no inputs', () => {
      const errorFixture = TEST_FIXTURES.errorCases;
      const emptyInputsFunction = errorFixture.functions.find(
        (f) => f.id === 'function-empty-inputs'
      );
      expect(emptyInputsFunction).toBeDefined();

      const emptyInputsSchema = factory.generateFormSchema(
        errorFixture,
        'function-empty-inputs',
        'evm'
      );

      // Should have no fields but still generate a valid schema
      expect(emptyInputsSchema.fields).toHaveLength(0);
      expect(emptyInputsSchema.id).toBe('form-function-empty-inputs');
      expect(emptyInputsSchema.title).toBe('Test Empty Inputs');
    });

    it('should throw error when function is not found', () => {
      // Test non-existent function ID
      expect(() => {
        factory.generateFormSchema(erc20Schema, 'non-existent-function', 'evm');
      }).toThrow('Function non-existent-function not found in contract schema');
    });

    it('should handle unsupported parameter types gracefully', () => {
      const errorFixture = TEST_FIXTURES.errorCases;
      const unsupportedTypeFunction = errorFixture.functions.find(
        (f) => f.id === 'function-unsupported-type'
      );
      expect(unsupportedTypeFunction).toBeDefined();

      // Should generate a schema with a fallback field type that can handle unknown types
      const unsupportedTypeSchema = factory.generateFormSchema(
        errorFixture,
        'function-unsupported-type',
        'evm'
      );

      expect(unsupportedTypeSchema.fields).toHaveLength(1);
      const customTypeField = unsupportedTypeSchema.fields[0];

      // The adapter should provide a fallback field type for unknown types
      expect(customTypeField.type).toBeDefined();
    });
  });

  describe('End-to-End Form Generation', () => {
    it('should generate forms for all ERC20 functions', async () => {
      const writableFunctions = adapter.getWritableFunctions(erc20Schema);

      // Loop through all writable functions and generate schemas
      for (const func of writableFunctions) {
        const formSchema = factory.generateFormSchema(erc20Schema, func.id, 'evm');

        // Verify basic schema structure
        expect(formSchema.id).toBeDefined();
        expect(formSchema.title).toBeDefined();
        expect(formSchema.fields.length).toBeGreaterThanOrEqual(func.inputs.length);

        // Verify all fields have transforms
        for (const field of formSchema.fields) {
          expect(field.transforms).toBeDefined();
        }
      }
    });

    it('should test integration between transform system and FormSchemaFactory', async () => {
      // Get a complex contract like InputTester that has various parameter types
      const complexFunction = inputTesterSchema.functions.find(
        (f) =>
          f.name === 'testComplexInputs' || f.inputs.some((input) => input.type.includes('tuple'))
      );

      expect(complexFunction).toBeDefined();
      if (!complexFunction) return;

      const formSchema = factory.generateFormSchema(inputTesterSchema, complexFunction.id, 'evm');

      // Verify each field has appropriate transforms based on its type
      for (const field of formSchema.fields) {
        expect(field.transforms).toBeDefined();

        // Different field types should have different transform behaviors
        if (field.type === 'address') {
          // Address fields should validate addresses
          expect(
            field.transforms?.output?.('0x1234567890123456789012345678901234567890')
          ).toBeTruthy();
          expect(field.transforms?.output?.('invalid')).toBe('');
        } else if (field.type === 'checkbox') {
          // Boolean fields should convert to booleans
          expect(field.transforms?.output?.('true')).toBe(true);
          expect(field.transforms?.output?.(false)).toBe(false);
        } else if (field.type === 'number') {
          // Number fields should parse numbers
          expect(field.transforms?.output?.('123')).toBe(123);
          expect(field.transforms?.output?.('abc')).toBe(0);
        } else if (field.type === 'textarea') {
          // Complex fields should handle JSON
          const jsonObj = { test: 123 };
          const jsonStr = JSON.stringify(jsonObj);
          expect(field.transforms?.output?.(jsonStr)).toEqual(jsonObj);
        }
      }
    });

    it('should handle the complete workflow from adapter to form schema', async () => {
      // This test validates the entire flow from contract loading to form generation

      // 1. Load contract
      const contract = await adapter.loadMockContract('erc20');

      // 2. Get writable functions
      const writableFunctions = adapter.getWritableFunctions(contract);
      expect(writableFunctions.length).toBeGreaterThan(0);

      // 3. Get a function to test
      const testFunction = writableFunctions[0];

      // 4. Generate a form schema
      const formSchema = factory.generateFormSchema(contract, testFunction.id, 'evm');

      // 5. Verify the schema is complete and valid
      expect(formSchema.id).toBe(`form-${testFunction.id}`);
      expect(formSchema.fields.length).toBe(testFunction.inputs.length);
      expect(formSchema.layout).toBeDefined();
      expect(formSchema.validation).toBeDefined();
      expect(formSchema.submitButton).toBeDefined();

      // 6. Verify each field has the correct structure
      for (let i = 0; i < formSchema.fields.length; i++) {
        const field = formSchema.fields[i];
        const input = testFunction.inputs[i];

        // Field should map to the correct input
        expect(field.name).toBe(input.name);

        // Field should have a type mapped from the parameter type
        const expectedType = adapter.mapParameterTypeToFieldType(input.type);
        expect(field.type).toBe(expectedType);

        // Field should have transforms
        expect(field.transforms).toBeDefined();
        expect(field.transforms?.input).toBeDefined();
        expect(field.transforms?.output).toBeDefined();
      }
    });
  });
});
