import { xdr } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';

import type { ContractSchema, FunctionParameter } from '@openzeppelin/ui-builder-types';

import { generateStellarDefaultField } from '../../src/mapping/field-generator';
import {
  getStellarCompatibleFieldTypes,
  mapStellarParameterTypeToFieldType,
} from '../../src/mapping/type-mapper';

describe('Enum Field Mapping', () => {
  describe('mapStellarParameterTypeToFieldType', () => {
    it('should map unit enum types to select', () => {
      const result = mapStellarParameterTypeToFieldType('DemoEnum');
      expect(result).toBe('select');
    });

    it('should map complex enum types to select (fallback to object later)', () => {
      const result = mapStellarParameterTypeToFieldType('ComplexEnum');
      expect(result).toBe('select');
    });

    it('should map unknown enum types to select', () => {
      const result = mapStellarParameterTypeToFieldType('UnknownEnum');
      expect(result).toBe('select');
    });

    it('should not affect non-enum types', () => {
      expect(mapStellarParameterTypeToFieldType('Address')).toBe('blockchain-address');
      expect(mapStellarParameterTypeToFieldType('U32')).toBe('number');
      expect(mapStellarParameterTypeToFieldType('Bool')).toBe('checkbox');
    });
  });

  describe('generateStellarDefaultField with enum detection', () => {
    it('should generate select field for unit-only enum with options', () => {
      const parameter: FunctionParameter = {
        name: 'choice',
        type: 'DemoEnum',
        description: 'Choose a demo option',
      };

      // Mock spec entries for unit-only enum
      const mockSpecEntries: xdr.ScSpecEntry[] = [
        {
          switch: () => xdr.ScSpecEntryKind.scSpecEntryUdtUnionV0(),
          value: () => ({
            name: () => ({ toString: () => 'DemoEnum' }),
          }),
          udtUnionV0: () => ({
            name: () => ({ toString: () => 'DemoEnum' }),
            doc: () => ({ toString: () => 'Demo enum for testing' }),
            cases: () => [
              {
                switch: () => xdr.ScSpecUdtUnionCaseV0Kind.scSpecUdtUnionCaseVoidV0(),
                voidCase: () => ({
                  name: () => ({ toString: () => 'One' }),
                  doc: () => ({ toString: () => 'First option' }),
                }),
              },
              {
                switch: () => xdr.ScSpecUdtUnionCaseV0Kind.scSpecUdtUnionCaseVoidV0(),
                voidCase: () => ({
                  name: () => ({ toString: () => 'Two' }),
                  doc: () => ({ toString: () => 'Second option' }),
                }),
              },
              {
                switch: () => xdr.ScSpecUdtUnionCaseV0Kind.scSpecUdtUnionCaseVoidV0(),
                voidCase: () => ({
                  name: () => ({ toString: () => 'Three' }),
                  doc: () => ({ toString: () => 'Third option' }),
                }),
              },
            ],
          }),
        } as unknown as xdr.ScSpecEntry,
      ];

      const mockContractSchema: ContractSchema = {
        ecosystem: 'stellar',
        functions: [],
        metadata: {
          specEntries: mockSpecEntries,
        },
      };

      const result = generateStellarDefaultField(parameter, mockContractSchema);

      expect(result.type).toBe('select');
      expect(result.options).toEqual([
        { label: 'One', value: 'One' },
        { label: 'Two', value: 'Two' },
        { label: 'Three', value: 'Three' },
      ]);
      expect(result.placeholder).toBe('Select choice');
    });

    it('should generate object field for complex enum with helper text', () => {
      const parameter: FunctionParameter = {
        name: 'choice',
        type: 'ComplexEnum',
        description: 'Choose a complex option',
      };

      // Mock spec entries for complex enum with payloads
      const mockSpecEntries: xdr.ScSpecEntry[] = [
        {
          switch: () => xdr.ScSpecEntryKind.scSpecEntryUdtUnionV0(),
          value: () => ({
            name: () => ({ toString: () => 'ComplexEnum' }),
          }),
          udtUnionV0: () => ({
            name: () => ({ toString: () => 'ComplexEnum' }),
            doc: () => ({ toString: () => 'Complex enum with payloads' }),
            cases: () => [
              {
                switch: () => xdr.ScSpecUdtUnionCaseV0Kind.scSpecUdtUnionCaseVoidV0(),
                voidCase: () => ({
                  name: () => ({ toString: () => 'One' }),
                  doc: () => ({ toString: () => 'Unit variant' }),
                }),
              },
              {
                switch: () => xdr.ScSpecUdtUnionCaseV0Kind.scSpecUdtUnionCaseTupleV0(),
                tupleCase: () => ({
                  name: () => ({ toString: () => 'Two' }),
                  doc: () => ({ toString: () => 'Variant with u32' }),
                  type: () => [
                    {
                      switch: () => xdr.ScSpecType.scSpecTypeU32(),
                    },
                  ],
                }),
              },
            ],
          }),
        } as unknown as xdr.ScSpecEntry,
      ];

      const mockContractSchema: ContractSchema = {
        ecosystem: 'stellar',
        functions: [],
        metadata: {
          specEntries: mockSpecEntries,
        },
      };

      const result = generateStellarDefaultField(parameter, mockContractSchema);

      expect(result.type).toBe('enum');
      expect(result.helperText).toBe('Choose a complex option');
    });

    it('should generate select field for integer enum with numeric values', () => {
      const parameter: FunctionParameter = {
        name: 'priority',
        type: 'Priority',
        description: 'Set priority level',
      };

      // Mock spec entries for integer enum
      const mockSpecEntries: xdr.ScSpecEntry[] = [
        {
          switch: () => xdr.ScSpecEntryKind.scSpecEntryUdtEnumV0(),
          value: () => ({
            name: () => ({ toString: () => 'Priority' }),
          }),
          udtEnumV0: () => ({
            name: () => ({ toString: () => 'Priority' }),
            doc: () => ({ toString: () => 'Priority levels' }),
            cases: () => [
              {
                name: () => ({ toString: () => 'Low' }),
                value: () => 0,
                doc: () => ({ toString: () => 'Low priority' }),
              },
              {
                name: () => ({ toString: () => 'Medium' }),
                value: () => 1,
                doc: () => ({ toString: () => 'Medium priority' }),
              },
              {
                name: () => ({ toString: () => 'High' }),
                value: () => 2,
                doc: () => ({ toString: () => 'High priority' }),
              },
            ],
          }),
        } as unknown as xdr.ScSpecEntry,
      ];

      const mockContractSchema: ContractSchema = {
        ecosystem: 'stellar',
        functions: [],
        metadata: {
          specEntries: mockSpecEntries,
        },
      };

      const result = generateStellarDefaultField(parameter, mockContractSchema);

      expect(result.type).toBe('select');
      expect(result.options).toEqual([
        { label: 'Low', value: '0' },
        { label: 'Medium', value: '1' },
        { label: 'High', value: '2' },
      ]);
    });

    it('should fallback to enum field with empty metadata for unknown enum', () => {
      const parameter: FunctionParameter = {
        name: 'choice',
        type: 'UnknownEnum',
        description: 'Unknown enum type',
      };

      // No spec entries provided
      const mockContractSchema: ContractSchema = {
        ecosystem: 'stellar',
        functions: [],
        metadata: {
          specEntries: [],
        },
      };

      const result = generateStellarDefaultField(parameter, mockContractSchema);

      expect(result.type).toBe('enum');
      expect(result.options).toBeUndefined();
      expect(result.helperText).toBe('Unknown enum type');
      expect(result.enumMetadata).toBeDefined();
      expect(result.enumMetadata?.variants).toEqual([]);
    });

    it('should not affect non-enum types', () => {
      const parameter: FunctionParameter = {
        name: 'address',
        type: 'Address',
        description: 'User address',
      };

      const mockContractSchema: ContractSchema = {
        ecosystem: 'stellar',
        functions: [],
        metadata: {
          specEntries: [],
        },
      };

      const result = generateStellarDefaultField(parameter, mockContractSchema);

      expect(result.type).toBe('blockchain-address');
      expect(result.options).toBeUndefined();
    });
  });

  describe('Enum detection logic', () => {
    it('should detect enum types by naming convention', () => {
      const enumTypes = ['DemoEnum', 'Priority', 'Status', 'MyCustomEnum', 'TokenType'];

      enumTypes.forEach((type) => {
        const result = mapStellarParameterTypeToFieldType(type);
        expect(result).toBe('select');
      });
    });

    it('should return enum as first compatible field type for enum types', () => {
      const enumTypes = ['DemoEnum', 'Priority', 'Status', 'MyCustomEnum', 'TokenType'];

      enumTypes.forEach((type) => {
        const result = getStellarCompatibleFieldTypes(type);
        expect(result[0]).toBe('enum');
        expect(result).toContain('select');
        expect(result).toContain('radio');
        expect(result).toContain('text');
      });
    });

    it('should not detect non-enum types as enums', () => {
      const nonEnumTypes = [
        'Address',
        'U32',
        'String',
        'Bool',
        'Vec<Address>',
        'Option<U32>',
        'UserInfo', // struct
        'TokenData', // struct
      ];

      nonEnumTypes.forEach((type) => {
        const result = mapStellarParameterTypeToFieldType(type);
        expect(result).not.toBe('select');
      });
    });
  });
});
