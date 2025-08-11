import { describe, expect, it, vi } from 'vitest';

import type { ContractAdapter } from '@openzeppelin/contracts-ui-builder-types';
import { FieldType, FormFieldType } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import {
  createAddressTransform,
  createArrayObjectTransform,
  createArrayTransform,
  createBooleanTransform,
  createComplexTypeTransform,
  createDefaultFormValues,
  createNumberTransform,
  createObjectTransform,
  createTextTransform,
  createTransformForFieldType,
  getDefaultValueByFieldType,
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
});

describe('createArrayTransform', () => {
  it('input should stringify an array correctly', () => {
    const transform = createArrayTransform();
    if (transform.input) {
      expect(transform.input([1, 'hello', true])).toBe('[\n  1,\n  "hello",\n  true\n]');
      expect(transform.input([])).toBe('[]');
    }
  });

  it('input should handle stringify errors gracefully for arrays with circular references', () => {
    const transform = createArrayTransform();
    if (transform.input) {
      const circular: unknown[] = [];
      circular.push(circular as unknown);
      // JSON.stringify throws on circular references; the transform should catch and return '[]'
      expect(transform.input(circular)).toBe('[]');
    }
  });

  it('input should return "[]" and warn for non-array values (defensive check)', () => {
    const transform = createArrayTransform();
    const warnSpy = vi.spyOn(logger, 'warn');
    if (transform.input) {
      // @ts-expect-error Testing runtime robustness with incorrect type
      expect(transform.input(null)).toBe('[]');
      expect(warnSpy).toHaveBeenCalledWith(
        'formUtils',
        'createArrayTransform input received non-array value:',
        null
      );

      // @ts-expect-error Testing runtime robustness with incorrect type
      expect(transform.input(undefined)).toBe('[]');
      expect(warnSpy).toHaveBeenCalledWith(
        'formUtils',
        'createArrayTransform input received non-array value:',
        undefined
      );

      // @ts-expect-error Testing runtime robustness with incorrect type
      expect(transform.input('not-an-array')).toBe('[]');
      expect(warnSpy).toHaveBeenCalledWith(
        'formUtils',
        'createArrayTransform input received non-array value:',
        'not-an-array'
      );
    }
    warnSpy.mockRestore();
  });

  it('output should parse a valid JSON array string', () => {
    const transform = createArrayTransform();
    if (transform.output) {
      expect(transform.output('[1, "hello", false]')).toEqual([1, 'hello', false]);
      expect(transform.output('[]')).toEqual([]);
    }
  });

  it('output should return an empty array for invalid JSON string or non-string/non-array input', () => {
    const transform = createArrayTransform();
    if (transform.output) {
      expect(transform.output('not a json array')).toEqual([]);
      expect(transform.output('{"test": "object"}')).toEqual([]); // Not an array
      expect(transform.output(123)).toEqual([]); // Non-string, non-array
      expect(transform.output({ a: 1 })).toEqual([]); // Non-string, non-array
      expect(transform.output(null)).toEqual([]);
      expect(transform.output(undefined)).toEqual([]);
    }
  });

  it('output should return the same array if input is already an array (passthrough)', () => {
    const transform = createArrayTransform();
    if (transform.output) {
      const passthroughArray = ['a', 2, { b: 3 }];
      expect(transform.output(passthroughArray)).toEqual(passthroughArray);
    }
  });
});

describe('createObjectTransform', () => {
  it('input should stringify an object correctly', () => {
    const transform = createObjectTransform();
    if (transform.input) {
      expect(transform.input({ a: 1, b: 'test' })).toBe('{\n  "a": 1,\n  "b": "test"\n}');
      expect(transform.input({})).toBe('{}');
    }
  });

  it('input should handle stringify errors gracefully for objects with circular references', () => {
    const transform = createObjectTransform();
    if (transform.input) {
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      // JSON.stringify throws on circular references; the transform should catch and return '{}'
      expect(transform.input(circular)).toBe('{}');
    }
  });

  it('input should return "{}" and warn for non-object/null values passed at runtime (defensive check)', () => {
    const transform = createObjectTransform();
    const warnSpy = vi.spyOn(logger, 'warn');
    if (transform.input) {
      // @ts-expect-error Testing runtime robustness with incorrect type
      expect(transform.input(null)).toBe('{}');
      expect(warnSpy).toHaveBeenCalledWith(
        'formUtils',
        'createObjectTransform input received non-object or null value:',
        null
      );

      // @ts-expect-error Testing runtime robustness with incorrect type
      expect(transform.input(undefined)).toBe('{}');
      expect(warnSpy).toHaveBeenCalledWith(
        'formUtils',
        'createObjectTransform input received non-object or null value:',
        undefined
      );

      // @ts-expect-error Testing runtime robustness with incorrect type
      expect(transform.input('not-an-object-string')).toBe('{}');
      expect(warnSpy).toHaveBeenCalledWith(
        'formUtils',
        'createObjectTransform input received non-object or null value:',
        'not-an-object-string'
      );
    }
    warnSpy.mockRestore();
  });

  it('output should parse a valid JSON object string', () => {
    const transform = createObjectTransform();
    if (transform.output) {
      expect(transform.output('{"a":1,"b":"test"}')).toEqual({ a: 1, b: 'test' });
      expect(transform.output('{}')).toEqual({});
    }
  });

  it('output should return an empty object for invalid JSON string or non-string/non-object input', () => {
    const transform = createObjectTransform();
    if (transform.output) {
      expect(transform.output('not a json object')).toEqual({});
      expect(transform.output('[1,2,3]')).toEqual({});
      expect(transform.output(123)).toEqual({});
      expect(transform.output(null)).toEqual({});
      expect(transform.output(undefined)).toEqual({});
      expect(transform.output('')).toEqual({}); // Empty string
      expect(transform.output('   ')).toEqual({}); // Whitespace string
    }
  });

  it('output should return the same object if input is already an object (passthrough)', () => {
    const transform = createObjectTransform();
    if (transform.output) {
      const passthroughObject = { x: 10, y: 'data' };
      expect(transform.output(passthroughObject)).toEqual(passthroughObject);
    }
  });
});

