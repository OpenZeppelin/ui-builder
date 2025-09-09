import { describe, expect, it } from 'vitest';

import { isPlainObject, isRecordWithProperties } from '../typeguards';

describe('typeguards', () => {
  describe('isRecordWithProperties', () => {
    it('should return true for plain objects', () => {
      expect(isRecordWithProperties({})).toBe(true);
      expect(isRecordWithProperties({ key: 'value' })).toBe(true);
      expect(isRecordWithProperties({ nested: { key: 'value' } })).toBe(true);
    });

    it('should return true for arrays (since arrays are objects)', () => {
      expect(isRecordWithProperties([])).toBe(true);
      expect(isRecordWithProperties([1, 2, 3])).toBe(true);
      expect(isRecordWithProperties(['a', 'b', 'c'])).toBe(true);
    });

    it('should return false for null', () => {
      expect(isRecordWithProperties(null)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isRecordWithProperties(undefined)).toBe(false);
      expect(isRecordWithProperties('string')).toBe(false);
      expect(isRecordWithProperties(123)).toBe(false);
      expect(isRecordWithProperties(true)).toBe(false);
      expect(isRecordWithProperties(false)).toBe(false);
    });
  });

  describe('isPlainObject', () => {
    it('should return true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ key: 'value' })).toBe(true);
      expect(isPlainObject({ nested: { key: 'value' } })).toBe(true);
      expect(isPlainObject({ a: 1, b: 'string', c: true })).toBe(true);
    });

    it('should return false for arrays', () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject([1, 2, 3])).toBe(false);
      expect(isPlainObject(['a', 'b', 'c'])).toBe(false);
      expect(isPlainObject([{ key: 'value' }])).toBe(false);
    });

    it('should return false for null', () => {
      expect(isPlainObject(null)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isPlainObject(undefined)).toBe(false);
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(123)).toBe(false);
      expect(isPlainObject(true)).toBe(false);
      expect(isPlainObject(false)).toBe(false);
    });

    it('should work with complex objects', () => {
      const complexObject = {
        id: 123,
        name: 'test',
        active: true,
        metadata: {
          created: new Date(),
          tags: ['tag1', 'tag2'],
        },
      };
      expect(isPlainObject(complexObject)).toBe(true);
    });

    it('should return false for function objects', () => {
      const func = () => {};
      expect(isPlainObject(func)).toBe(false);
    });

    it('should return true for Date objects (they are plain objects)', () => {
      expect(isPlainObject(new Date())).toBe(true);
    });

    it('should return true for class instances (they are plain objects)', () => {
      class TestClass {
        prop = 'value';
      }
      expect(isPlainObject(new TestClass())).toBe(true);
    });
  });
});
