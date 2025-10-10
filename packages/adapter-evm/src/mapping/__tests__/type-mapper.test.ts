import { describe, expect, it } from 'vitest';

import { getEvmCompatibleFieldTypes, mapEvmParamTypeToFieldType } from '../type-mapper';

describe('EVM Type Mapper', () => {
  describe('mapEvmParamTypeToFieldType', () => {
    it('should map small integer types to number field', () => {
      expect(mapEvmParamTypeToFieldType('uint')).toBe('number');
      expect(mapEvmParamTypeToFieldType('uint8')).toBe('number');
      expect(mapEvmParamTypeToFieldType('uint16')).toBe('number');
      expect(mapEvmParamTypeToFieldType('uint32')).toBe('number');
      expect(mapEvmParamTypeToFieldType('int')).toBe('number');
      expect(mapEvmParamTypeToFieldType('int8')).toBe('number');
      expect(mapEvmParamTypeToFieldType('int16')).toBe('number');
      expect(mapEvmParamTypeToFieldType('int32')).toBe('number');
    });

    it('should map 64-bit and larger integer types to bigint field to avoid precision loss', () => {
      // These types can hold values larger than JavaScript's Number.MAX_SAFE_INTEGER (2^53-1)
      expect(mapEvmParamTypeToFieldType('uint64')).toBe('bigint');
      expect(mapEvmParamTypeToFieldType('uint128')).toBe('bigint');
      expect(mapEvmParamTypeToFieldType('uint256')).toBe('bigint');
      expect(mapEvmParamTypeToFieldType('int64')).toBe('bigint');
      expect(mapEvmParamTypeToFieldType('int128')).toBe('bigint');
      expect(mapEvmParamTypeToFieldType('int256')).toBe('bigint');
    });

    it('should map address to blockchain-address field', () => {
      expect(mapEvmParamTypeToFieldType('address')).toBe('blockchain-address');
    });

    it('should map bool to checkbox field', () => {
      expect(mapEvmParamTypeToFieldType('bool')).toBe('checkbox');
    });

    it('should map string to text field', () => {
      expect(mapEvmParamTypeToFieldType('string')).toBe('text');
    });

    it('should map bytes types to text/textarea fields', () => {
      expect(mapEvmParamTypeToFieldType('bytes')).toBe('textarea');
      expect(mapEvmParamTypeToFieldType('bytes32')).toBe('text');
    });

    it('should map array types correctly', () => {
      expect(mapEvmParamTypeToFieldType('uint256[]')).toBe('array');
      expect(mapEvmParamTypeToFieldType('address[]')).toBe('array');
      expect(mapEvmParamTypeToFieldType('string[]')).toBe('array');
    });

    it('should map tuple types to object', () => {
      expect(mapEvmParamTypeToFieldType('tuple')).toBe('object');
    });

    it('should map array of tuples to array-object', () => {
      expect(mapEvmParamTypeToFieldType('tuple[]')).toBe('array-object');
      expect(mapEvmParamTypeToFieldType('tuple[5]')).toBe('array-object');
    });

    it('should default to text for unknown types', () => {
      expect(mapEvmParamTypeToFieldType('unknown')).toBe('text');
      expect(mapEvmParamTypeToFieldType('custom')).toBe('text');
    });
  });

  describe('getEvmCompatibleFieldTypes', () => {
    it('should return bigint as first compatible type for 64-bit and larger unsigned integers', () => {
      // Verify uint64
      const compatibleTypesUint64 = getEvmCompatibleFieldTypes('uint64');
      expect(compatibleTypesUint64[0]).toBe('bigint'); // First (recommended) type
      expect(compatibleTypesUint64).toContain('number');
      expect(compatibleTypesUint64).toContain('amount');
      expect(compatibleTypesUint64).toContain('text');

      // Verify uint128
      const compatibleTypesUint128 = getEvmCompatibleFieldTypes('uint128');
      expect(compatibleTypesUint128[0]).toBe('bigint'); // First (recommended) type
      expect(compatibleTypesUint128).toContain('number');
      expect(compatibleTypesUint128).toContain('amount');
      expect(compatibleTypesUint128).toContain('text');

      // Verify uint256
      const compatibleTypesUint256 = getEvmCompatibleFieldTypes('uint256');
      expect(compatibleTypesUint256[0]).toBe('bigint'); // First (recommended) type
      expect(compatibleTypesUint256).toContain('number');
      expect(compatibleTypesUint256).toContain('amount');
      expect(compatibleTypesUint256).toContain('text');
    });

    it('should return bigint as first compatible type for 64-bit and larger signed integers', () => {
      // Verify int64
      const compatibleTypesInt64 = getEvmCompatibleFieldTypes('int64');
      expect(compatibleTypesInt64[0]).toBe('bigint'); // First (recommended) type
      expect(compatibleTypesInt64).toContain('number');
      expect(compatibleTypesInt64).toContain('text');

      // Verify int128
      const compatibleTypesInt128 = getEvmCompatibleFieldTypes('int128');
      expect(compatibleTypesInt128[0]).toBe('bigint'); // First (recommended) type
      expect(compatibleTypesInt128).toContain('number');
      expect(compatibleTypesInt128).toContain('text');

      // Verify int256
      const compatibleTypesInt256 = getEvmCompatibleFieldTypes('int256');
      expect(compatibleTypesInt256[0]).toBe('bigint'); // First (recommended) type
      expect(compatibleTypesInt256).toContain('number');
      expect(compatibleTypesInt256).toContain('text');
    });

    it('should return number as first compatible type for small integers', () => {
      // Small integers that fit within JavaScript Number precision
      const compatibleTypes = getEvmCompatibleFieldTypes('uint32');
      expect(compatibleTypes[0]).toBe('number'); // First (recommended) type
      expect(compatibleTypes).toContain('amount');
      expect(compatibleTypes).toContain('text');
    });

    it('should return compatible field types for address', () => {
      const compatibleTypes = getEvmCompatibleFieldTypes('address');
      expect(compatibleTypes[0]).toBe('blockchain-address'); // First (recommended) type
      expect(compatibleTypes).toContain('text');
    });

    it('should return compatible field types for bool', () => {
      const compatibleTypes = getEvmCompatibleFieldTypes('bool');
      expect(compatibleTypes[0]).toBe('checkbox'); // First (recommended) type
      expect(compatibleTypes).toContain('select');
      expect(compatibleTypes).toContain('radio');
      expect(compatibleTypes).toContain('text');
    });

    it('should return compatible field types for arrays', () => {
      const compatibleTypes = getEvmCompatibleFieldTypes('uint256[]');
      expect(compatibleTypes[0]).toBe('array'); // First (recommended) type
      expect(compatibleTypes).toContain('textarea');
      expect(compatibleTypes).toContain('text');
    });
  });
});