describe('createArrayObjectTransform', () => {
  it('input should stringify an array of objects correctly', () => {
    const transform = createArrayObjectTransform();
    if (transform.input) {
      expect(transform.input([{ a: 1 }, { b: 'test' }])).toBe(
        '[\n  {\n    "a": 1\n  },\n  {\n    "b": "test"\n  }\n]'
      );
      expect(transform.input([])).toBe('[]');
    }
  });

  it('input should filter invalid items before stringifying', () => {
    const transform = createArrayObjectTransform();
    if (transform.input) {
      // Explicitly type the input array as Record<string, unknown>[] for the test
      const mixedArray: Record<string, unknown>[] = [
        { a: 1 },
        null as unknown as Record<string, unknown>, // Simulate a null item in a typed array
        { b: 2 },
        'invalid' as unknown as Record<string, unknown>, // Simulate a string item
      ].filter((item) => item && typeof item === 'object') as Record<string, unknown>[]; // Pre-filter to match expected input type

      expect(transform.input(mixedArray)).toBe('[\n  {\n    "a": 1\n  },\n  {\n    "b": 2\n  }\n]');
    }
  });

  it('input should return "[]" and warn for non-array values passed at runtime (defensive check)', () => {
    const transform = createArrayObjectTransform();
    const warnSpy = vi.spyOn(logger, 'warn');
    if (transform.input) {
      // @ts-expect-error Testing runtime robustness by passing null
      expect(transform.input(null)).toBe('[]');
      expect(warnSpy).toHaveBeenCalledWith(
        'formUtils',
        'createArrayObjectTransform input received non-array value:',
        null
      );
      // @ts-expect-error Testing runtime robustness by passing undefined
      expect(transform.input(undefined)).toBe('[]');
      expect(warnSpy).toHaveBeenCalledWith(
        'formUtils',
        'createArrayObjectTransform input received non-array value:',
        undefined
      );
      // @ts-expect-error Testing runtime robustness by passing a string
      expect(transform.input('not-an-array-of-objects')).toBe('[]');
      expect(warnSpy).toHaveBeenCalledWith(
        'formUtils',
        'createArrayObjectTransform input received non-array value:',
        'not-an-array-of-objects'
      );
      // Testing runtime robustness by passing an object (cast to trick TS)
      expect(transform.input({ a: 1 } as unknown as Record<string, unknown>[])).toBe('[]');
      expect(warnSpy).toHaveBeenCalledWith(
        'formUtils',
        'createArrayObjectTransform input received non-array value:',
        { a: 1 }
      );
    }
    warnSpy.mockRestore();
  });

  it('output should parse a valid JSON array of objects string', () => {
    const transform = createArrayObjectTransform();
    if (transform.output) {
      expect(transform.output('[{"a":1},{"b":"test"}]')).toEqual([{ a: 1 }, { b: 'test' }]);
      expect(transform.output('[]')).toEqual([]);
    }
  });

  it('output should filter out non-object items when parsing JSON string', () => {
    const transform = createArrayObjectTransform();
    if (transform.output) {
      expect(transform.output('[{"a":1}, null, {"b":2}, "invalid", 123]')).toEqual([
        { a: 1 },
        { b: 2 },
      ]);
    }
  });

  it('output should return an empty array for invalid JSON string or non-string/non-array input', () => {
    const transform = createArrayObjectTransform();
    if (transform.output) {
      expect(transform.output('not a json array')).toEqual([]);
      expect(transform.output('{"test": "object"}')).toEqual([]); // Not an array of objects
      expect(transform.output(123)).toEqual([]);
      expect(transform.output(null)).toEqual([]);
      expect(transform.output(undefined)).toEqual([]);
      expect(transform.output('')).toEqual([]);
      expect(transform.output('   ')).toEqual([]);
    }
  });

  it('output should return a filtered array if input is already an array (passthrough with filtering)', () => {
    const transform = createArrayObjectTransform();
    if (transform.output) {
      const passthroughArray = [{ x: 10 }, 'invalid' as unknown, null as unknown, { y: 'data' }];
      expect(transform.output(passthroughArray)).toEqual([{ x: 10 }, { y: 'data' }]);
      expect(transform.output([1, 2, 3] as unknown[])).toEqual([]); // Array of non-objects
    }
  });
});

