import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContractSchema, FormFieldType } from '@openzeppelin/ui-types';

describe('Enum Payload Processing in formatStellarTransactionData', () => {
  const mockContractAddress = 'CDVQVKOY2YSXS2IC7KN6MNASSHPAO7UN2UR2ON4OI2SKMFJNVAMDX6DP';

  // Mock the enum detection functions
  const mockIsEnumType = vi.fn();
  const mockExtractEnumVariants = vi.fn();

  beforeEach(() => {
    // Mock the enum metadata functions
    vi.doMock('../../src/mapping/enum-metadata', () => ({
      isEnumType: mockIsEnumType,
      extractEnumVariants: mockExtractEnumVariants,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.doUnmock('../../src/mapping/enum-metadata');
  });

  const createMockSchema = (hasSpecEntries = true): ContractSchema => ({
    name: 'DemoEnumContract',
    address: mockContractAddress,
    ecosystem: 'stellar',
    functions: [
      {
        id: 'set_enum_DemoEnum',
        name: 'set_enum',
        displayName: 'Set Enum',
        type: 'function',
        modifiesState: true,
        inputs: [{ name: 'choice', type: 'DemoEnum', displayName: 'Choice' }],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    ],
    metadata: hasSpecEntries
      ? {
          specEntries: [] as unknown[], // Mock entries - actual structure doesn't matter for this test
        }
      : undefined,
  });

  const createMockFields = (): FormFieldType[] => [
    {
      id: 'field-1',
      name: 'choice',
      label: 'Choice',
      type: 'enum',
      placeholder: 'Select choice',
      defaultValue: { tag: 'One' },
      validation: { required: true },
      width: 'full',
    },
  ];

  describe('Raw value processing with enum metadata', () => {
    it('should process raw numeric values for U32 enum payloads', async () => {
      // Setup mocks
      mockIsEnumType.mockReturnValue(true);
      mockExtractEnumVariants.mockReturnValue({
        name: 'DemoEnum',
        variants: [
          { name: 'One', type: 'void' },
          { name: 'Two', type: 'tuple', payloadTypes: ['U32'] },
        ],
        isUnitOnly: false,
      });

      // Re-import the function after mocking
      const { formatStellarTransactionData: mockedFormatter } = await import(
        '../../src/transaction/formatter'
      );

      const submittedInputs = {
        choice: {
          tag: 'Two',
          values: [444], // Raw number from UI
        },
      };

      const result = mockedFormatter(
        createMockSchema(),
        'set_enum_DemoEnum',
        submittedInputs,
        createMockFields()
      );

      expect(result.contractAddress).toBe(mockContractAddress);
      expect(result.functionName).toBe('set_enum');
      expect(result.args).toHaveLength(1);
      expect(result.args[0]).toEqual({
        tag: 'Two',
        values: [{ type: 'U32', value: '444' }], // Should be processed into SorobanArgumentValue (string format for Stellar)
      });

      // Verify mocks were called
      expect(mockIsEnumType).toHaveBeenCalledWith([], 'DemoEnum');
      expect(mockExtractEnumVariants).toHaveBeenCalledWith([], 'DemoEnum');
    });

    it('should process raw string values for string enum payloads', async () => {
      // Setup mocks
      mockIsEnumType.mockReturnValue(true);
      mockExtractEnumVariants.mockReturnValue({
        name: 'DemoEnum',
        variants: [
          { name: 'One', type: 'void' },
          { name: 'Three', type: 'tuple', payloadTypes: ['ScString'] },
        ],
        isUnitOnly: false,
      });

      // Re-import the function after mocking
      const { formatStellarTransactionData: mockedFormatter } = await import(
        '../../src/transaction/formatter'
      );

      const submittedInputs = {
        choice: {
          tag: 'Three',
          values: ['hello world'], // Raw string from UI
        },
      };

      const result = mockedFormatter(
        createMockSchema(),
        'set_enum_DemoEnum',
        submittedInputs,
        createMockFields()
      );

      expect(result.contractAddress).toBe(mockContractAddress);
      expect(result.functionName).toBe('set_enum');
      expect(result.args).toHaveLength(1);
      expect(result.args[0]).toEqual({
        tag: 'Three',
        values: [{ type: 'ScString', value: 'hello world' }], // Should be processed into SorobanArgumentValue
      });
    });

    it('should process multiple raw values for multi-payload enum variants', async () => {
      // Setup mocks
      mockIsEnumType.mockReturnValue(true);
      mockExtractEnumVariants.mockReturnValue({
        name: 'DemoEnum',
        variants: [
          { name: 'One', type: 'void' },
          { name: 'Four', type: 'tuple', payloadTypes: ['U32', 'ScString'] },
        ],
        isUnitOnly: false,
      });

      // Re-import the function after mocking
      const { formatStellarTransactionData: mockedFormatter } = await import(
        '../../src/transaction/formatter'
      );

      const submittedInputs = {
        choice: {
          tag: 'Four',
          values: [123, 'test string'], // Multiple raw values from UI
        },
      };

      const result = mockedFormatter(
        createMockSchema(),
        'set_enum_DemoEnum',
        submittedInputs,
        createMockFields()
      );

      expect(result.contractAddress).toBe(mockContractAddress);
      expect(result.functionName).toBe('set_enum');
      expect(result.args).toHaveLength(1);
      expect(result.args[0]).toEqual({
        tag: 'Four',
        values: [
          { type: 'U32', value: '123' }, // First payload processed (string format for Stellar)
          { type: 'ScString', value: 'test string' }, // Second payload processed
        ],
      });
    });

    it('should handle unit enum variants without processing payloads', async () => {
      // Setup mocks
      mockIsEnumType.mockReturnValue(true);
      mockExtractEnumVariants.mockReturnValue({
        name: 'DemoEnum',
        variants: [{ name: 'One', type: 'void' }],
        isUnitOnly: true,
      });

      // Re-import the function after mocking
      const { formatStellarTransactionData: mockedFormatter } = await import(
        '../../src/transaction/formatter'
      );

      const submittedInputs = {
        choice: {
          tag: 'One', // Unit variant - no values
        },
      };

      const result = mockedFormatter(
        createMockSchema(),
        'set_enum_DemoEnum',
        submittedInputs,
        createMockFields()
      );

      expect(result.contractAddress).toBe(mockContractAddress);
      expect(result.functionName).toBe('set_enum');
      expect(result.args).toHaveLength(1);
      expect(result.args[0]).toEqual({
        tag: 'One', // Should remain unchanged
      });
    });
  });

  describe('Edge cases and fallbacks', () => {
    it('should keep complex struct payloads raw for TupleStruct', async () => {
      // Setup mocks - complex payload type
      mockIsEnumType.mockReturnValue(true);
      mockExtractEnumVariants.mockReturnValue({
        name: 'DemoEnum',
        variants: [{ name: 'Tuple', type: 'tuple', payloadTypes: ['TupleStruct'] }],
        isUnitOnly: false,
      });

      const { formatStellarTransactionData: mockedFormatter } = await import(
        '../../src/transaction/formatter'
      );

      // TupleStruct value expressed as array (tuple elements): [Test struct, SimpleEnum]
      const tupleStructValue = [
        { a: 1, b: true, c: 'sym' }, // Test struct
        'Second', // SimpleEnum
      ];

      const submittedInputs = {
        choice: {
          tag: 'Tuple',
          values: [tupleStructValue],
        },
      };

      const result = mockedFormatter(
        createMockSchema(),
        'set_enum_DemoEnum',
        submittedInputs,
        createMockFields()
      );

      expect(result.contractAddress).toBe(mockContractAddress);
      expect(result.functionName).toBe('set_enum');
      expect(result.args).toHaveLength(1);
      // Complex payload should be kept raw; conversion happens in valueToScVal using schema
      expect(result.args[0]).toEqual({
        tag: 'Tuple',
        values: [tupleStructValue],
      });
    });
    it('should handle enum values when variant is not found in metadata', async () => {
      // Setup mocks - return metadata but without the requested variant
      mockIsEnumType.mockReturnValue(true);
      mockExtractEnumVariants.mockReturnValue({
        name: 'DemoEnum',
        variants: [{ name: 'One', type: 'void' }], // Only has 'One', not 'UnknownVariant'
        isUnitOnly: false,
      });

      // Re-import the function after mocking
      const { formatStellarTransactionData: mockedFormatter } = await import(
        '../../src/transaction/formatter'
      );

      const submittedInputs = {
        choice: {
          tag: 'UnknownVariant', // Variant not in metadata
          values: [444],
        },
      };

      const result = mockedFormatter(
        createMockSchema(),
        'set_enum_DemoEnum',
        submittedInputs,
        createMockFields()
      );

      expect(result.contractAddress).toBe(mockContractAddress);
      expect(result.functionName).toBe('set_enum');
      expect(result.args).toHaveLength(1);
      // Should pass through unchanged when variant not found
      expect(result.args[0]).toEqual({
        tag: 'UnknownVariant',
        values: [444],
      });
    });

    it('should handle enum values when isEnumType returns false', async () => {
      // Setup mocks - isEnumType returns false
      mockIsEnumType.mockReturnValue(false);
      mockExtractEnumVariants.mockReturnValue(null);

      // Re-import the function after mocking
      const { formatStellarTransactionData: mockedFormatter } = await import(
        '../../src/transaction/formatter'
      );

      const submittedInputs = {
        choice: {
          tag: 'Two',
          values: [444],
        },
      };

      const result = mockedFormatter(
        createMockSchema(),
        'set_enum_DemoEnum',
        submittedInputs,
        createMockFields()
      );

      expect(result.contractAddress).toBe(mockContractAddress);
      expect(result.functionName).toBe('set_enum');
      expect(result.args).toHaveLength(1);
      // Should pass through unchanged when not detected as enum type
      expect(result.args[0]).toEqual({
        tag: 'Two',
        values: [444],
      });
    });

    it('should handle enum values when extractEnumVariants returns null', async () => {
      // Setup mocks - isEnumType returns true but extractEnumVariants returns null
      mockIsEnumType.mockReturnValue(true);
      mockExtractEnumVariants.mockReturnValue(null);

      // Re-import the function after mocking
      const { formatStellarTransactionData: mockedFormatter } = await import(
        '../../src/transaction/formatter'
      );

      const submittedInputs = {
        choice: {
          tag: 'Two',
          values: [444],
        },
      };

      const result = mockedFormatter(
        createMockSchema(),
        'set_enum_DemoEnum',
        submittedInputs,
        createMockFields()
      );

      expect(result.contractAddress).toBe(mockContractAddress);
      expect(result.functionName).toBe('set_enum');
      expect(result.args).toHaveLength(1);
      // Should pass through unchanged when no enum metadata available
      expect(result.args[0]).toEqual({
        tag: 'Two',
        values: [444],
      });
    });
  });
});
