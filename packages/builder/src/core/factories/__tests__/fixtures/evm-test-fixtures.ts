import type { ContractFunction, ContractSchema } from '@openzeppelin/ui-builder-types';

/**
 * Test fixtures specifically for testing EVM adapter integration
 */
export const TEST_FIXTURES = {
  // Test fixture with various integer sizes
  integerTypes: {
    id: 'test-integers',
    name: 'Test Integer Types',
    address: '0x1234567890123456789012345678901234567890',
    ecosystem: 'evm' as const,
    functions: [
      {
        id: 'function-uint8',
        name: 'testUint8',
        displayName: 'Test Uint8',
        description: 'Function with uint8 parameter',
        stateMutability: 'nonpayable',
        inputs: [
          {
            name: 'smallInt',
            type: 'uint8',
            description: 'Small integer (0-255)',
          },
        ],
        outputs: [],
        type: 'function',
        modifiesState: true,
      },
      {
        id: 'function-int8',
        name: 'testInt8',
        displayName: 'Test Int8',
        description: 'Function with int8 parameter',
        stateMutability: 'nonpayable',
        inputs: [
          {
            name: 'signedSmallInt',
            type: 'int8',
            description: 'Signed small integer (-128 to 127)',
          },
        ],
        outputs: [],
        type: 'function',
        modifiesState: true,
      },
      {
        id: 'function-uint256',
        name: 'testUint256',
        displayName: 'Test Uint256',
        description: 'Function with uint256 parameter',
        stateMutability: 'nonpayable',
        inputs: [
          {
            name: 'largeInt',
            type: 'uint256',
            description: 'Large integer (0 to 2^256-1)',
          },
        ],
        outputs: [],
        type: 'function',
        modifiesState: true,
      },
    ] as ContractFunction[],
  } as ContractSchema,

  // Test fixture with various byte types
  byteTypes: {
    id: 'test-bytes',
    name: 'Test Byte Types',
    address: '0x1234567890123456789012345678901234567890',
    ecosystem: 'evm' as const,
    functions: [
      {
        id: 'function-bytes',
        name: 'testBytes',
        displayName: 'Test Bytes',
        description: 'Function with bytes parameter',
        stateMutability: 'nonpayable',
        inputs: [
          {
            name: 'dynamicBytes',
            type: 'bytes',
            description: 'Dynamic byte array',
          },
        ],
        outputs: [],
        type: 'function',
        modifiesState: true,
      },
      {
        id: 'function-bytes32',
        name: 'testBytes32',
        displayName: 'Test Bytes32',
        description: 'Function with bytes32 parameter',
        stateMutability: 'nonpayable',
        inputs: [
          {
            name: 'fixedBytes',
            type: 'bytes32',
            description: 'Fixed size 32-byte array',
          },
        ],
        outputs: [],
        type: 'function',
        modifiesState: true,
      },
    ] as ContractFunction[],
  } as ContractSchema,

  // Test fixture with arrays
  arrayTypes: {
    id: 'test-arrays',
    name: 'Test Array Types',
    address: '0x1234567890123456789012345678901234567890',
    ecosystem: 'evm' as const,
    functions: [
      {
        id: 'function-dynamic-array',
        name: 'testDynamicArray',
        displayName: 'Test Dynamic Array',
        description: 'Function with dynamic array parameter',
        stateMutability: 'nonpayable',
        inputs: [
          {
            name: 'dynamicArray',
            type: 'uint256[]',
            description: 'Dynamic array of uint256',
          },
        ],
        outputs: [],
        type: 'function',
        modifiesState: true,
      },
      {
        id: 'function-fixed-array',
        name: 'testFixedArray',
        displayName: 'Test Fixed Array',
        description: 'Function with fixed-size array parameter',
        stateMutability: 'nonpayable',
        inputs: [
          {
            name: 'fixedArray',
            type: 'uint256[3]',
            description: 'Fixed array of 3 uint256 values',
          },
        ],
        outputs: [],
        type: 'function',
        modifiesState: true,
      },
      {
        id: 'function-string-array',
        name: 'testStringArray',
        displayName: 'Test String Array',
        description: 'Function with array of strings parameter',
        stateMutability: 'nonpayable',
        inputs: [
          {
            name: 'strings',
            type: 'string[]',
            description: 'Array of strings',
          },
        ],
        outputs: [],
        type: 'function',
        modifiesState: true,
      },
    ] as ContractFunction[],
  } as ContractSchema,

  // Test fixture for error cases
  errorCases: {
    id: 'test-errors',
    name: 'Test Error Cases',
    address: '0x1234567890123456789012345678901234567890',
    ecosystem: 'evm' as const,
    functions: [
      {
        id: 'function-empty-inputs',
        name: 'testEmptyInputs',
        displayName: 'Test Empty Inputs',
        description: 'Function with no inputs',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: [],
        type: 'function',
        modifiesState: true,
      },
      {
        id: 'function-unsupported-type',
        name: 'testUnsupportedType',
        displayName: 'Test Unsupported Type',
        description: 'Function with custom type parameter',
        stateMutability: 'nonpayable',
        inputs: [
          {
            name: 'customType',
            type: 'CustomType', // Intentionally unsupported
            description: 'Custom type parameter',
          },
        ],
        outputs: [],
        type: 'function',
        modifiesState: true,
      },
    ] as ContractFunction[],
  } as ContractSchema,
};
