import { describe, expect, it } from 'vitest';

import {
  getMidnightCompatibleFieldTypes,
  mapMidnightParameterTypeToFieldType,
} from '../../src/mapping/type-mapper';

describe('Midnight Type Mapper', () => {
  describe('mapMidnightParameterTypeToFieldType', () => {
    it('maps primitives', () => {
      expect(mapMidnightParameterTypeToFieldType('bigint')).toBe('bigint');
      expect(mapMidnightParameterTypeToFieldType('number')).toBe('number');
      expect(mapMidnightParameterTypeToFieldType('boolean')).toBe('checkbox');
      expect(mapMidnightParameterTypeToFieldType('string')).toBe('text');
    });

    it('maps bytes', () => {
      expect(mapMidnightParameterTypeToFieldType('Uint8Array')).toBe('bytes');
      expect(mapMidnightParameterTypeToFieldType('Bytes<32>')).toBe('bytes');
    });

    it('maps arrays', () => {
      expect(mapMidnightParameterTypeToFieldType('Array<string>')).toBe('array');
      expect(mapMidnightParameterTypeToFieldType('Array<bigint>')).toBe('array');
    });

    it('maps Vector<N,T> to array', () => {
      expect(mapMidnightParameterTypeToFieldType('Vector<3, Uint<64>>')).toBe('array');
      expect(mapMidnightParameterTypeToFieldType('Vector<10, Maybe<string>>')).toBe('array');
    });

    it('maps Uint<...> to number', () => {
      expect(mapMidnightParameterTypeToFieldType('Uint<0..255>')).toBe('number');
      expect(mapMidnightParameterTypeToFieldType('Uint<0..18446744073709551615>')).toBe('number');
    });

    it('maps Opaque<T> to text', () => {
      expect(mapMidnightParameterTypeToFieldType('Opaque<"string">')).toBe('text');
      expect(mapMidnightParameterTypeToFieldType('Opaque<number>')).toBe('text');
    });

    it('maps Map<K,V> to map', () => {
      expect(mapMidnightParameterTypeToFieldType('Map<string, number>')).toBe('map');
    });

    it('maps maybe<T> to inner type default', () => {
      expect(mapMidnightParameterTypeToFieldType('Maybe<number>')).toBe('number');
      expect(mapMidnightParameterTypeToFieldType('Maybe<string>')).toBe('text');
      expect(mapMidnightParameterTypeToFieldType('Maybe<Uint8Array>')).toBe('bytes');
    });

    it('maps nested Maybe<Maybe<T>> to inner type', () => {
      expect(mapMidnightParameterTypeToFieldType('Maybe<Maybe<string>>')).toBe('text');
      expect(mapMidnightParameterTypeToFieldType('Maybe<Maybe<number>>')).toBe('number');
    });

    it('maps custom types (enums) to text by default', () => {
      expect(mapMidnightParameterTypeToFieldType('Color')).toBe('text');
      expect(mapMidnightParameterTypeToFieldType('Status')).toBe('text');
    });
  });

  describe('getMidnightCompatibleFieldTypes', () => {
    it('returns compatible types for bigint', () => {
      const types = getMidnightCompatibleFieldTypes('bigint');
      expect(types[0]).toBe('bigint');
      expect(types).toContain('number');
      expect(types).toContain('amount');
      expect(types).toContain('text');
    });

    it('returns array compat including array-object', () => {
      const types = getMidnightCompatibleFieldTypes('Array<{ a: string; b: bigint; }>');
      expect(types).toContain('array');
      expect(types).toContain('array-object');
    });

    it('returns compatible types for Maybe<T> based on inner type', () => {
      const types = getMidnightCompatibleFieldTypes('Maybe<bigint>');
      expect(types[0]).toBe('bigint');
      expect(types).toContain('number');
    });

    it('returns compatible types for Map<K,V>', () => {
      const types = getMidnightCompatibleFieldTypes('Map<string, number>');
      expect(types[0]).toBe('map');
      expect(types).toContain('textarea');
      expect(types).toContain('text');
    });

    it('returns compatible types for bytes', () => {
      const types = getMidnightCompatibleFieldTypes('Uint8Array');
      expect(types[0]).toBe('bytes');
      expect(types).toContain('textarea');
      expect(types).toContain('text');
    });

    it('returns compatible types for Opaque<T>', () => {
      const types = getMidnightCompatibleFieldTypes('Opaque<"string">');
      expect(types[0]).toBe('text');
      expect(types).toContain('textarea');
    });

    it('returns compatible types for custom types (enums)', () => {
      const types = getMidnightCompatibleFieldTypes('Color');
      expect(types[0]).toBe('enum');
      expect(types).toContain('object');
      expect(types).toContain('text');
    });
  });
});
