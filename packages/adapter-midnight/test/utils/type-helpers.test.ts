import { describe, expect, it } from 'vitest';

import { getBytesSize } from '@openzeppelin/ui-builder-utils';

import {
  isArrayType,
  isBytesType,
  isMapType,
  isMaybeType,
  isUintType,
  isVectorType,
} from '../../src/utils/type-helpers';

describe('Midnight utils: type-helpers', () => {
  describe('isArrayType', () => {
    it('detects Array<T> and extracts element type', () => {
      expect(isArrayType('Array<string>')).toEqual({ isArray: true, elementType: 'string' });
    });

    it('returns false for non-array', () => {
      expect(isArrayType('string').isArray).toBe(false);
    });

    it('handles whitespace and nested generics', () => {
      const r = isArrayType('Array<  Array<number>  >');
      expect(r.isArray).toBe(true);
      expect(r.elementType).toBe('Array<number>');
    });

    it('handles inline object literals', () => {
      const r = isArrayType('Array<{ a: string; b: bigint; }>');
      expect(r.isArray).toBe(true);
      expect(r.elementType).toBe('{ a: string; b: bigint; }');
    });
  });

  describe('isMaybeType', () => {
    it('detects Maybe<T> case-insensitively', () => {
      expect(isMaybeType('Maybe<number>')).toEqual({ isMaybe: true, innerType: 'number' });
      expect(isMaybeType('maybe<string>')).toEqual({ isMaybe: true, innerType: 'string' });
    });

    it('returns false for non-maybe', () => {
      expect(isMaybeType('string').isMaybe).toBe(false);
    });

    it('handles nested Maybe types', () => {
      const r = isMaybeType('Maybe<Maybe<string>>');
      expect(r.isMaybe).toBe(true);
      expect(r.innerType).toBe('Maybe<string>');
    });

    it('handles Maybe with complex inner types', () => {
      const r = isMaybeType('Maybe<Vector<5, Color>>');
      expect(r.isMaybe).toBe(true);
      expect(r.innerType).toBe('Vector<5, Color>');
    });
  });

  describe('isVectorType', () => {
    it('detects Vector<N, T> and extracts size and element type', () => {
      const r = isVectorType('Vector<3, Uint<64>>');
      expect(r.isVector).toBe(true);
      expect(r.size).toBe(3);
      expect(r.elementType).toBe('Uint<64>');
    });

    it('handles whitespace', () => {
      const r = isVectorType('Vector< 10 , Maybe<string> >');
      expect(r.isVector).toBe(true);
      expect(r.size).toBe(10);
      expect(r.elementType).toBe('Maybe<string>');
    });

    it('handles nested vectors', () => {
      const r = isVectorType('Vector<5, Color>');
      expect(r.isVector).toBe(true);
      expect(r.size).toBe(5);
      expect(r.elementType).toBe('Color');
    });

    it('returns false for non-vector', () => {
      expect(isVectorType('Array<number>').isVector).toBe(false);
      expect(isVectorType('string').isVector).toBe(false);
    });

    it('handles vectors with complex element types', () => {
      const r = isVectorType('Vector<10, Maybe<Opaque<"string">>>');
      expect(r.isVector).toBe(true);
      expect(r.size).toBe(10);
      expect(r.elementType).toBe('Maybe<Opaque<"string">>');
    });
  });

  describe('isUintType', () => {
    it('detects Uint<0..MAX> patterns', () => {
      expect(isUintType('Uint<0..18446744073709551615>')).toBe(true);
      expect(isUintType('Uint<0..255>')).toBe(true);
      expect(isUintType('Uint<0..4294967295>')).toBe(true);
    });

    it('handles whitespace', () => {
      expect(isUintType('Uint< 0 .. 255 >')).toBe(true);
    });

    it('is case insensitive', () => {
      expect(isUintType('uint<0..255>')).toBe(true);
      expect(isUintType('UINT<0..100>')).toBe(true);
    });

    it('returns false for non-uint patterns', () => {
      expect(isUintType('Uint64')).toBe(false);
      expect(isUintType('Uint')).toBe(false);
      expect(isUintType('number')).toBe(false);
      expect(isUintType('Uint<64>')).toBe(false); // Missing range format
    });
  });

  describe('isMapType', () => {
    it('detects Map<K,V> with spaces', () => {
      const r = isMapType('Map<  string , number >');
      expect(r.isMap).toBe(true);
      expect(r.keyType).toBe('string');
      expect(r.valueType).toBe('number');
    });

    it('supports nested generics in value', () => {
      const r = isMapType('Map<string, Array<number>>');
      expect(r.isMap).toBe(true);
      expect(r.valueType).toBe('Array<number>');
    });

    it('returns false for non-map', () => {
      expect(isMapType('Mapish<string,number>').isMap).toBe(false);
    });
  });

  describe('isBytesType', () => {
    it('detects bytes types', () => {
      expect(isBytesType('Uint8Array')).toBe(true);
      expect(isBytesType('bytes')).toBe(true);
      expect(isBytesType('BytesLike')).toBe(true);
      expect(isBytesType('Bytes<32>')).toBe(true);
      expect(isBytesType('Bytes<64>')).toBe(true);
    });

    it('returns false for other strings', () => {
      expect(isBytesType('string')).toBe(false);
    });
  });

  describe('getBytesSize', () => {
    it('extracts size from Bytes<N>', () => {
      expect(getBytesSize('Bytes<32>')).toBe(32);
      expect(getBytesSize('Bytes<64>')).toBe(64);
      expect(getBytesSize('Bytes<256>')).toBe(256);
    });

    it('returns undefined for dynamic Uint8Array', () => {
      expect(getBytesSize('Uint8Array')).toBeUndefined();
      expect(getBytesSize('bytes')).toBeUndefined();
      expect(getBytesSize('byteslike')).toBeUndefined();
    });
  });
});
