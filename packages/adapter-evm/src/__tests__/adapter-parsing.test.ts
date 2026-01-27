import { beforeEach, describe, expect, it } from 'vitest';

import {
  EVM_TYPE_TO_FIELD_TYPE,
  parseEvmInput as parseEvmInputFunction,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type { ContractFunction, FunctionParameter } from '@openzeppelin/ui-types';

import { mockEvmNetworkConfig } from './mocks/mock-network-configs';

import { EvmAdapter } from '../adapter';

// Mock FunctionParameter type helper
const createParam = (
  type: string,
  name: string,
  components?: FunctionParameter[]
): FunctionParameter => ({
  name,
  type,
  displayName: name, // Keep it simple for tests
  components,
});

describe('EvmAdapter Input Parsing', () => {
  // Define valid address constants accessible to multiple test blocks
  const validAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const checksummedAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // viem getAddress checksums

  // Helper to call the imported parseEvmInput function
  const parseInput = (param: FunctionParameter, value: unknown) => {
    return parseEvmInputFunction(param, value);
  };

  // --- Simple Type Tests ---
  describe('Simple Types', () => {
    // uint/int tests
    describe('Integer Types (uint/int)', () => {
      const uintParam = createParam('uint256', 'amount');
      const intParam = createParam('int8', 'delta');

      it('should parse valid numbers/strings to BigInt', () => {
        expect(parseInput(uintParam, 123)).toBe(123n);
        expect(parseInput(uintParam, '456')).toBe(456n);
        expect(parseInput(intParam, -10)).toBe(-10n);
        expect(parseInput(intParam, '-20')).toBe(-20n);
        expect(parseInput(uintParam, BigInt(1e18))).toBe(1000000000000000000n);
      });

      it('should throw error for empty numeric input', () => {
        expect(() => parseInput(uintParam, '')).toThrowError(
          /Failed to parse value for parameter 'amount' .* Numeric value cannot be empty/
        );
      });

      it('should throw error for invalid numeric strings', () => {
        expect(() => parseInput(uintParam, 'abc')).toThrowError(
          /Failed to parse value for parameter 'amount' .* Invalid numeric value: 'abc'/
        );
        expect(() => parseInput(intParam, '10.5')).toThrowError(
          // BigInt doesn't allow decimals
          /Failed to parse value for parameter 'delta' .* Invalid numeric value: '10.5'/
        );
        expect(() => parseInput(uintParam, '10n')).toThrowError(
          // Invalid BigInt syntax
          /Failed to parse value for parameter 'amount' .* Invalid numeric value: '10n'/
        );
      });
    });

    // address tests
    describe('Address Type', () => {
      const param = createParam('address', 'recipient');

      it('should parse and checksum valid address', () => {
        expect(parseInput(param, validAddress.toLowerCase())).toBe(checksummedAddress);
        expect(parseInput(param, validAddress)).toBe(checksummedAddress);
      });

      it('should throw error for invalid address format', () => {
        expect(() => parseInput(param, '0x123')).toThrowError(
          /Failed to parse value for parameter 'recipient' .* Invalid address format: '0x123'/
        );
        expect(() => parseInput(param, 'not_an_address')).toThrowError(
          /Failed to parse value for parameter 'recipient' .* Invalid address format: 'not_an_address'/
        );
      });

      it('should throw error for empty address input', () => {
        expect(() => parseInput(param, '')).toThrowError(
          /Failed to parse value for parameter 'recipient' .* Address value must be a non-empty string/
        );
      });

      it('should throw error for non-string address input', () => {
        expect(() => parseInput(param, 123)).toThrowError(
          /Failed to parse value for parameter 'recipient' .* Address value must be a non-empty string/
        );
      });
    });

    // bool tests
    describe('Boolean Type', () => {
      const param = createParam('bool', 'isActive');

      it('should parse boolean values', () => {
        expect(parseInput(param, true)).toBe(true);
        expect(parseInput(param, false)).toBe(false);
      });

      it('should parse string representations "true"/"false"', () => {
        expect(parseInput(param, 'true')).toBe(true);
        expect(parseInput(param, 'false')).toBe(false);
        expect(parseInput(param, ' True ')).toBe(true); // Handle whitespace
        expect(parseInput(param, ' FALSE ')).toBe(false);
      });

      // Current implementation uses Boolean() which is very lenient
      // Test this behaviour, but maybe flag it for review
      it('should parse other truthy/falsy values (current behaviour)', () => {
        expect(parseInput(param, 1)).toBe(true);
        expect(parseInput(param, 0)).toBe(false);
        expect(parseInput(param, 'any string')).toBe(true);
        expect(parseInput(param, '')).toBe(false); // Empty string is falsy
        expect(parseInput(param, null)).toBe(false);
        expect(parseInput(param, undefined)).toBe(false);
      });

      // Add a test that *would* fail if strict parsing was enforced
      it.skip('should ideally throw for ambiguous non-boolean/non-string values', () => {
        expect(() => parseInput(param, 1)).toThrow();
        expect(() => parseInput(param, 'abc')).toThrow();
        expect(() => parseInput(param, '')).toThrow();
      });
    });

    // string tests
    describe('String Type', () => {
      const param = createParam('string', 'message');

      it('should keep strings as strings', () => {
        expect(parseInput(param, 'hello world')).toBe('hello world');
        expect(parseInput(param, '')).toBe('');
      });

      it('should convert numbers to strings', () => {
        expect(parseInput(param, 123)).toBe('123');
        expect(parseInput(param, 0)).toBe('0');
      });

      it('should convert booleans to strings', () => {
        expect(parseInput(param, true)).toBe('true');
        expect(parseInput(param, false)).toBe('false');
      });
    });
  });

  // --- Bytes Type Tests ---
  describe('Bytes Types', () => {
    describe('bytes (dynamic)', () => {
      const param = createParam('bytes', 'data');

      it('should parse valid hex strings', () => {
        expect(parseInput(param, '0x')).toBe('0x');
        expect(parseInput(param, '0x1234')).toBe('0x1234');
        expect(parseInput(param, '0xabcdef')).toBe('0xabcdef');
      });

      it('should throw error for invalid hex strings', () => {
        expect(() => parseInput(param, '0x123')).toThrowError(/Invalid hex string format/); // Odd length
        expect(() => parseInput(param, '0xghij')).toThrowError(/Invalid hex string format/); // Invalid chars
        expect(() => parseInput(param, '1234')).toThrowError(/Invalid hex string format/); // Missing 0x
        expect(() => parseInput(param, '')).toThrowError(/Invalid hex string format/);
      });

      it('should throw error for non-string input', () => {
        expect(() => parseInput(param, 123)).toThrowError(/Bytes input must be a string/);
      });
    });

    describe('bytesN (fixed)', () => {
      const param = createParam('bytes4', 'selector');

      it('should parse valid hex strings of correct length', () => {
        expect(parseInput(param, '0x12345678')).toBe('0x12345678');
      });

      it('should throw error for invalid hex strings', () => {
        expect(() => parseInput(param, '0x1234567')).toThrowError(/Invalid hex string format/); // Odd length
        expect(() => parseInput(param, '0xghij')).toThrowError(/Invalid hex string format/); // Invalid chars
        expect(() => parseInput(param, '12345678')).toThrowError(/Invalid hex string format/); // Missing 0x
      });

      it('should throw error for hex strings of incorrect length', () => {
        expect(() => parseInput(param, '0x1234')).toThrowError(
          /Invalid length for bytes4: expected 4 bytes .* got 2 bytes/
        );
        expect(() => parseInput(param, '0x1234567890')).toThrowError(
          /Invalid length for bytes4: expected 4 bytes .* got 5 bytes/
        );
      });
    });
  });

  // --- Array Type Tests ---
  describe('Array Types', () => {
    const uintArrParam = createParam('uint256[]', 'ids');
    const addrArrParam = createParam('address[]', 'recipients');
    const tupleArrParam = createParam('tuple[]', 'records', [
      createParam('address', 'user'),
      createParam('uint256', 'balance'),
    ]);

    it('should parse valid JSON array of simple types', () => {
      expect(parseInput(uintArrParam, '[1, "2", 30]')).toEqual([1n, 2n, 30n]);
      expect(
        parseInput(
          addrArrParam,
          '["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"]'
        )
      ).toEqual([
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      ]);
      expect(parseInput(uintArrParam, '[]')).toEqual([]);
    });

    it('should parse valid JSON array of tuples', () => {
      const json =
        '[{"user": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "balance": "100"}, {"user": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "balance": 200}]';
      expect(parseInput(tupleArrParam, json)).toEqual([
        { user: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', balance: 100n },
        { user: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', balance: 200n },
      ]);
    });

    it('should throw error for non-string input', () => {
      expect(() => parseInput(uintArrParam, [1, 2])).toThrowError(
        /Array input must be a JSON string/
      );
    });

    it('should throw error for invalid JSON string', () => {
      expect(() => parseInput(uintArrParam, '[1, 2,')).toThrowError(/Invalid JSON for array/);
    });

    it('should throw error if parsed JSON is not an array', () => {
      expect(() => parseInput(uintArrParam, '{"a": 1}')).toThrowError(
        /Parsed JSON is not an array/
      );
    });

    it('should throw error if any element fails parsing', () => {
      expect(() => parseInput(uintArrParam, '[1, "abc", 3]')).toThrowError(
        /Failed to parse value for parameter 'ids' .* Invalid numeric value: 'abc'/
      );
      expect(() => parseInput(addrArrParam, `["${validAddress}", "invalid"]`)).toThrowError(
        /Failed to parse value for parameter 'recipients' .* Invalid address format: 'invalid'/
      );
      const invalidTupleJson = `[{"user": "${validAddress}", "balance": "100"}, {"user": "invalid", "balance": 200}]`;
      expect(() => parseInput(tupleArrParam, invalidTupleJson)).toThrowError(
        /Failed to parse value for parameter 'user' .* Invalid address format: 'invalid'/
      );
    });
  });

  // --- Tuple Type Tests ---
  describe('Tuple Types', () => {
    const simpleTupleParam = createParam('tuple', 'config', [
      createParam('address', 'owner'),
      createParam('uint256', 'threshold'),
    ]);
    const nestedTupleParam = createParam('tuple', 'nested', [
      createParam('string', 'label'),
      createParam('tuple', 'inner', [createParam('bool', 'flag'), createParam('bytes4', 'id')]),
    ]);

    it('should parse valid JSON object matching tuple structure', () => {
      const json = '{"owner": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "threshold": "5"}';
      expect(parseInput(simpleTupleParam, json)).toEqual({
        owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        threshold: 5n,
      });
    });

    it('should parse valid JSON object with nested tuple', () => {
      const json = '{"label": "Test", "inner": {"flag": true, "id": "0x12345678"}}';
      expect(parseInput(nestedTupleParam, json)).toEqual({
        label: 'Test',
        inner: { flag: true, id: '0x12345678' },
      });
    });

    it('should throw error for non-string input', () => {
      expect(() => parseInput(simpleTupleParam, { owner: '0x...', threshold: 5 })).toThrowError(
        /Tuple input must be a JSON string/
      );
    });

    it('should throw error for invalid JSON string', () => {
      expect(() => parseInput(simpleTupleParam, '{"owner": "0xf39..."')).toThrowError(
        /Invalid JSON for tuple/
      );
    });

    it('should throw error if parsed JSON is not an object', () => {
      expect(() => parseInput(simpleTupleParam, '[1, 2]')).toThrowError(
        /Parsed JSON is not an object for tuple/
      );
      expect(() => parseInput(simpleTupleParam, '"string"')).toThrowError(
        /Parsed JSON is not an object for tuple/
      );
    });

    it('should throw error if a component is missing', () => {
      const json = '{"owner": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}';
      expect(() => parseInput(simpleTupleParam, json)).toThrowError(
        /Missing component 'threshold' in tuple JSON/
      );
    });

    it('should throw error if there are extra keys', () => {
      const json = `{"owner": "${validAddress}", "threshold": 5, "extra": 1}`;
      expect(() => parseInput(simpleTupleParam, json)).toThrowError(
        /Tuple object has incorrect number of keys/
      );
    });

    it('should throw error if a component value fails parsing', () => {
      const json = '{"owner": "invalid", "threshold": "5"}';
      expect(() => parseInput(simpleTupleParam, json)).toThrowError(
        /Failed to parse value for parameter 'owner' .* Invalid address format: 'invalid'/
      );
      const json2 = `{"owner": "${validAddress}", "threshold": "abc"}`;
      expect(() => parseInput(simpleTupleParam, json2)).toThrowError(
        /Failed to parse value for parameter 'threshold' .* Invalid numeric value: 'abc'/
      );
    });

    it('should throw error if nested component value fails parsing', () => {
      const json = '{"label": "Test", "inner": {"flag": true, "id": "invalid"}}';
      expect(() => parseInput(nestedTupleParam, json)).toThrowError(
        /Failed to parse value for parameter 'id' .* Invalid hex string format/
      );
    });
  });
});

// --- Output Formatting Tests ---
describe('EvmAdapter Output Formatting', () => {
  let adapter: EvmAdapter;

  beforeEach(() => {
    // Instantiate adapter WITH shared mock config
    adapter = new EvmAdapter(mockEvmNetworkConfig);
  });

  // Helper to call formatFunctionResult
  const formatResult = (result: unknown, outputs: FunctionParameter[]) => {
    // Mock minimal FunctionDetails needed for formatting
    const mockFunctionDetails: ContractFunction = {
      id: 'mock_func',
      name: 'mockFunc',
      displayName: 'mockFunc',
      type: 'function',
      inputs: [], // Not used by formatFunctionResult
      outputs: outputs,
      modifiesState: false,
      stateMutability: 'view',
    };
    return adapter.formatFunctionResult(result, mockFunctionDetails);
  };

  it('should format simple types correctly', () => {
    expect(formatResult('hello', [createParam('string', 'message')])).toBe('hello');
    expect(formatResult(123, [createParam('uint8', 'value')])).toBe('123');
    expect(formatResult(123n, [createParam('uint256', 'value')])).toBe('123');
    expect(formatResult(true, [createParam('bool', 'flag')])).toBe('true');
    expect(
      formatResult('0x1234567890abcdef1234567890abcdef12345678', [createParam('address', 'addr')])
    ).toBe('0x1234567890abcdef1234567890abcdef12345678');
  });

  it('should format null/undefined as (null)', () => {
    expect(formatResult(null, [createParam('string', 'message')])).toBe('(null)');
    expect(formatResult(undefined, [createParam('string', 'message')])).toBe('(null)');
  });

  it('should handle empty outputs array', () => {
    // When outputs array is empty, queryViewFunction returns undefined, which formats to '(null)'
    expect(formatResult(undefined, [])).toBe('(null)');
  });

  it('should format single-element arrays from queryViewFunction correctly', () => {
    // Simulate queryViewFunction returning a single value wrapped in an array
    expect(formatResult([123n], [{ name: 'value', type: 'uint256' }])).toBe('123');
    expect(formatResult(['hello'], [{ name: 'value', type: 'string' }])).toBe('hello');
  });

  it('should format multi-element arrays as JSON string with BigInts as strings', () => {
    const result = [123n, 'hello', true, 456n];
    const outputs: FunctionParameter[] = [
      createParam('uint256', 'num1'),
      createParam('string', 'str'),
      createParam('bool', 'flag'),
      createParam('int64', 'num2'),
    ];
    const expectedJson = JSON.stringify(['123', 'hello', true, '456'], null, 2);
    expect(formatResult(result, outputs)).toBe(expectedJson);
  });

  it('should format simple tuples/structs as JSON string with BigInts as strings', () => {
    const result = { owner: '0x123', threshold: 5n }; // Assume readContract returns object for structs
    const outputs: FunctionParameter[] = [
      { name: 'owner', type: 'address' },
      { name: 'threshold', type: 'uint256' },
    ];
    const expectedJson = JSON.stringify({ owner: '0x123', threshold: '5' }, null, 2);
    // Note: formatFunctionResult expects the *decoded* value. If a struct is returned as a single output,
    // viem might return it directly, not wrapped in an array.
    expect(formatResult(result, outputs)).toBe(expectedJson);
  });

  it('should format nested structures (array of tuples) as JSON string', () => {
    const result = [
      { user: '0x123', balance: 100n },
      { user: '0x456', balance: 200n },
    ];
    const outputs: FunctionParameter[] = [
      {
        name: 'records',
        type: 'tuple[]',
        components: [
          { name: 'user', type: 'address' },
          { name: 'balance', type: 'uint256' },
        ],
      },
    ];
    const expectedJson = JSON.stringify(
      [
        { user: '0x123', balance: '100' },
        { user: '0x456', balance: '200' },
      ],
      null,
      2
    );
    // If queryViewFunction returns array of tuples for tuple[], pass it directly
    expect(formatResult(result, outputs)).toBe(expectedJson);
  });

  it('should handle missing output definitions', () => {
    const mockFunctionDetails: ContractFunction = {
      id: 'mock_func',
      name: 'mockFunc',
      displayName: 'mockFunc',
      type: 'function',
      inputs: [],
      outputs: undefined, // Simulate missing outputs
      modifiesState: false,
      stateMutability: 'view',
    };
    expect(adapter.formatFunctionResult('some value', mockFunctionDetails)).toBe(
      '[Error: Output ABI definition missing]'
    );
  });

  // Potential TODO: Add test for error during stringifyWithBigInt if possible (e.g., circular refs, though unlikely here)
});

// --- getTypeMappingInfo Tests ---
describe('EvmAdapter getTypeMappingInfo', () => {
  let adapter: EvmAdapter;

  beforeEach(() => {
    adapter = new EvmAdapter(mockEvmNetworkConfig);
  });

  it('should return TypeMappingInfo with primitives and dynamicPatterns', () => {
    const info = adapter.getTypeMappingInfo();
    expect(info).toHaveProperty('primitives');
    expect(info).toHaveProperty('dynamicPatterns');
    expect(typeof info.primitives).toBe('object');
    expect(Array.isArray(info.dynamicPatterns)).toBe(true);
  });

  it('should return primitives matching EVM_TYPE_TO_FIELD_TYPE constant', () => {
    const info = adapter.getTypeMappingInfo();
    const expectedTypes = Object.keys(EVM_TYPE_TO_FIELD_TYPE);
    expect(Object.keys(info.primitives)).toEqual(expectedTypes);
  });

  it('should include expected EVM primitive types in primitives', () => {
    const { primitives } = adapter.getTypeMappingInfo();
    // Core EVM primitive types
    expect(primitives).toHaveProperty('address');
    expect(primitives).toHaveProperty('bool');
    expect(primitives).toHaveProperty('string');
    expect(primitives).toHaveProperty('bytes');
    expect(primitives).toHaveProperty('bytes32');
    // Integer types
    expect(primitives).toHaveProperty('uint256');
    expect(primitives).toHaveProperty('int256');
  });

  it('should NOT include dynamic types in primitives', () => {
    const { primitives } = adapter.getTypeMappingInfo();
    Object.keys(primitives).forEach((type) => {
      expect(type).not.toMatch(/\[\]$/); // No array types
      expect(type).not.toMatch(/^tuple/); // No tuple types
    });
  });

  it('should include dynamic patterns for arrays and tuples', () => {
    const { dynamicPatterns } = adapter.getTypeMappingInfo();
    const patternNames = dynamicPatterns.map((p) => p.name);
    expect(patternNames).toContain('array');
    expect(patternNames).toContain('tuple');
    expect(patternNames).toContain('tuple-array');
  });

  it('should have properly structured dynamic patterns', () => {
    const { dynamicPatterns } = adapter.getTypeMappingInfo();
    dynamicPatterns.forEach((pattern) => {
      expect(pattern).toHaveProperty('name');
      expect(pattern).toHaveProperty('syntax');
      expect(pattern).toHaveProperty('mapsTo');
      expect(pattern).toHaveProperty('description');
      expect(typeof pattern.name).toBe('string');
      expect(typeof pattern.syntax).toBe('string');
      expect(typeof pattern.description).toBe('string');
    });
  });
});
