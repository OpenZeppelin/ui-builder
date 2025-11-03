import { describe, expect, test } from 'vitest';

import { addressesEqual, normalizeAddress } from '../addressNormalization';

describe('normalizeAddress', () => {
  test('trims whitespace and converts to lowercase', () => {
    expect(normalizeAddress('  0xABC123  ')).toBe('0xabc123');
    expect(normalizeAddress('0xDEF456')).toBe('0xdef456');
    expect(normalizeAddress('  MIDNIGHT_ADDRESS  ')).toBe('midnight_address');
  });

  test('handles null input', () => {
    expect(normalizeAddress(null)).toBe('');
  });

  test('handles undefined input', () => {
    expect(normalizeAddress(undefined)).toBe('');
  });

  test('handles empty string', () => {
    expect(normalizeAddress('')).toBe('');
    expect(normalizeAddress('   ')).toBe('');
  });

  test('preserves valid lowercase addresses', () => {
    expect(normalizeAddress('0xabc123')).toBe('0xabc123');
  });

  test('handles addresses with mixed case', () => {
    expect(normalizeAddress('0xAbC123')).toBe('0xabc123');
    expect(normalizeAddress('0XABC123')).toBe('0xabc123');
  });

  test('normalizes Midnight addresses', () => {
    expect(
      normalizeAddress('  020000d9cfd7ee1f3932a13d39e81b8445e90e0f1c5c18112e64af45564c5d150ecc  ')
    ).toBe('020000d9cfd7ee1f3932a13d39e81b8445e90e0f1c5c18112e64af45564c5d150ecc');
  });
});

describe('addressesEqual', () => {
  test('returns true for addresses that normalize to the same value', () => {
    expect(addressesEqual('  0xABC  ', '0xabc')).toBe(true);
    expect(addressesEqual('0xDEF', '  0xdef  ')).toBe(true);
    expect(addressesEqual('  MIDNIGHT  ', 'midnight')).toBe(true);
  });

  test('returns false for different addresses', () => {
    expect(addressesEqual('0xABC', '0xDEF')).toBe(false);
    expect(addressesEqual('0x123', '0x456')).toBe(false);
  });

  test('treats null and empty string as equal', () => {
    expect(addressesEqual(null, '')).toBe(true);
    expect(addressesEqual(undefined, '')).toBe(true);
    expect(addressesEqual(null, undefined)).toBe(true);
    expect(addressesEqual('   ', '')).toBe(true);
  });

  test('handles case-insensitive comparison', () => {
    expect(addressesEqual('0xABC', '0xabc')).toBe(true);
    expect(addressesEqual('0XABC', '0xabc')).toBe(true);
  });

  test('handles whitespace-insensitive comparison', () => {
    expect(addressesEqual('  0xabc  ', '0xabc')).toBe(true);
    expect(addressesEqual('0xabc', '  0xabc  ')).toBe(true);
  });

  test('handles both null/undefined inputs', () => {
    expect(addressesEqual(null, null)).toBe(true);
    expect(addressesEqual(undefined, undefined)).toBe(true);
    expect(addressesEqual(null, undefined)).toBe(true);
  });

  test('real-world Midnight address comparison', () => {
    const address1 = '  020000d9cfd7ee1f3932a13d39e81b8445e90e0f1c5c18112e64af45564c5d150ecc  ';
    const address2 = '020000d9cfd7ee1f3932a13d39e81b8445e90e0f1c5c18112e64af45564c5d150ecc';
    const address3 = '020000D9CFD7EE1F3932A13D39E81B8445E90E0F1C5C18112E64AF45564C5D150ECC';

    expect(addressesEqual(address1, address2)).toBe(true);
    expect(addressesEqual(address1, address3)).toBe(true);
    expect(addressesEqual(address2, address3)).toBe(true);
  });
});

