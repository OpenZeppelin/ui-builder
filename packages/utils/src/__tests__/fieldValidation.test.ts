import { describe, expect, it } from 'vitest';

import { enhanceNumericValidation, type NumericBoundsMap } from '../fieldValidation';

describe('fieldValidation', () => {
  describe('enhanceNumericValidation', () => {
    const stellarBounds: NumericBoundsMap = {
      U8: { min: 0, max: 255 },
      U16: { min: 0, max: 65_535 },
      U32: { min: 0, max: 4_294_967_295 },
      I8: { min: -128, max: 127 },
      I16: { min: -32_768, max: 32_767 },
      I32: { min: -2_147_483_648, max: 2_147_483_647 },
    };

    const evmBounds: NumericBoundsMap = {
      uint8: { min: 0, max: 255 },
      uint16: { min: 0, max: 65_535 },
      uint32: { min: 0, max: 4_294_967_295 },
      int8: { min: -128, max: 127 },
      int16: { min: -32_768, max: 32_767 },
      int32: { min: -2_147_483_648, max: 2_147_483_647 },
    };

    describe('with undefined validation', () => {
      it('should apply bounds for known types', () => {
        const result = enhanceNumericValidation(undefined, 'U32', stellarBounds);
        expect(result).toEqual({
          min: 0,
          max: 4_294_967_295,
        });
      });

      it('should return empty object for unknown types', () => {
        const result = enhanceNumericValidation(undefined, 'unknown', stellarBounds);
        expect(result).toEqual({});
      });

      it('should handle signed integer bounds', () => {
        const result = enhanceNumericValidation(undefined, 'I8', stellarBounds);
        expect(result).toEqual({
          min: -128,
          max: 127,
        });
      });
    });

    describe('with existing validation', () => {
      it('should preserve existing required flag', () => {
        const result = enhanceNumericValidation({ required: true }, 'U32', stellarBounds);
        expect(result).toEqual({
          required: true,
          min: 0,
          max: 4_294_967_295,
        });
      });

      it('should preserve existing min/max if already set', () => {
        const result = enhanceNumericValidation({ min: 10, max: 100 }, 'U32', stellarBounds);
        expect(result).toEqual({
          min: 10,
          max: 100,
        });
      });

      it('should apply bounds only if not already set', () => {
        const result = enhanceNumericValidation({ min: 10 }, 'U32', stellarBounds);
        expect(result).toEqual({
          min: 10,
          max: 4_294_967_295,
        });

        const result2 = enhanceNumericValidation({ max: 100 }, 'U32', stellarBounds);
        expect(result2).toEqual({
          min: 0,
          max: 100,
        });
      });

      it('should preserve other validation properties', () => {
        const result = enhanceNumericValidation(
          { required: true, pattern: '^\\d+$' },
          'U32',
          stellarBounds
        );
        expect(result).toEqual({
          required: true,
          pattern: '^\\d+$',
          min: 0,
          max: 4_294_967_295,
        });
      });
    });

    describe('with different chain bounds', () => {
      it('should work with EVM bounds', () => {
        const result = enhanceNumericValidation(undefined, 'uint32', evmBounds);
        expect(result).toEqual({
          min: 0,
          max: 4_294_967_295,
        });
      });

      it('should work with Stellar bounds', () => {
        const result = enhanceNumericValidation(undefined, 'U32', stellarBounds);
        expect(result).toEqual({
          min: 0,
          max: 4_294_967_295,
        });
      });

      it('should not apply bounds from wrong chain', () => {
        const result = enhanceNumericValidation(undefined, 'U32', evmBounds);
        expect(result).toEqual({});
      });
    });

    describe('edge cases', () => {
      it('should handle bounds with only min', () => {
        const bounds: NumericBoundsMap = {
          uint: { min: 0 },
        };
        const result = enhanceNumericValidation(undefined, 'uint', bounds);
        expect(result).toEqual({
          min: 0,
        });
      });

      it('should handle bounds with only max', () => {
        const bounds: NumericBoundsMap = {
          limited: { max: 100 },
        };
        const result = enhanceNumericValidation(undefined, 'limited', bounds);
        expect(result).toEqual({
          max: 100,
        });
      });

      it('should handle empty bounds map', () => {
        const result = enhanceNumericValidation(undefined, 'any', {});
        expect(result).toEqual({});
      });

      it('should handle zero bounds', () => {
        const bounds: NumericBoundsMap = {
          zero: { min: 0, max: 0 },
        };
        const result = enhanceNumericValidation(undefined, 'zero', bounds);
        expect(result).toEqual({
          min: 0,
          max: 0,
        });
      });

      it('should handle negative min bounds', () => {
        const result = enhanceNumericValidation(undefined, 'I8', stellarBounds);
        expect(result).toEqual({
          min: -128,
          max: 127,
        });
      });
    });

    describe('integration scenarios', () => {
      it('should handle complete validation object with bounds', () => {
        const existing = {
          required: true,
          min: 5,
          max: 50,
          pattern: '^\\d+$',
        };
        const result = enhanceNumericValidation(existing, 'U32', stellarBounds);
        // Should preserve existing min/max since they're already set
        expect(result).toEqual({
          required: true,
          min: 5,
          max: 50,
          pattern: '^\\d+$',
        });
      });

      it('should work with partial bounds application', () => {
        const existing = { required: true, min: 100 };
        const result = enhanceNumericValidation(existing, 'U32', stellarBounds);
        // Should preserve existing min, apply max
        expect(result).toEqual({
          required: true,
          min: 100,
          max: 4_294_967_295,
        });
      });
    });
  });
});
