import { describe, expect, it, vi } from 'vitest';

import { ContractAdapter, FieldTransforms } from '../../types/FormTypes';
import {
  composeTransforms,
  createAddressTransform,
  createBooleanTransform,
  createComplexTypeTransform,
  createCustomTransform,
  createNumberTransform,
  createTextTransform,
  // Will be tested in a future test
  // createTransformForFieldType,
} from '../formUtils';

// Mock adapter
const mockAdapter: Partial<ContractAdapter> = {
  isValidAddress: vi.fn((address: string) => address.startsWith('0x') && address.length === 42),
};

describe('Transform Utilities', () => {
  describe('createAddressTransform', () => {
    it('should handle empty values', () => {
      const transform = createAddressTransform(mockAdapter as ContractAdapter);

      if (transform.input) {
        expect(transform.input('')).toBe('');
        // Using as with double casting to appease TypeScript
        expect(transform.input(null as unknown as string)).toBe('');
        expect(transform.input(undefined as unknown as string)).toBe('');
      }
    });

    it('should validate addresses on output', () => {
      const transform = createAddressTransform(mockAdapter as ContractAdapter);

      if (transform.output) {
        expect(transform.output('0x1234567890123456789012345678901234567890')).toBe(
          '0x1234567890123456789012345678901234567890'
        );
        expect(transform.output('invalid-address')).toBe('');
      }
    });
  });

  describe('createNumberTransform', () => {
    it('should convert numbers to strings on input', () => {
      const transform = createNumberTransform();

      if (transform.input) {
        // Double casting to handle type checking
        expect(transform.input(123 as unknown as number)).toBe('123');
        expect(transform.input(0 as unknown as number)).toBe('0');
        expect(transform.input(-45.67 as unknown as number)).toBe('-45.67');
      }
    });

    it('should handle empty values on input', () => {
      const transform = createNumberTransform();

      if (transform.input) {
        expect(transform.input(undefined as unknown as number)).toBe('');
      }
    });

    it('should convert strings to numbers on output', () => {
      const transform = createNumberTransform();

      if (transform.output) {
        expect(transform.output('123')).toBe(123);
        expect(transform.output('-45.67')).toBe(-45.67);
      }
    });

    it('should handle invalid number strings on output', () => {
      const transform = createNumberTransform();

      if (transform.output) {
        expect(transform.output('not-a-number')).toBe(0);
        expect(transform.output('')).toBe(0);
      }
    });
  });

  describe('createBooleanTransform', () => {
    it('should convert values to booleans', () => {
      const transform = createBooleanTransform();

      if (transform.input) {
        // Double casting for type checking
        expect(transform.input(true as unknown as boolean)).toBe(true);
        expect(transform.input(false as unknown as boolean)).toBe(false);
        expect(transform.input(1 as unknown as boolean)).toBe(true);
        expect(transform.input(0 as unknown as boolean)).toBe(false);
        expect(transform.input('true' as unknown as boolean)).toBe(true);
        expect(transform.input('' as unknown as boolean)).toBe(false);
      }
    });

    it('should convert any values to booleans on output', () => {
      const transform = createBooleanTransform();

      if (transform.output) {
        expect(transform.output('true')).toBe(true);
        expect(transform.output('')).toBe(false);
        expect(transform.output(1)).toBe(true);
        expect(transform.output(0)).toBe(false);
      }
    });
  });

  describe('createComplexTypeTransform', () => {
    it('should stringify objects on input', () => {
      const transform = createComplexTypeTransform();

      if (transform.input) {
        // For complex type, unknown is fine since it accepts unknown
        expect(transform.input({ foo: 'bar' })).toBe('{\n  "foo": "bar"\n}');
        expect(transform.input([1, 2, 3])).toBe('[\n  1,\n  2,\n  3\n]');
      }
    });

    it('should handle strings on input', () => {
      const transform = createComplexTypeTransform();

      if (transform.input) {
        expect(transform.input('already a string')).toBe('already a string');
      }
    });

    it('should handle JSON stringify errors', () => {
      const transform = createComplexTypeTransform();

      if (transform.input) {
        // Create a circular reference
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        expect(transform.input(circular)).toBe('');
      }
    });

    it('should parse JSON strings on output', () => {
      const transform = createComplexTypeTransform();

      if (transform.output) {
        expect(transform.output('{"foo":"bar"}')).toEqual({ foo: 'bar' });
        expect(transform.output('[1,2,3]')).toEqual([1, 2, 3]);
      }
    });

    it('should handle JSON parse errors', () => {
      const transform = createComplexTypeTransform();

      if (transform.output) {
        expect(transform.output('invalid json')).toBe(null);
      }
    });
  });

  describe('createTextTransform', () => {
    it('should handle text values', () => {
      const transform = createTextTransform();

      if (transform.input && transform.output) {
        expect(transform.input('Hello world' as unknown as string)).toBe('Hello world');
        expect(transform.output('Hello world')).toBe('Hello world');
      }
    });

    it('should handle empty values', () => {
      const transform = createTextTransform();

      if (transform.input) {
        expect(transform.input('' as unknown as string)).toBe('');
        expect(transform.input(null as unknown as string)).toBe('');
        expect(transform.input(undefined as unknown as string)).toBe('');
      }
    });
  });

  describe('composeTransforms', () => {
    it('should compose multiple transforms in the correct order', () => {
      // Create transforms for the composition
      const numberToString = createCustomTransform<number>(
        (num: number) => String(num),
        (str: unknown) => parseInt(str as string, 10)
      );

      const addPrefix = createCustomTransform<string>(
        (str: string) => str,
        (str: unknown) => `prefix_${str}`
      );

      // Need to cast these to the common type expected by composeTransforms
      const typedNumberToString = numberToString as FieldTransforms<unknown>;
      const typedAddPrefix = addPrefix as FieldTransforms<unknown>;

      const composed = composeTransforms(typedNumberToString, typedAddPrefix);

      // Input chain: 123 -> "123"
      if (composed.input) {
        expect(composed.input(123)).toBe('123');
      }

      // Output chain: "hello" -> "prefix_hello" -> 0 (NaN becomes 0)
      if (composed.output) {
        expect(composed.output('hello')).toBe(0);

        // Output chain: "42" -> "prefix_42" -> NaN -> 0
        expect(composed.output('42')).toBe(0);
      }
    });

    it('should compose three or more transforms', () => {
      // Create three transforms to chain together
      const numberToString = createCustomTransform<number>(
        (num: number) => String(num),
        (str: unknown) => parseInt(str as string, 10)
      );

      const addPrefix = createCustomTransform<string>(
        (str: string) => str,
        (str: unknown) => `prefix_${str}`
      );

      const toUpperCase = createCustomTransform<string>(
        (str: string) => str?.toUpperCase(),
        (str: unknown) => String(str).toLowerCase()
      );

      // Type casting for composeTransforms
      const typedNumberToString = numberToString as FieldTransforms<unknown>;
      const typedAddPrefix = addPrefix as FieldTransforms<unknown>;
      const typedToUpperCase = toUpperCase as FieldTransforms<unknown>;

      // Compose all three transforms
      const composed = composeTransforms(typedNumberToString, typedAddPrefix, typedToUpperCase);

      // Input chain: 123 -> "123" -> "123" -> "123"
      if (composed.input) {
        expect(composed.input(123)).toBe('123');
      }

      // Output chain (in reverse order):
      // "HELLO" -> "hello" -> "prefix_hello" -> NaN -> 0
      if (composed.output) {
        expect(composed.output('HELLO')).toBe(0);

        // "42" -> "42" -> "prefix_42" -> NaN -> 0
        expect(composed.output('42')).toBe(0);
      }
    });

    it('should handle empty transforms', () => {
      const transform1 = createCustomTransform<string>(
        (str: string) => str?.toUpperCase(),
        (str: unknown) => String(str)
      );

      const transform2 = {} as FieldTransforms<unknown>; // Empty transform

      // Type casting for composeTransforms
      const typedTransform1 = transform1 as FieldTransforms<unknown>;

      const composed = composeTransforms(typedTransform1, transform2);

      if (composed.input) {
        expect(composed.input('hello')).toBe('HELLO');
      }

      if (composed.output) {
        expect(composed.output('world')).toBe('world');
      }
    });
  });

  describe('createCustomTransform', () => {
    it('should create a transform with custom functions', () => {
      const transform = createCustomTransform<string>(
        (str: string) => str?.toUpperCase(),
        (value: unknown) => String(value)
      );

      if (transform.input && transform.output) {
        expect(transform.input('hello')).toBe('HELLO');
        expect(transform.output(42)).toBe('42');
      }
    });

    it('should handle missing functions', () => {
      const transform = createCustomTransform<string>();

      expect(transform.input).toBeUndefined();
      expect(transform.output).toBeUndefined();
    });
  });
});
