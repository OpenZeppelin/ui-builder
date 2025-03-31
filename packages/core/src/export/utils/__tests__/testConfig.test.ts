import { describe, expect, it } from 'vitest';

import { createComplexFormConfig, createMinimalFormConfig, createTestField } from '../testConfig';

describe('Test Configuration Utilities', () => {
  describe('createMinimalFormConfig', () => {
    it('should create a valid minimal form configuration', () => {
      const config = createMinimalFormConfig('testFunc', 'evm');

      // Verify basic structure
      expect(config.functionId).toBe('testFunc');
      expect(config.fields).toHaveLength(1);
      expect(config.fields[0].name).toBe('testParam');
      expect(config.layout.columns).toBe(1);
      expect(config.validation.mode).toBe('onChange');

      // Verify it has all required properties of BuilderFormConfig
      expect(config).toHaveProperty('functionId');
      expect(config).toHaveProperty('fields');
      expect(config).toHaveProperty('layout');
      expect(config).toHaveProperty('validation');
      expect(config).toHaveProperty('theme');
    });

    it('should use default values when parameters are not provided', () => {
      const config = createMinimalFormConfig();

      expect(config.functionId).toBe('testFunction');
    });
  });

  describe('createComplexFormConfig', () => {
    it('should create a complex form configuration with multiple fields', () => {
      const config = createComplexFormConfig('complexFunc', 'evm');

      // Verify basic structure
      expect(config.functionId).toBe('complexFunc');
      expect(config.fields).toHaveLength(7);

      // Verify field types
      const fieldTypes = config.fields.map((f) => f.type);
      expect(fieldTypes).toContain('text');
      expect(fieldTypes).toContain('number');
      expect(fieldTypes).toContain('checkbox');
      expect(fieldTypes).toContain('address');

      // Verify sections
      expect(config.layout.sections).toHaveLength(2);
      expect(config.layout.sections?.[0].title).toBe('Basic Parameters');
      expect(config.layout.sections?.[1].title).toBe('Advanced Parameters');

      // Verify field IDs in sections match actual field IDs
      const basicSectionFields = config.layout.sections?.[0].fields || [];
      const advancedSectionFields = config.layout.sections?.[1].fields || [];

      // Get all field IDs
      const fieldIds = config.fields.map((f) => f.id);

      // Verify all section field IDs exist in the fields array
      basicSectionFields.forEach((id) => {
        expect(fieldIds).toContain(id);
      });

      advancedSectionFields.forEach((id) => {
        expect(fieldIds).toContain(id);
      });
    });
  });

  describe('createTestField', () => {
    it('should create a valid field configuration', () => {
      const field = createTestField('text', 'testField', 'Test Field');

      expect(field.id).toBeDefined();
      expect(field.name).toBe('testField');
      expect(field.label).toBe('Test Field');
      expect(field.type).toBe('text');
      expect(field.validation.required).toBe(true);
      expect(field.helperText).toBe('Description for Test Field');
      expect(field.placeholder).toBe('Enter test field');
    });

    it('should incorporate custom options', () => {
      const field = createTestField('select', 'testSelect', 'Test Select', {
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
        ],
        defaultValue: 'option1',
      });

      expect(field.type).toBe('select');
      expect(field.options).toHaveLength(2);
      expect(field.defaultValue).toBe('option1');
    });
  });
});
