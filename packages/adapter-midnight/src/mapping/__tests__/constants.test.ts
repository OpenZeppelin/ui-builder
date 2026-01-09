import { describe, expect, it } from 'vitest';

import { MIDNIGHT_PRIMITIVE_TYPES } from '../constants';

describe('MIDNIGHT_PRIMITIVE_TYPES constant', () => {
  it('should be an array of strings', () => {
    expect(Array.isArray(MIDNIGHT_PRIMITIVE_TYPES)).toBe(true);
    MIDNIGHT_PRIMITIVE_TYPES.forEach((type) => {
      expect(typeof type).toBe('string');
    });
  });

  it('should contain expected Midnight primitive types', () => {
    expect(MIDNIGHT_PRIMITIVE_TYPES).toContain('bigint');
    expect(MIDNIGHT_PRIMITIVE_TYPES).toContain('number');
    expect(MIDNIGHT_PRIMITIVE_TYPES).toContain('boolean');
    expect(MIDNIGHT_PRIMITIVE_TYPES).toContain('string');
    expect(MIDNIGHT_PRIMITIVE_TYPES).toContain('Uint8Array');
  });

  it('should NOT include dynamic types', () => {
    MIDNIGHT_PRIMITIVE_TYPES.forEach((type) => {
      // Should not include generic type wrappers
      expect(type).not.toMatch(/^Array</);
      expect(type).not.toMatch(/^Maybe</);
      expect(type).not.toMatch(/^Map</);
      expect(type).not.toMatch(/^Vector</);
      expect(type).not.toMatch(/^Opaque</);
    });
  });

  it('should have exactly 5 primitive types', () => {
    // This ensures we're explicit about what's considered a primitive
    expect(MIDNIGHT_PRIMITIVE_TYPES.length).toBe(5);
  });
});
