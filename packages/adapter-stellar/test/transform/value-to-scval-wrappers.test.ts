import { xdr } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';

import type { FunctionParameter } from '@openzeppelin/ui-builder-types';

import { valueToScVal } from '../../src/transform/input-parser';

describe('valueToScVal - typed wrappers and tuple-struct arrays', () => {
  it('unwraps SorobanArgumentValue wrappers in enum payloads (Address, I128)', () => {
    const enumSchema: FunctionParameter = {
      name: 'choice',
      type: 'DemoEnumAsset',
      enumMetadata: {
        name: 'DemoEnumAsset',
        variants: [
          {
            name: 'Asset',
            type: 'tuple',
            payloadTypes: ['Address', 'I128'],
          },
        ],
        isUnitOnly: false,
      },
    } as unknown as FunctionParameter;

    const enumValue = {
      tag: 'Asset',
      values: [
        { type: 'Address', value: 'GCUFKDEXIV7ZUFAATFXYFE2WRKYQUZVO66PRMALVLGC7Z34667A7UJ7A' },
        { type: 'I128', value: '23423' },
      ],
    };

    const scVal = valueToScVal(enumValue, 'DemoEnumAsset', enumSchema);

    expect(scVal).toBeDefined();
    expect(scVal.switch()).toEqual(xdr.ScValType.scvVec());
    // vec layout: [tagSymbol, Address, I128]
    const vec = scVal.vec()!;
    expect(vec.length).toBe(3);
    expect(vec[0].sym()).toBeDefined();
  });

  it('converts array-shaped TupleStruct when schema components are present', () => {
    const tupleStructSchema: FunctionParameter = {
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
        { name: '1', type: 'SimpleEnum' },
      ],
    };

    const value = [
      { a: 1, b: true, c: 'sym' }, // Test struct
      'Second', // SimpleEnum as string tag; converter will wrap as {tag:'Second'}
    ];

    const scVal = valueToScVal(value, 'TupleStruct', tupleStructSchema);
    expect(scVal).toBeDefined();
    expect(scVal.switch()).toEqual(xdr.ScValType.scvVec());
    const vec = scVal.vec()!;
    expect(vec.length).toBe(2);
  });
});