describe('createTransformForFieldType', () => {
  // A more minimal mock, cast to unknown first if direct cast fails due to missing props
  const mockAdapterMinimal = {
    isValidAddress: (address: string) => address.startsWith('0x') && address.length === 42,
  } as unknown as ContractAdapter;

  it('should return createTextTransform for text type', () => {
    const transform = createTransformForFieldType('text');
    // Check if it has the properties of a text transform (e.g. simple string pass-through)
    expect(transform.input!('hello')).toBe('hello');
    expect(transform.output!('world')).toBe('world');
  });

  it('should return createNumberTransform for number type', () => {
    const transform = createTransformForFieldType('number');
    expect(transform.input!(123)).toBe('123');
    expect(transform.output!('456')).toBe(456);
  });

  it('should return createBooleanTransform for checkbox type', () => {
    const transform = createTransformForFieldType('checkbox');
    expect(transform.input!(true)).toBe(true);
    expect(transform.output!('false')).toBe(false);
  });

  it('should return createAddressTransform for blockchain-address type with adapter', () => {
    const transform = createTransformForFieldType('blockchain-address', mockAdapterMinimal);
    // Basic check, deeper checks are in createAddressTransform tests
    expect(transform.input!('0x123')).toBe('0x123');
  });

  it('should throw error for blockchain-address type without adapter', () => {
    expect(() => createTransformForFieldType('blockchain-address')).toThrowError(
      "createTransformForFieldType: Adapter is required for 'blockchain-address' field type but was not provided."
    );
  });

  it('should return createArrayTransform for array type', () => {
    const transform = createTransformForFieldType('array');
    expect(transform.input!([1, 2])).toBe('[\n  1,\n  2\n]');
    expect(transform.output!('[3,4]')).toEqual([3, 4]);
  });

  it('should return createObjectTransform for object type', () => {
    const transform = createTransformForFieldType('object');
    expect(transform.input!({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(transform.output!('{"b":2}')).toEqual({ b: 2 });
  });

  it('should return createArrayObjectTransform for array-object type', () => {
    const transform = createTransformForFieldType('array-object');
    expect(transform.input!([{ a: 1 }])).toBe('[\n  {\n    "a": 1\n  }\n]');
    expect(transform.output!('[{"b":2}]')).toEqual([{ b: 2 }]);
  });

  it('should return createComplexTypeTransform and warn for unknown type', () => {
    const warnSpy = vi.spyOn(logger, 'warn');
    // Use a type not explicitly handled to trigger default case
    const transform = createTransformForFieldType('unknown-type' as FieldType);
    expect(warnSpy).toHaveBeenCalledWith(
      'formUtils',
      'createTransformForFieldType: No specific transform for fieldType "unknown-type". Falling back to createComplexTypeTransform. Ensure adapter maps all expected ABI types to specific FieldTypes.'
    );
    // Check if it behaves like complex transform
    expect(transform.input!({ c: 3 })).toBe('{\n  "c": 3\n}');
    warnSpy.mockRestore();
  });
});

describe('getDefaultValueByFieldType', () => {
  it('should return false for checkbox fields', () => {
    expect(getDefaultValueByFieldType('checkbox')).toBe(false);
  });

  it('should return empty string for number fields', () => {
    expect(getDefaultValueByFieldType('number')).toBe('');
  });

  it('should return empty string for text fields', () => {
    expect(getDefaultValueByFieldType('text')).toBe('');
  });

  it('should return empty string for other field types', () => {
    expect(getDefaultValueByFieldType('blockchain-address')).toBe('');
  });
});

describe('createDefaultFormValues', () => {
  it('should return empty object when no fields are provided', () => {
    const result = createDefaultFormValues(undefined);
    expect(result).toEqual({});
  });

  it('should create default values for fields', () => {
    const fields = [
      { id: '1', name: 'name', type: 'text', label: 'Name', validation: {} },
      { id: '2', name: 'age', type: 'number', label: 'Age', validation: {} },
      { id: '3', name: 'active', type: 'checkbox', label: 'Active', validation: {} },
    ] as FormFieldType[];

    const result = createDefaultFormValues(fields);
    expect(result).toEqual({
      name: '',
      age: '',
      active: false,
    });
  });

  it('should preserve existing default values', () => {
    const fields = [
      { id: '1', name: 'name', type: 'text', label: 'Name', validation: {} },
      { id: '2', name: 'age', type: 'number', label: 'Age', validation: {} },
      { id: '3', name: 'active', type: 'checkbox', label: 'Active', validation: {} },
    ] as FormFieldType[];

    const existingDefaults = {
      name: 'John',
      customField: 'custom value',
    };

    const result = createDefaultFormValues(fields, existingDefaults);
    expect(result).toEqual({
      name: 'John',
      age: '',
      active: false,
      customField: 'custom value',
    });
  });
});
