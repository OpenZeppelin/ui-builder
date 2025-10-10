import { describe, expect, it } from 'vitest';

import type { FunctionParameter } from '@openzeppelin/ui-builder-types';

import { generateEvmDefaultField } from '../field-generator';

// Helper to create a mock function parameter
const createParam = (type: string, name: string, description?: string): FunctionParameter => ({
  name,
  type,
  displayName: name,
  description,
});

describe('EVM Field Generator', () => {
  describe('generateEvmDefaultField', () => {
    it('should generate a number field for small integer types', () => {
      const param = createParam('uint32', 'count');
      const field = generateEvmDefaultField(param);

      expect(field.type).toBe('number');
      expect(field.validation.required).toBe(true);
      expect(field.validation.pattern).toBeUndefined();
    });

    it('should generate a bigint field for uint128', () => {
      const param = createParam('uint128', 'amount');
      const field = generateEvmDefaultField(param);

      expect(field.type).toBe('bigint');
      expect(field.validation.required).toBe(true);
      // BigIntField component handles its own validation and UI guidance
    });

    it('should generate a bigint field for uint256', () => {
      const param = createParam('uint256', 'value');
      const field = generateEvmDefaultField(param);

      expect(field.type).toBe('bigint');
      expect(field.validation.required).toBe(true);
      // BigIntField component handles its own validation and UI guidance
    });

    it('should generate a bigint field for int128', () => {
      const param = createParam('int128', 'delta');
      const field = generateEvmDefaultField(param);

      expect(field.type).toBe('bigint');
      expect(field.validation.required).toBe(true);
      // BigIntField component handles its own validation and UI guidance
    });

    it('should generate a bigint field for int256', () => {
      const param = createParam('int256', 'offset');
      const field = generateEvmDefaultField(param);

      expect(field.type).toBe('bigint');
      expect(field.validation.required).toBe(true);
      // BigIntField component handles its own validation and UI guidance
    });

    it('should preserve parameter description in helper text', () => {
      const param = createParam('uint256', 'tokenId', 'The unique identifier of the NFT');
      const field = generateEvmDefaultField(param);

      expect(field.type).toBe('bigint');
      expect(field.helperText).toBe('The unique identifier of the NFT');
    });

    it('should generate a blockchain-address field for address type', () => {
      const param = createParam('address', 'recipient');
      const field = generateEvmDefaultField(param);

      expect(field.type).toBe('blockchain-address');
      expect(field.validation.required).toBe(true);
      expect(field.validation.pattern).toBeUndefined();
    });

    it('should generate array field with proper element config for uint256[]', () => {
      const param = createParam('uint256[]', 'amounts');
      const field = generateEvmDefaultField(param);

      expect(field.type).toBe('array');
      expect(field.elementFieldConfig).toBeDefined();
      expect(field.elementFieldConfig?.type).toBe('bigint');
      // Integer validation is handled by BigIntField component internally
    });

    it('should include proper field metadata', () => {
      const param = createParam('uint256', 'value');
      const field = generateEvmDefaultField(param);

      expect(field.id).toBeDefined();
      expect(field.name).toBe('value');
      expect(field.label).toBe('Value');
      expect(field.placeholder).toContain('value');
      expect(field.width).toBe('full');
    });
  });
});
