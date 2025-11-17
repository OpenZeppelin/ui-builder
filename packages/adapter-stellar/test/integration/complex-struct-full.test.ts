import { Contract } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';

import type { ContractSchema, FormFieldType } from '@openzeppelin/ui-builder-types';

import { generateStellarDefaultField } from '../../src/mapping/field-generator';
import { formatStellarTransactionData } from '../../src/transaction/formatter';
import { valueToScVal } from '../../src/transform/parsers/scval-converter';

const mockContractAddress = 'CAKQRPNF7NC34CIDCLXE47Q35DYJHBYHCJRVP5QHT6ESGFGAZB7TRFDP';

describe('ComplexStruct Full Integration Test', () => {
  // Mock the contract schema as it would come from loading the other_custom_types contract
  const complexStructContractSchema: ContractSchema = {
    name: 'CustomTypesContract',
    address: mockContractAddress,
    ecosystem: 'stellar',
    functions: [
      {
        id: 'complex_struct_ComplexStruct',
        name: 'complex_struct',
        displayName: 'Complex Struct',
        type: 'function',
        modifiesState: true,
        inputs: [
          {
            name: 'complex_struct',
            type: 'ComplexStruct',
            components: [
              { name: 'a32', type: 'U32' },
              { name: 'a64', type: 'U64' },
              { name: 'admin', type: 'Address' },
              { name: 'assets_vec', type: 'Vec<ComplexEnum2>' },
              { name: 'b32', type: 'U32' },
              { name: 'base_asset', type: 'ComplexEnum2' },
              { name: 'c32', type: 'U32' },
              { name: 'complex_enum3', type: 'ComplexEnum3' },
            ],
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    ],
  };

  it('should render all fields correctly for complex_struct function', () => {
    const parameter = complexStructContractSchema.functions[0].inputs[0];

    // Generate the field - in real app this would be done by FormGenerator
    const field = generateStellarDefaultField(parameter, complexStructContractSchema);

    // Verify it's an object field with components
    expect(field.type).toBe('object');
    expect(field.components).toBeDefined();
    expect(field.components).toHaveLength(8);

    // Verify each component has the correct type
    const componentByName = new Map(field.components!.map((c) => [c.name, c]));

    expect(componentByName.get('a32')?.type).toBe('U32');
    expect(componentByName.get('admin')?.type).toBe('Address');
    expect(componentByName.get('assets_vec')?.type).toBe('Vec<ComplexEnum2>');
    expect(componentByName.get('base_asset')?.type).toBe('ComplexEnum2');
    expect(componentByName.get('complex_enum3')?.type).toBe('ComplexEnum3');
  });

  it('should format and serialize complete ComplexStruct transaction', () => {
    // Step 1: Generate field configuration as the UI would

    // Mock field with enum metadata (normally comes from generateStellarDefaultField with specEntries)
    const fieldWithMetadata: FormFieldType = {
      id: 'test-field',
      name: 'complex_struct',
      label: 'Complex Struct',
      type: 'object',
      validation: {},
      components: [
        { name: 'a32', type: 'U32' },
        { name: 'a64', type: 'U64' },
        { name: 'admin', type: 'Address' },
        { name: 'assets_vec', type: 'Vec<ComplexEnum2>' },
        { name: 'b32', type: 'U32' },
        {
          name: 'base_asset',
          type: 'ComplexEnum2',
        },
        { name: 'c32', type: 'U32' },
        {
          name: 'complex_enum3',
          type: 'ComplexEnum3',
        },
      ],
      // Add enum metadata for the enum fields
      enumMetadata: undefined, // Struct itself doesn't have enum metadata
    };

    // Add enum metadata to the base_asset field
    const baseAssetField: FormFieldType = {
      id: 'base-asset',
      name: 'complex_struct.base_asset',
      label: 'Base Asset',
      type: 'enum',
      validation: {},
      enumMetadata: {
        name: 'ComplexEnum2',
        isUnitOnly: false,
        variants: [
          { name: 'Stellar', type: 'tuple', payloadTypes: ['Address'] },
          { name: 'Other', type: 'tuple', payloadTypes: ['ScSymbol'] },
        ],
      },
    };

    // Add enum metadata to the complex_enum3 field
    const complexEnum3Field: FormFieldType = {
      id: 'complex-enum3',
      name: 'complex_struct.complex_enum3',
      label: 'Complex Enum 3',
      type: 'enum',
      validation: {},
      enumMetadata: {
        name: 'ComplexEnum3',
        isUnitOnly: false,
        variants: [
          {
            name: 'Some',
            type: 'tuple',
            payloadTypes: ['Address', 'I128'],
            isSingleTuplePayload: true,
          },
          { name: 'None', type: 'void' },
        ],
      },
    };

    // Add enum metadata to the assets_vec field's elements
    const assetsVecField: FormFieldType = {
      id: 'assets-vec',
      name: 'complex_struct.assets_vec',
      label: 'Assets Vec',
      type: 'array',
      validation: {},
      elementType: 'enum',
      elementFieldConfig: {
        type: 'enum',
        validation: { required: true },
        placeholder: 'Enter ComplexEnum2',
        originalParameterType: 'ComplexEnum2',
        enumMetadata: {
          name: 'ComplexEnum2',
          isUnitOnly: false,
          variants: [
            { name: 'Stellar', type: 'tuple', payloadTypes: ['Address'] },
            { name: 'Other', type: 'tuple', payloadTypes: ['ScSymbol'] },
          ],
        },
      },
    };

    // Step 2: Simulate form submission with all fields filled
    const submittedInputs = {
      complex_struct: {
        a32: 234234,
        a64: 3242342,
        admin: mockContractAddress,
        assets_vec: [
          { tag: 'Stellar', values: [mockContractAddress] },
          { tag: 'Other', values: ['ffsdfsdf'] },
        ],
        b32: 42244,
        base_asset: { tag: 'Stellar', values: [mockContractAddress] },
        c32: 23424234,
        complex_enum3: { tag: 'Some', values: [mockContractAddress, '23423423'] },
      },
    };

    // Step 3: Format transaction data (include all three fields for proper schema)
    const transactionData = formatStellarTransactionData(
      complexStructContractSchema,
      'complex_struct_ComplexStruct',
      submittedInputs,
      [fieldWithMetadata, baseAssetField, complexEnum3Field, assetsVecField]
    );

    // Step 4: Verify args are formatted correctly
    expect(transactionData.args).toHaveLength(1);
    expect(transactionData.argTypes).toEqual(['ComplexStruct']);

    // Verify argSchema has enum metadata for Vec field
    const argSchema = transactionData.argSchema![0];
    const assetsVecComponent = argSchema.components?.find((c) => c.name === 'assets_vec');
    expect(assetsVecComponent?.enumMetadata).toBeDefined();
    expect(assetsVecComponent?.enumMetadata?.name).toBe('ComplexEnum2');

    // Step 5: Convert to ScVal and verify structure
    const scVal = valueToScVal(
      transactionData.args[0],
      transactionData.argTypes[0],
      transactionData.argSchema![0]
    );

    // Should be a Map (struct)
    expect(scVal.switch().name).toBe('scvMap');

    const mapEntries = scVal.map();
    expect(mapEntries.length).toBe(8);

    // Verify assets_vec is properly converted
    const assetsVecEntry = mapEntries.find((e) => e.key().sym().toString() === 'assets_vec');
    expect(assetsVecEntry).toBeDefined();

    const assetsVecValue = assetsVecEntry!.val();
    expect(assetsVecValue.switch().name).toBe('scvVec'); // Array

    const assetsArray = assetsVecValue.vec();
    expect(assetsArray).toHaveLength(2); // 2 enum items

    // Each item should be a properly formatted enum ScVec
    assetsArray.forEach((enumItem) => {
      expect(enumItem.switch().name).toBe('scvVec');
      const enumVec = enumItem.vec();
      expect(enumVec[0].switch().name).toBe('scvSymbol'); // Tag
      // Second item should be properly typed (Address or Symbol)
      expect(['scvAddress', 'scvSymbol']).toContain(enumVec[1].switch().name);
    });

    // Verify base_asset enum
    const baseAssetEntry = mapEntries.find((e) => e.key().sym().toString() === 'base_asset');
    expect(baseAssetEntry).toBeDefined();

    const baseAssetValue = baseAssetEntry!.val();
    expect(baseAssetValue.switch().name).toBe('scvVec');

    const baseAssetVec = baseAssetValue.vec();
    expect(baseAssetVec).toHaveLength(2); // Symbol + Address
    expect(baseAssetVec[0].switch().name).toBe('scvSymbol');
    expect(baseAssetVec[0].sym().toString()).toBe('Stellar');
    expect(baseAssetVec[1].switch().name).toBe('scvAddress');

    // Verify complex_enum3 with tuple payload
    const complexEnum3Entry = mapEntries.find((e) => e.key().sym().toString() === 'complex_enum3');
    expect(complexEnum3Entry).toBeDefined();

    const complexEnum3Value = complexEnum3Entry!.val();
    expect(complexEnum3Value.switch().name).toBe('scvVec');

    const complexEnum3Vec = complexEnum3Value.vec();
    expect(complexEnum3Vec).toHaveLength(2); // Symbol + Tuple (wrapped)
    expect(complexEnum3Vec[0].switch().name).toBe('scvSymbol');
    expect(complexEnum3Vec[0].sym().toString()).toBe('Some');

    // The tuple payload should be wrapped in another ScVec
    expect(complexEnum3Vec[1].switch().name).toBe('scvVec');
    const tupleVec = complexEnum3Vec[1].vec();
    expect(tupleVec).toHaveLength(2);
    expect(tupleVec[0].switch().name).toBe('scvAddress');
    expect(tupleVec[1].switch().name).toBe('scvI128');
  });

  it('should build valid Stellar SDK contract call', () => {
    // Step 1: Prepare the same data
    const submittedInputs = {
      complex_struct: {
        a32: 234234,
        a64: 3242342,
        admin: mockContractAddress,
        assets_vec: [
          { tag: 'Stellar', values: [mockContractAddress] },
          { tag: 'Other', values: ['test_symbol'] },
        ],
        b32: 42244,
        base_asset: { tag: 'Stellar', values: [mockContractAddress] },
        c32: 23424234,
        complex_enum3: { tag: 'Some', values: [mockContractAddress, '23423423'] },
      },
    };

    const fieldWithMetadata: FormFieldType = {
      id: 'test-field',
      name: 'complex_struct',
      label: 'Complex Struct',
      type: 'object',
      validation: {},
      components: [
        { name: 'a32', type: 'U32' },
        { name: 'a64', type: 'U64' },
        { name: 'admin', type: 'Address' },
        { name: 'assets_vec', type: 'Vec<ComplexEnum2>' },
        { name: 'b32', type: 'U32' },
        { name: 'base_asset', type: 'ComplexEnum2' },
        { name: 'c32', type: 'U32' },
        { name: 'complex_enum3', type: 'ComplexEnum3' },
      ],
    };

    const assetsVecField: FormFieldType = {
      id: 'assets-vec',
      name: 'complex_struct.assets_vec',
      label: 'Assets Vec',
      type: 'array',
      validation: {},
      elementFieldConfig: {
        type: 'enum',
        validation: { required: true },
        placeholder: 'Enter ComplexEnum2',
        originalParameterType: 'ComplexEnum2',
        enumMetadata: {
          name: 'ComplexEnum2',
          isUnitOnly: false,
          variants: [
            { name: 'Stellar', type: 'tuple', payloadTypes: ['Address'] },
            { name: 'Other', type: 'tuple', payloadTypes: ['ScSymbol'] },
          ],
        },
      },
    };

    const baseAssetField: FormFieldType = {
      id: 'base-asset',
      name: 'complex_struct.base_asset',
      label: 'Base Asset',
      type: 'enum',
      validation: {},
      enumMetadata: {
        name: 'ComplexEnum2',
        isUnitOnly: false,
        variants: [
          { name: 'Stellar', type: 'tuple', payloadTypes: ['Address'] },
          { name: 'Other', type: 'tuple', payloadTypes: ['ScSymbol'] },
        ],
      },
    };

    const complexEnum3Field: FormFieldType = {
      id: 'complex-enum3',
      name: 'complex_struct.complex_enum3',
      label: 'Complex Enum 3',
      type: 'enum',
      validation: {},
      enumMetadata: {
        name: 'ComplexEnum3',
        isUnitOnly: false,
        variants: [
          {
            name: 'Some',
            type: 'tuple',
            payloadTypes: ['Address', 'I128'],
            isSingleTuplePayload: true,
          },
          { name: 'None', type: 'void' },
        ],
      },
    };

    // Step 2: Format transaction data
    const transactionData = formatStellarTransactionData(
      complexStructContractSchema,
      'complex_struct_ComplexStruct',
      submittedInputs,
      [fieldWithMetadata, assetsVecField, baseAssetField, complexEnum3Field]
    );

    // Step 3: Convert to ScVal (this is what happens in eoa.ts)
    const scValArgs = transactionData.args.map((arg, index) => {
      const argType = transactionData.argTypes[index];
      const argSchema = transactionData.argSchema?.[index];
      return valueToScVal(arg, argType, argSchema);
    });

    expect(scValArgs).toHaveLength(1);

    // Step 4: Verify we can create a contract call operation
    const contract = new Contract(mockContractAddress);

    // This should not throw - if it throws, the ScVal format is wrong
    expect(() => {
      contract.call(transactionData.functionName, ...scValArgs);
    }).not.toThrow();

    // Step 5: Verify the struct ScVal structure in detail
    const structScVal = scValArgs[0];
    expect(structScVal.switch().name).toBe('scvMap');

    const structMap = structScVal.map();
    expect(structMap.length).toBe(8);

    // Verify all fields are present and correctly typed
    const fieldMap = new Map(structMap.map((e) => [e.key().sym().toString(), e.val()]));

    // Primitives
    expect(fieldMap.get('a32')?.switch().name).toBe('scvU32');
    expect(fieldMap.get('a64')?.switch().name).toBe('scvU64');
    expect(fieldMap.get('admin')?.switch().name).toBe('scvAddress');
    expect(fieldMap.get('b32')?.switch().name).toBe('scvU32');
    expect(fieldMap.get('c32')?.switch().name).toBe('scvU32');

    // Enums
    const baseAssetScVal = fieldMap.get('base_asset');
    expect(baseAssetScVal?.switch().name).toBe('scvVec');
    const baseAssetVec = baseAssetScVal!.vec();
    expect(baseAssetVec[0].switch().name).toBe('scvSymbol');
    expect(baseAssetVec[0].sym().toString()).toBe('Stellar');
    expect(baseAssetVec[1].switch().name).toBe('scvAddress');

    const complexEnum3ScVal = fieldMap.get('complex_enum3');
    expect(complexEnum3ScVal?.switch().name).toBe('scvVec');
    const complexEnum3Vec = complexEnum3ScVal!.vec();
    expect(complexEnum3Vec).toHaveLength(2); // Symbol + Tuple (wrapped)
    expect(complexEnum3Vec[0].switch().name).toBe('scvSymbol');
    expect(complexEnum3Vec[0].sym().toString()).toBe('Some');

    // The tuple payload is wrapped in another ScVec
    expect(complexEnum3Vec[1].switch().name).toBe('scvVec');
    const tupleVec = complexEnum3Vec[1].vec();
    expect(tupleVec).toHaveLength(2);
    expect(tupleVec[0].switch().name).toBe('scvAddress');
    expect(tupleVec[1].switch().name).toBe('scvI128');

    // Array of enums
    const assetsVecScVal = fieldMap.get('assets_vec');
    expect(assetsVecScVal?.switch().name).toBe('scvVec');
    const assetsVecArray = assetsVecScVal!.vec();
    expect(assetsVecArray).toHaveLength(2);

    // Each array element should be a properly formatted enum
    assetsVecArray.forEach((enumScVal, index) => {
      expect(enumScVal.switch().name).toBe('scvVec');
      const enumVec = enumScVal.vec();
      expect(enumVec[0].switch().name).toBe('scvSymbol');

      if (index === 0) {
        expect(enumVec[0].sym().toString()).toBe('Stellar');
        expect(enumVec[1].switch().name).toBe('scvAddress'); // Properly typed!
      } else {
        expect(enumVec[0].sym().toString()).toBe('Other');
        expect(enumVec[1].switch().name).toBe('scvSymbol'); // Properly typed!
      }
    });
  });

  it('should handle None variant of ComplexEnum3', () => {
    const submittedInputs = {
      complex_struct: {
        a32: 1,
        a64: 2,
        admin: mockContractAddress,
        assets_vec: [],
        b32: 3,
        base_asset: { tag: 'Other', values: ['test'] },
        c32: 4,
        complex_enum3: { tag: 'None' }, // Unit variant
      },
    };

    const fieldWithMetadata: FormFieldType = {
      id: 'test-field',
      name: 'complex_struct',
      label: 'Complex Struct',
      type: 'object',
      validation: {},
      components: [
        { name: 'a32', type: 'U32' },
        { name: 'a64', type: 'U64' },
        { name: 'admin', type: 'Address' },
        { name: 'assets_vec', type: 'Vec<ComplexEnum2>' },
        { name: 'b32', type: 'U32' },
        { name: 'base_asset', type: 'ComplexEnum2' },
        { name: 'c32', type: 'U32' },
        { name: 'complex_enum3', type: 'ComplexEnum3' },
      ],
    };

    const complexEnum3Field: FormFieldType = {
      id: 'complex-enum3',
      name: 'complex_struct.complex_enum3',
      label: 'Complex Enum 3',
      type: 'enum',
      validation: {},
      enumMetadata: {
        name: 'ComplexEnum3',
        isUnitOnly: false,
        variants: [
          {
            name: 'Some',
            type: 'tuple',
            payloadTypes: ['Address', 'I128'],
            isSingleTuplePayload: true,
          },
          { name: 'None', type: 'void' },
        ],
      },
    };

    const baseAssetField: FormFieldType = {
      id: 'base-asset',
      name: 'complex_struct.base_asset',
      label: 'Base Asset',
      type: 'enum',
      validation: {},
      enumMetadata: {
        name: 'ComplexEnum2',
        isUnitOnly: false,
        variants: [
          { name: 'Stellar', type: 'tuple', payloadTypes: ['Address'] },
          { name: 'Other', type: 'tuple', payloadTypes: ['ScSymbol'] },
        ],
      },
    };

    const transactionData = formatStellarTransactionData(
      complexStructContractSchema,
      'complex_struct_ComplexStruct',
      submittedInputs,
      [fieldWithMetadata, complexEnum3Field, baseAssetField]
    );

    const scVal = valueToScVal(
      transactionData.args[0],
      transactionData.argTypes[0],
      transactionData.argSchema![0]
    );

    const structMap = scVal.map();
    const complexEnum3Entry = structMap.find((e) => e.key().sym().toString() === 'complex_enum3');

    const complexEnum3ScVal = complexEnum3Entry!.val();
    expect(complexEnum3ScVal.switch().name).toBe('scvVec');

    const complexEnum3Vec = complexEnum3ScVal.vec();
    expect(complexEnum3Vec).toHaveLength(1); // Just the symbol for unit variant
    expect(complexEnum3Vec[0].switch().name).toBe('scvSymbol');
    expect(complexEnum3Vec[0].sym().toString()).toBe('None');
  });
});
