import { xdr } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';

import { extractEnumVariants } from '../../src/mapping/enum-metadata';

describe('extractEnumVariants', () => {
  it('should extract unit enum variants (void cases)', () => {
    // Create a mock spec with a simple enum like DemoEnum { One, Two, Three }
    const mockEntries: xdr.ScSpecEntry[] = [
      // Mock UDT Union entry for DemoEnum with void cases
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
                doc: () => ({ toString: () => 'First variant' }),
              }),
            },
            {
              switch: () => xdr.ScSpecUdtUnionCaseV0Kind.scSpecUdtUnionCaseVoidV0(),
              voidCase: () => ({
                name: () => ({ toString: () => 'Two' }),
                doc: () => ({ toString: () => 'Second variant' }),
              }),
            },
            {
              switch: () => xdr.ScSpecUdtUnionCaseV0Kind.scSpecUdtUnionCaseVoidV0(),
              voidCase: () => ({
                name: () => ({ toString: () => 'Three' }),
                doc: () => ({ toString: () => 'Third variant' }),
              }),
            },
          ],
        }),
      } as unknown as xdr.ScSpecEntry,
    ];

    const result = extractEnumVariants(mockEntries, 'DemoEnum');

    expect(result).toEqual({
      name: 'DemoEnum',
      variants: [
        { name: 'One', type: 'void' },
        { name: 'Two', type: 'void' },
        { name: 'Three', type: 'void' },
      ],
      isUnitOnly: true,
    });
  });

  it('should extract tuple enum variants with payload types', () => {
    // Create a mock spec with enum like DemoEnum { One, Two(u32), Three(String) }
    const mockEntries: xdr.ScSpecEntry[] = [
      {
        switch: () => xdr.ScSpecEntryKind.scSpecEntryUdtUnionV0(),
        value: () => ({
          name: () => ({ toString: () => 'DemoEnum' }),
        }),
        udtUnionV0: () => ({
          name: () => ({ toString: () => 'DemoEnum' }),
          doc: () => ({ toString: () => 'Demo enum with payloads' }),
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
            {
              switch: () => xdr.ScSpecUdtUnionCaseV0Kind.scSpecUdtUnionCaseTupleV0(),
              tupleCase: () => ({
                name: () => ({ toString: () => 'Three' }),
                doc: () => ({ toString: () => 'Variant with string' }),
                type: () => [
                  {
                    switch: () => xdr.ScSpecType.scSpecTypeString(),
                  },
                ],
              }),
            },
          ],
        }),
      } as unknown as xdr.ScSpecEntry,
    ];

    const result = extractEnumVariants(mockEntries, 'DemoEnum');

    expect(result).toEqual({
      name: 'DemoEnum',
      variants: [
        { name: 'One', type: 'void' },
        { name: 'Two', type: 'tuple', payloadTypes: ['U32'] },
        { name: 'Three', type: 'tuple', payloadTypes: ['ScString'] },
      ],
      isUnitOnly: false,
    });
  });

  it('should extract integer enum variants', () => {
    // Create a mock spec with integer enum like Priority { Low = 0, Medium = 1, High = 2 }
    const mockEntries: xdr.ScSpecEntry[] = [
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

    const result = extractEnumVariants(mockEntries, 'Priority');

    expect(result).toEqual({
      name: 'Priority',
      variants: [
        { name: 'Low', type: 'integer', value: 0 },
        { name: 'Medium', type: 'integer', value: 1 },
        { name: 'High', type: 'integer', value: 2 },
      ],
      isUnitOnly: true, // Integer enums are considered unit-only for UI purposes
    });
  });

  it('should return null for non-existent enum', () => {
    const mockEntries: xdr.ScSpecEntry[] = [];
    const result = extractEnumVariants(mockEntries, 'NonExistentEnum');
    expect(result).toBeNull();
  });

  it('should return null for non-enum UDT types', () => {
    // Mock a struct entry instead of enum/union
    const mockEntries: xdr.ScSpecEntry[] = [
      {
        switch: () => xdr.ScSpecEntryKind.scSpecEntryUdtStructV0(),
        value: () => ({
          name: () => ({ toString: () => 'SomeStruct' }),
        }),
        udtStructV0: () => ({
          name: () => ({ toString: () => 'SomeStruct' }),
        }),
      } as unknown as xdr.ScSpecEntry,
    ];

    const result = extractEnumVariants(mockEntries, 'SomeStruct');
    expect(result).toBeNull();
  });

  it('should handle complex tuple payloads', () => {
    // Test enum with multiple payload types in one variant
    const mockEntries: xdr.ScSpecEntry[] = [
      {
        switch: () => xdr.ScSpecEntryKind.scSpecEntryUdtUnionV0(),
        value: () => ({
          name: () => ({ toString: () => 'ComplexEnum' }),
        }),
        udtUnionV0: () => ({
          name: () => ({ toString: () => 'ComplexEnum' }),
          doc: () => ({ toString: () => 'Complex enum' }),
          cases: () => [
            {
              switch: () => xdr.ScSpecUdtUnionCaseV0Kind.scSpecUdtUnionCaseTupleV0(),
              tupleCase: () => ({
                name: () => ({ toString: () => 'MultiPayload' }),
                doc: () => ({ toString: () => 'Multiple payload types' }),
                type: () => [
                  { switch: () => xdr.ScSpecType.scSpecTypeAddress() },
                  { switch: () => xdr.ScSpecType.scSpecTypeU128() },
                  { switch: () => xdr.ScSpecType.scSpecTypeString() },
                ],
              }),
            },
          ],
        }),
      } as unknown as xdr.ScSpecEntry,
    ];

    const result = extractEnumVariants(mockEntries, 'ComplexEnum');

    expect(result).toEqual({
      name: 'ComplexEnum',
      variants: [
        {
          name: 'MultiPayload',
          type: 'tuple',
          payloadTypes: ['Address', 'U128', 'ScString'],
        },
      ],
      isUnitOnly: false,
    });
  });

  it('should include payload components for struct and tuple payloads', () => {
    const mockEntries: xdr.ScSpecEntry[] = [
      {
        switch: () => xdr.ScSpecEntryKind.scSpecEntryUdtStructV0(),
        value: () => ({
          name: () => ({ toString: () => 'InnerStruct' }),
        }),
        udtStructV0: () => ({
          fields: () => [
            {
              name: () => ({ toString: () => 'count' }),
              type: () => ({
                switch: () => xdr.ScSpecType.scSpecTypeU32(),
              }),
            },
          ],
        }),
      } as unknown as xdr.ScSpecEntry,
      {
        switch: () => xdr.ScSpecEntryKind.scSpecEntryUdtUnionV0(),
        value: () => ({
          name: () => ({ toString: () => 'PayloadEnum' }),
        }),
        udtUnionV0: () => ({
          name: () => ({ toString: () => 'PayloadEnum' }),
          doc: () => ({ toString: () => 'Enum with structured payloads' }),
          cases: () => [
            {
              switch: () => xdr.ScSpecUdtUnionCaseV0Kind.scSpecUdtUnionCaseTupleV0(),
              tupleCase: () => ({
                name: () => ({ toString: () => 'StructVariant' }),
                doc: () => ({ toString: () => 'Struct payload' }),
                type: () => [
                  {
                    switch: () => xdr.ScSpecType.scSpecTypeUdt(),
                    udt: () => ({
                      name: () => ({ toString: () => 'InnerStruct' }),
                    }),
                  },
                  {
                    switch: () => xdr.ScSpecType.scSpecTypeTuple(),
                    tuple: () => ({
                      valueTypes: () => [
                        { switch: () => xdr.ScSpecType.scSpecTypeU32() },
                        { switch: () => xdr.ScSpecType.scSpecTypeBool() },
                      ],
                    }),
                  },
                ],
              }),
            },
          ],
        }),
      } as unknown as xdr.ScSpecEntry,
    ];

    const result = extractEnumVariants(mockEntries, 'PayloadEnum');

    // Tuple payloads ARE flattened for UI, but marked with isSingleTuplePayload
    expect(result?.variants[0].payloadTypes).toEqual(['InnerStruct', 'U32', 'Bool']);
    expect(result?.variants[0].isSingleTuplePayload).toBeUndefined(); // Not a single tuple (has 2 payloads)
    expect(result?.variants[0].payloadComponents?.[0]).toEqual([{ name: 'count', type: 'U32' }]);
    expect(result?.variants[0].payloadComponents?.[1]).toBeUndefined(); // Primitive
    expect(result?.variants[0].payloadComponents?.[2]).toBeUndefined(); // Primitive
  });
});
