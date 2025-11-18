import { xdr } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';

import type { FunctionParameter } from '@openzeppelin/ui-builder-types';

import { valueToScVal } from '../../src/transform/input-parser';

describe('Enum serialization - integer-only and collections', () => {
  const royalCardMetadata = {
    name: 'RoyalCard',
    variants: [
      { name: 'Jack', type: 'integer', value: 11 },
      { name: 'Queen', type: 'integer', value: 12 },
      { name: 'King', type: 'integer', value: 13 },
    ],
    isUnitOnly: true,
  };

  it('integer-only enum (RoyalCard) serializes to u32 for string selection', () => {
    const schema: FunctionParameter = {
      name: 'card',
      type: 'RoyalCard',
      enumMetadata: royalCardMetadata,
    } as unknown as FunctionParameter;

    const scVal = valueToScVal('Queen', 'RoyalCard', schema);
    expect(scVal.switch()).toEqual(xdr.ScValType.scvU32());
    expect(scVal.u32()).toBe(12);
  });

  it('Vec<RoyalCard> serializes each element to u32', () => {
    const schema: FunctionParameter = {
      name: 'cards',
      type: 'Vec<RoyalCard>',
      enumMetadata: royalCardMetadata,
    } as unknown as FunctionParameter;

    const scVal = valueToScVal(['Jack', 'King'], 'Vec<RoyalCard>', schema);
    expect(scVal.switch()).toEqual(xdr.ScValType.scvVec());
    const vec = scVal.vec()!;
    expect(vec.length).toBe(2);
    expect(vec[0].switch()).toEqual(xdr.ScValType.scvU32());
    expect(vec[0].u32()).toBe(11);
    expect(vec[1].u32()).toBe(13);
  });

  it('Option<RoyalCard> with Some("Queen") serializes inner to u32', () => {
    const schema: FunctionParameter = {
      name: 'maybe_card',
      type: 'Option<RoyalCard>',
      enumMetadata: royalCardMetadata,
    } as unknown as FunctionParameter;

    const scVal = valueToScVal('Queen', 'Option<RoyalCard>', schema);
    // Current implementation returns the inner value ScVal for Some
    expect(scVal.switch()).toEqual(xdr.ScValType.scvU32());
    expect(scVal.u32()).toBe(12);
  });

  it('Vec<TaggedEnum> element encodes as [Symbol, payload...]', () => {
    const taggedEnumMetadata = {
      name: 'PayloadEnum',
      variants: [{ name: 'Two', type: 'tuple', payloadTypes: ['U32'] }],
      isUnitOnly: false,
    };

    const schema: FunctionParameter = {
      name: 'choices',
      type: 'Vec<PayloadEnum>',
      enumMetadata: taggedEnumMetadata,
    } as unknown as FunctionParameter;

    const scVal = valueToScVal([{ tag: 'Two', values: ['123'] }], 'Vec<PayloadEnum>', schema);
    expect(scVal.switch()).toEqual(xdr.ScValType.scvVec());
    const vec = scVal.vec()!;
    expect(vec.length).toBe(1);
    const first = vec[0];
    expect(first.switch()).toEqual(xdr.ScValType.scvVec());
    const inner = first.vec()!;
    expect(inner.length).toBe(2); // [Symbol('Two'), U32(123)]
    expect(inner[0].switch()).toEqual(xdr.ScValType.scvSymbol());
    expect(inner[1].switch()).toEqual(xdr.ScValType.scvU32());
    expect(inner[1].u32()).toBe(123);
  });
});
