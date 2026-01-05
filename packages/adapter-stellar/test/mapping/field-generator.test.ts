import { describe, expect, it } from 'vitest';

import type { FunctionParameter } from '@openzeppelin/ui-types';

import { generateStellarDefaultField } from '../../src/mapping/field-generator';

describe('generateStellarDefaultField', () => {
  describe('basic field generation', () => {
    it('should set maxBytes metadata for BytesN parameter', () => {
      const parameter: FunctionParameter = {
        name: 'signature',
        type: 'BytesN<65>',
        displayName: 'Signature',
        description: 'Compressed signature',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result).toMatchObject({
        name: 'signature',
        label: 'Signature',
        type: 'bytes',
        metadata: { maxBytes: 65 },
        validation: { required: true },
      });
    });
    it('should generate field for Address parameter', () => {
      const parameter: FunctionParameter = {
        name: 'user_address',
        type: 'Address',
        displayName: 'User Address',
        description: "The user's Stellar address",
      };

      const result = generateStellarDefaultField(parameter);

      expect(result).toMatchObject({
        name: 'user_address',
        label: 'User Address',
        type: 'blockchain-address',
        placeholder: 'Enter User Address',
        helperText: "The user's Stellar address",
        width: 'full',
        validation: { required: true },
      });
      expect(result.id).toMatch(/^field-[a-z0-9]+$/);
    });

    it('should generate field for U128 parameter', () => {
      const parameter: FunctionParameter = {
        name: 'amount',
        type: 'U128',
        displayName: 'Amount',
        description: 'Token amount',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result).toMatchObject({
        name: 'amount',
        label: 'Amount',
        type: 'bigint',
        placeholder: 'Enter Amount',
        helperText: 'Token amount',
        width: 'full',
        validation: { required: true },
      });
    });

    it('should generate field for Bool parameter', () => {
      const parameter: FunctionParameter = {
        name: 'is_active',
        type: 'Bool',
        displayName: 'Is Active',
        description: 'Whether the account is active',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result).toMatchObject({
        name: 'is_active',
        label: 'Is Active',
        type: 'checkbox',
        placeholder: 'Enter Is Active',
        helperText: 'Whether the account is active',
        width: 'full',
        validation: { required: true },
      });
    });

    it('should generate field for ScString parameter', () => {
      const parameter: FunctionParameter = {
        name: 'description',
        type: 'ScString',
        displayName: 'Description',
        description: 'Account description',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result).toMatchObject({
        name: 'description',
        label: 'Description',
        type: 'text',
        placeholder: 'Enter Description',
        helperText: 'Account description',
        width: 'full',
        validation: { required: true },
      });
    });

    it('should generate field for Vec parameter', () => {
      const parameter: FunctionParameter = {
        name: 'items',
        type: 'Vec<U32>',
        displayName: 'Items',
        description: 'List of item IDs',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result).toMatchObject({
        name: 'items',
        label: 'Items',
        type: 'array',
        placeholder: 'Enter Items',
        helperText: 'List of item IDs',
        width: 'full',
        validation: { required: true },
        elementType: 'number',
        elementFieldConfig: {
          type: 'number',
          validation: { required: true },
          placeholder: 'Enter U32',
        },
      });
    });

    it('should generate field for Vec<Address> parameter', () => {
      const parameter: FunctionParameter = {
        name: 'addresses',
        type: 'Vec<Address>',
        displayName: 'Addresses',
        description: 'List of user addresses',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result).toMatchObject({
        name: 'addresses',
        label: 'Addresses',
        type: 'array',
        elementType: 'blockchain-address',
        elementFieldConfig: {
          type: 'blockchain-address',
          validation: { required: true },
          placeholder: 'Enter Address',
        },
      });
    });

    it('should generate field for Vec<Bool> parameter', () => {
      const parameter: FunctionParameter = {
        name: 'flags',
        type: 'Vec<Bool>',
        displayName: 'Flags',
        description: 'List of boolean flags',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result).toMatchObject({
        name: 'flags',
        label: 'Flags',
        type: 'array',
        elementType: 'checkbox',
        elementFieldConfig: {
          type: 'checkbox',
          validation: { required: true },
          placeholder: 'Enter Bool',
        },
      });
    });

    it('should create components for tuple parameters', () => {
      const parameter: FunctionParameter = {
        name: 'config',
        type: 'Tuple<ScString, U32>',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result.type).toBe('object');
      expect(result.components).toEqual([
        {
          name: 'item_0',
          type: 'ScString',
          displayName: 'Value 1 (ScString)',
        },
        {
          name: 'item_1',
          type: 'U32',
          displayName: 'Value 2 (U32)',
        },
      ]);
    });
  });

  describe('fallback scenarios', () => {
    it('should use type as name when name is missing', () => {
      const parameter: Partial<FunctionParameter> & { type: string } = {
        type: 'Address',
      };

      const result = generateStellarDefaultField(parameter as FunctionParameter);

      expect(result.name).toBe('Address');
      expect(result.label).toBe('Address');
      expect(result.placeholder).toBe('Enter Address');
    });

    it('should use name when displayName is missing', () => {
      const parameter: FunctionParameter = {
        name: 'user_addr',
        type: 'Address',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result.label).toBe('User Addr');
      expect(result.placeholder).toBe('Enter user_addr');
    });

    it('should handle empty description', () => {
      const parameter: FunctionParameter = {
        name: 'value',
        type: 'U64',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result.helperText).toBe('');
    });
  });

  describe('complex types', () => {
    it('should generate field for custom struct with components', () => {
      const parameter: FunctionParameter = {
        name: 'user_info',
        type: 'UserInfo',
        displayName: 'User Info',
        description: 'User information struct',
        components: [
          { name: 'name', type: 'ScString' },
          { name: 'age', type: 'U32' },
          { name: 'address', type: 'Address' },
        ],
      };

      const result = generateStellarDefaultField(parameter);

      expect(result).toMatchObject({
        name: 'user_info',
        label: 'User Info',
        type: 'object',
        components: parameter.components,
      });
    });

    it('should generate field for Vec of custom structs', () => {
      const parameter: FunctionParameter = {
        name: 'user_list',
        type: 'Vec<UserInfo>',
        displayName: 'User List',
        components: [
          { name: 'name', type: 'ScString' },
          { name: 'age', type: 'U32' },
        ],
      };

      const result = generateStellarDefaultField(parameter);

      expect(result).toMatchObject({
        name: 'user_list',
        label: 'User List',
        type: 'array',
        elementFieldConfig: {
          type: 'object',
          components: parameter.components,
        },
      });
    });
  });

  describe('numeric bounds validation', () => {
    it('should apply bounds for U32 type', () => {
      const parameter: FunctionParameter = {
        name: 'count',
        type: 'U32',
        displayName: 'Count',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result.validation.min).toBe(0);
      expect(result.validation.max).toBe(4_294_967_295);
    });

    it('should apply bounds for U8 type', () => {
      const parameter: FunctionParameter = {
        name: 'byte',
        type: 'U8',
        displayName: 'Byte',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result.validation.min).toBe(0);
      expect(result.validation.max).toBe(255);
    });

    it('should apply bounds for I8 type', () => {
      const parameter: FunctionParameter = {
        name: 'signedByte',
        type: 'I8',
        displayName: 'Signed Byte',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result.validation.min).toBe(-128);
      expect(result.validation.max).toBe(127);
    });

    it('should apply bounds for I32 type', () => {
      const parameter: FunctionParameter = {
        name: 'signedInt',
        type: 'I32',
        displayName: 'Signed Int',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result.validation.min).toBe(-2_147_483_648);
      expect(result.validation.max).toBe(2_147_483_647);
    });

    it('should apply bounds to Vec<U32> element fields', () => {
      const parameter: FunctionParameter = {
        name: 'counts',
        type: 'Vec<U32>',
        displayName: 'Counts',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result.elementFieldConfig).toBeDefined();
      expect(result.elementFieldConfig!.validation).toBeDefined();
      expect(result.elementFieldConfig!.validation!.min).toBe(0);
      expect(result.elementFieldConfig!.validation!.max).toBe(4_294_967_295);
    });

    it('should apply bounds to map key/value fields', () => {
      const parameter: FunctionParameter = {
        name: 'scores',
        type: 'Map<U32, I32>',
        displayName: 'Scores',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result.mapMetadata).toBeDefined();
      const keyConfig = result.mapMetadata!.keyFieldConfig;
      const valueConfig = result.mapMetadata!.valueFieldConfig;
      expect(keyConfig).toBeDefined();
      expect(valueConfig).toBeDefined();
      expect(keyConfig!.validation).toBeDefined();
      expect(valueConfig!.validation).toBeDefined();
      expect(keyConfig!.validation!.min).toBe(0);
      expect(keyConfig!.validation!.max).toBe(4_294_967_295);
      expect(valueConfig!.validation!.min).toBe(-2_147_483_648);
      expect(valueConfig!.validation!.max).toBe(2_147_483_647);
    });
  });

  describe('validation handling', () => {
    it('should only include basic validation in field config', () => {
      const parameter: FunctionParameter = {
        name: 'recipient',
        type: 'Address',
      };

      const result = generateStellarDefaultField(parameter);

      // Field config should only have basic validation (serializable)
      expect(result.validation).toEqual({ required: true });
      expect(result.validation).not.toHaveProperty('custom');
    });

    it('should add basic required validation for other types', () => {
      const parameter: FunctionParameter = {
        name: 'amount',
        type: 'U128',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result.validation).toEqual({ required: true });
    });

    it('should generate field for BytesN parameter', () => {
      const parameter: FunctionParameter = {
        name: 'signature',
        type: 'BytesN<65>',
        displayName: 'Signature',
        description: 'Compressed signature',
      };

      const result = generateStellarDefaultField(parameter);

      expect(result).toMatchObject({
        name: 'signature',
        label: 'Signature',
        type: 'bytes',
        metadata: { maxBytes: 65 },
        placeholder: 'Enter Signature',
        helperText: 'Compressed signature',
        validation: { required: true },
        width: 'full',
      });
    });
  });

  describe('default values', () => {
    it('should set appropriate default values for different types', () => {
      const testCases = [
        { type: 'Address', expectedDefault: '' },
        { type: 'U32', expectedDefault: 0 },
        { type: 'Bool', expectedDefault: false },
        { type: 'ScString', expectedDefault: '' },
        { type: 'Vec<U32>', expectedDefault: [] },
        { type: 'CustomStruct', expectedDefault: {} },
      ];

      testCases.forEach(({ type, expectedDefault }) => {
        const parameter: FunctionParameter = {
          name: 'test',
          type,
        };

        const result = generateStellarDefaultField(parameter);
        expect(result.defaultValue).toEqual(expectedDefault);
      });
    });
  });

  describe('field ID generation', () => {
    it('should generate unique field IDs', () => {
      const parameter: FunctionParameter = {
        name: 'test',
        type: 'Address',
      };

      const field1 = generateStellarDefaultField(parameter);
      const field2 = generateStellarDefaultField(parameter);

      expect(field1.id).not.toBe(field2.id);
      expect(field1.id).toMatch(/^field-[a-z0-9]+$/);
      expect(field2.id).toMatch(/^field-[a-z0-9]+$/);
    });
  });
});
