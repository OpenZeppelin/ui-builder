import { describe, expect, it } from 'vitest';

import type { FunctionParameter } from '@openzeppelin/contracts-ui-builder-types';

import { generateStellarDefaultField } from '../../src/mapping/field-generator';

describe('generateStellarDefaultField', () => {
  describe('basic field generation', () => {
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
        type: 'number',
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
      });
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
        type: 'array-object',
        components: parameter.components,
      });
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
