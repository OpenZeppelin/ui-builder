import { describe, expect, it } from 'vitest';

import { getContractAdapter } from '../../../adapters';
import { FormSchemaFactory } from '../FormSchemaFactory';

describe('Adapter Integration Tests', () => {
  // Initialize the factory and adapter
  const factory = new FormSchemaFactory();
  const adapter = getContractAdapter('evm');

  describe('ERC20 Function Integration', () => {
    it('should generate a form schema for ERC20 transfer function', async () => {
      // Load the contract schema using the proper mock ID from MOCK_CONTRACTS.json
      const erc20Schema = await adapter.loadMockContract('erc20');
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
      // Load the contract schema properly
      const erc20Schema = await adapter.loadMockContract('erc20');
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
      const inputTesterSchema = await adapter.loadMockContract('input-tester');
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
      const inputTesterSchema = await adapter.loadMockContract('input-tester');
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
      const inputTesterSchema = await adapter.loadMockContract('input-tester');
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

  describe('End-to-End Form Generation', () => {
    it('should generate forms for all ERC20 functions', async () => {
      const erc20Schema = await adapter.loadMockContract('erc20');
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
      const inputTesterSchema = await adapter.loadMockContract('input-tester');
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
  });
});
