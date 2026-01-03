import { describe, expect, it } from 'vitest';

import type { FunctionParameter } from '@openzeppelin/ui-types';

import { valueToScVal } from '../../src/transform/parsers/scval-converter';

describe('ComplexStruct Integration Tests', () => {
  describe('Full ComplexStruct transaction', () => {
    it('should serialize complete ComplexStruct with all fields', () => {
      // Simulate the actual form data that would come from the UI
      const complexStructValue = {
        a32: 234234,
        a64: 23423423,
        admin: 'CAKQRPNF7NC34CIDCLXE47Q35DYJHBYHCJRVP5QHT6ESGFGAZB7TRFDP',
        assets_vec: [
          { tag: 'Stellar', values: ['CAKQRPNF7NC34CIDCLXE47Q35DYJHBYHCJRVP5QHT6ESGFGAZB7TRFDP'] },
          { tag: 'Other', values: ['fsdfdsf'] },
        ],
        b32: 34234,
        base_asset: {
          tag: 'Stellar',
          values: ['CAKQRPNF7NC34CIDCLXE47Q35DYJHBYHCJRVP5QHT6ESGFGAZB7TRFDP'],
        },
        c32: 123412312,
        complex_enum3: {
          tag: 'Some',
          values: ['CAKQRPNF7NC34CIDCLXE47Q35DYJHBYHCJRVP5QHT6ESGFGAZB7TRFDP', '123423432424'],
        },
      };

      // This parameter schema should have components with enum metadata
      const paramSchema: FunctionParameter = {
        name: 'complex_struct',
        type: 'ComplexStruct',
        components: [
          { name: 'a32', type: 'U32' },
          { name: 'a64', type: 'U64' },
          { name: 'admin', type: 'Address' },
          {
            name: 'assets_vec',
            type: 'Vec<ComplexEnum2>',
            // This should be set by field-generator for array elements
          },
          { name: 'b32', type: 'U32' },
          {
            name: 'base_asset',
            type: 'ComplexEnum2',
            enumMetadata: {
              name: 'ComplexEnum2',
              isUnitOnly: false,
              variants: [
                { name: 'Stellar', type: 'tuple', payloadTypes: ['Address'] },
                { name: 'Other', type: 'tuple', payloadTypes: ['ScSymbol'] },
              ],
            },
          },
          { name: 'c32', type: 'U32' },
          {
            name: 'complex_enum3',
            type: 'ComplexEnum3',
            enumMetadata: {
              name: 'ComplexEnum3',
              isUnitOnly: false,
              variants: [
                { name: 'Some', type: 'tuple', payloadTypes: ['Address', 'I128'] },
                { name: 'None', type: 'void' },
              ],
            },
          },
        ],
      };

      const result = valueToScVal(complexStructValue, 'ComplexStruct', paramSchema);

      // Should be a Map (struct)
      expect(result.switch().name).toBe('scvMap');

      const mapEntries = result.map();
      expect(mapEntries.length).toBe(8); // 8 fields

      // Find complex_enum3 entry
      const complexEnum3Entry = mapEntries.find(
        (e) => e.key().sym().toString() === 'complex_enum3'
      );
      expect(complexEnum3Entry).toBeDefined();

      // Verify complex_enum3 value is a properly formatted enum (ScVec)
      const enum3Value = complexEnum3Entry!.val();
      expect(enum3Value.switch().name).toBe('scvVec');

      const enum3Vec = enum3Value.vec();
      expect(enum3Vec).toHaveLength(3); // Symbol + 2 payload values
      expect(enum3Vec[0].switch().name).toBe('scvSymbol');
      expect(enum3Vec[0].sym().toString()).toBe('Some');
      expect(enum3Vec[1].switch().name).toBe('scvAddress');
      expect(enum3Vec[2].switch().name).toBe('scvI128');
    });
  });

  describe('ComplexEnum3 with tuple payload', () => {
    it('should serialize Some variant with tuple payload as vector (correct format)', () => {
      // ComplexEnum3::Some((Address, i128))
      // This is the CORRECT format - values as flat array
      const value = {
        tag: 'Some',
        values: ['CAKQRPNF7NC34CIDCLXE47Q35DYJHBYHCJRVP5QHT6ESGFGAZB7TRFDP', '234234'],
      };

      const paramSchema: FunctionParameter = {
        name: 'complex_enum3',
        type: 'ComplexEnum3',
        enumMetadata: {
          name: 'ComplexEnum3',
          isUnitOnly: false,
          variants: [
            {
              name: 'Some',
              type: 'tuple',
              payloadTypes: ['Address', 'I128'], // Flattened for UI
              isSingleTuplePayload: true, // But marked for tuple wrapping
            },
            {
              name: 'None',
              type: 'void',
            },
          ],
        },
      };

      const result = valueToScVal(value, 'ComplexEnum3', paramSchema);

      // Soroban enum format: ScVec([Symbol("VariantName"), ScVec([...tupleValues])])
      expect(result.switch().name).toBe('scvVec');

      const vecItems = result.vec();
      expect(vecItems).toHaveLength(2); // Symbol + tuple payload

      // First item is the variant name as Symbol
      expect(vecItems[0].switch().name).toBe('scvSymbol');
      expect(vecItems[0].sym().toString()).toBe('Some');

      // Second item is the tuple (wrapped in ScVec)
      expect(vecItems[1].switch().name).toBe('scvVec');
      const tupleVec = vecItems[1].vec();
      expect(tupleVec).toHaveLength(2);
      expect(tupleVec[0].switch().name).toBe('scvAddress');
      expect(tupleVec[1].switch().name).toBe('scvI128');
    });

    it('should serialize None variant correctly', () => {
      const value = {
        tag: 'None',
      };

      const paramSchema: FunctionParameter = {
        name: 'complex_enum3',
        type: 'ComplexEnum3',
      };

      const result = valueToScVal(value, 'ComplexEnum3', paramSchema);

      // Unit variant format: ScVec([Symbol("VariantName")])
      expect(result.switch().name).toBe('scvVec');

      const vecItems = result.vec();
      expect(vecItems).toHaveLength(1); // Just the symbol

      expect(vecItems[0].switch().name).toBe('scvSymbol');
      expect(vecItems[0].sym().toString()).toBe('None');
    });
  });

  describe('ComplexEnum2 (for assets_vec)', () => {
    it('should serialize Stellar variant with Address payload', () => {
      const value = {
        tag: 'Stellar',
        values: ['CAKQRPNF7NC34CIDCLXE47Q35DYJHBYHCJRVP5QHT6ESGFGAZB7TRFDP'],
      };

      const paramSchema: FunctionParameter = {
        name: 'base_asset',
        type: 'ComplexEnum2',
        enumMetadata: {
          name: 'ComplexEnum2',
          isUnitOnly: false,
          variants: [
            {
              name: 'Stellar',
              type: 'tuple',
              payloadTypes: ['Address'],
            },
            {
              name: 'Other',
              type: 'tuple',
              payloadTypes: ['ScSymbol'],
            },
          ],
        },
      };

      const result = valueToScVal(value, 'ComplexEnum2', paramSchema);

      // Format: ScVec([Symbol("Stellar"), Address])
      expect(result.switch().name).toBe('scvVec');

      const vecItems = result.vec();
      expect(vecItems).toHaveLength(2); // Symbol + Address

      expect(vecItems[0].switch().name).toBe('scvSymbol');
      expect(vecItems[0].sym().toString()).toBe('Stellar');

      expect(vecItems[1].switch().name).toBe('scvAddress');
    });
  });

  describe('Vec<ComplexEnum2> (assets_vec)', () => {
    it('should serialize array of enums correctly', () => {
      const value = [
        {
          tag: 'Stellar',
          values: ['CAKQRPNF7NC34CIDCLXE47Q35DYJHBYHCJRVP5QHT6ESGFGAZB7TRFDP'],
        },
        {
          tag: 'Other',
          values: ['test_symbol'],
        },
      ];

      const paramSchema: FunctionParameter = {
        name: 'assets_vec',
        type: 'Vec<ComplexEnum2>',
      };

      const result = valueToScVal(value, 'Vec<ComplexEnum2>', paramSchema);

      expect(result.switch().name).toBe('scvVec');

      const arrayItems = result.vec();
      expect(arrayItems).toHaveLength(2);

      // Each item should be a properly formatted enum
      arrayItems.forEach((item) => {
        expect(item.switch().name).toBe('scvVec');
      });
    });
  });
});
