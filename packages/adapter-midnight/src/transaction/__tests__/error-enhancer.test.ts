import { describe, expect, it } from 'vitest';

import { enhanceMidnightError, formatEnhancedError } from '../error-enhancer';

describe('enhanceMidnightError', () => {
  describe('Vector size mismatch errors', () => {
    it('should detect and enhance Vector size mismatch (too few items)', () => {
      const error = new Error(
        'Circuit call failed: type error: ownerSetProfile argument 3 (smallNums) expected value of type Vector<3, Uint<0..18446744073709551615>> but received [ 45345354n, 35345345n ]'
      );

      const enhanced = enhanceMidnightError(error, 'ownerSetProfile');

      expect(enhanced.category).toBe('type_mismatch');
      expect(enhanced.userMessage).toContain('Invalid array size');
      expect(enhanced.userMessage).toContain('Expected exactly 3 items');
      expect(enhanced.userMessage).toContain('received 2');
      expect(enhanced.suggestions).toBeDefined();
      expect(enhanced.suggestions).toHaveLength(3);
      expect(enhanced.suggestions?.[0]).toContain('exactly 3 elements');
      expect(enhanced.suggestions?.[1]).toContain('Add 1 more item');
    });

    it('should detect and enhance Vector size mismatch (too many items)', () => {
      const error = new Error(
        'type error: expected value of type Vector<3, string> but received [ "a", "b", "c", "d", "e" ]'
      );

      const enhanced = enhanceMidnightError(error);

      expect(enhanced.category).toBe('type_mismatch');
      expect(enhanced.userMessage).toContain('Expected exactly 3 items');
      expect(enhanced.userMessage).toContain('received 5');
      expect(enhanced.suggestions?.[1]).toContain('Remove 2 item');
    });

    it('should handle Vector with complex element types', () => {
      const error = new Error(
        'expected value of type Vector<10, Maybe<Opaque<"string">>> but received [ { is_some: true, value: "a" }, { is_some: true, value: "b" }, { is_some: true, value: "c" } ]'
      );

      const enhanced = enhanceMidnightError(error, 'setTags');

      expect(enhanced.category).toBe('type_mismatch');
      expect(enhanced.userMessage).toContain('Expected exactly 10 items');
      expect(enhanced.userMessage).toContain('received 3');
      expect(enhanced.suggestions?.[0]).toContain('Maybe<Opaque<"string">>');
    });

    it('should handle empty received array', () => {
      const error = new Error('expected value of type Vector<5, number> but received [ ]');

      const enhanced = enhanceMidnightError(error);

      expect(enhanced.category).toBe('type_mismatch');
      expect(enhanced.userMessage).toContain('Expected exactly 5 items');
      expect(enhanced.userMessage).toContain('received 0');
      expect(enhanced.suggestions?.[1]).toContain('Add 5 more item');
    });
  });

  describe('Maybe type errors', () => {
    it('should detect and enhance Maybe type mismatch', () => {
      const error = new Error(
        'expected value of type struct Maybe<is_some: Boolean, value: Opaque<"string">> but received \'asdasda sdasdasd\''
      );

      const enhanced = enhanceMidnightError(error, 'setDescription');

      expect(enhanced.category).toBe('type_mismatch');
      expect(enhanced.userMessage).toContain('Invalid optional value format');
      expect(enhanced.userMessage).toContain('setDescription');
      expect(enhanced.suggestions).toBeDefined();
      expect(enhanced.suggestions?.[0]).toContain('leave it empty');
    });

    it('should handle Maybe without struct prefix', () => {
      const error = new Error('expected value of type Maybe<number> but received "not a number"');

      const enhanced = enhanceMidnightError(error);

      expect(enhanced.category).toBe('type_mismatch');
      expect(enhanced.userMessage).toContain('Invalid optional value format');
      expect(enhanced.userMessage).toContain('number');
    });
  });

  describe('General type mismatch errors', () => {
    it('should detect and enhance general type mismatches', () => {
      const error = new Error('expected value of type bigint but received string');

      const enhanced = enhanceMidnightError(error, 'setValue');

      expect(enhanced.category).toBe('type_mismatch');
      expect(enhanced.userMessage).toContain('Type mismatch');
      expect(enhanced.userMessage).toContain('Expected bigint');
      expect(enhanced.userMessage).toContain('received string');
      expect(enhanced.suggestions).toBeDefined();
    });

    it('should handle complex generic types', () => {
      const error = new Error(
        'expected value of type Map<string, Array<number>> but received null'
      );

      const enhanced = enhanceMidnightError(error);

      expect(enhanced.category).toBe('type_mismatch');
      expect(enhanced.userMessage).toContain('Map<string, Array<number>>');
    });
  });

  describe('Private state errors', () => {
    it('should detect and enhance private state errors', () => {
      const error = new Error('No private state found at private state ID');

      const enhanced = enhanceMidnightError(error, 'organizerOnlyFunction');

      expect(enhanced.category).toBe('state');
      expect(enhanced.userMessage).toContain('Private state not initialized');
      expect(enhanced.userMessage).toContain('organizerOnlyFunction');
      expect(enhanced.suggestions).toBeDefined();
      expect(enhanced.suggestions?.[0]).toContain('organizer secret key');
    });

    it('should detect organizer secret key errors', () => {
      const error = new Error('organizer secret key missing');

      const enhanced = enhanceMidnightError(error);

      expect(enhanced.category).toBe('state');
      expect(enhanced.userMessage).toContain('Private state not initialized');
    });
  });

  describe('Proof generation errors', () => {
    it('should detect and enhance proof errors', () => {
      const error = new Error('zkSnark proof generation failed');

      const enhanced = enhanceMidnightError(error, 'complexCircuit');

      expect(enhanced.category).toBe('proof');
      expect(enhanced.userMessage).toContain('Proof generation failed');
      expect(enhanced.suggestions?.[0]).toContain('ZK artifacts');
    });

    it('should detect prover errors', () => {
      const error = new Error('Prover server timeout');

      const enhanced = enhanceMidnightError(error);

      expect(enhanced.category).toBe('proof');
      expect(enhanced.userMessage).toContain('Proof generation failed');
    });
  });

  describe('Network errors', () => {
    it('should detect and enhance network errors', () => {
      const error = new Error('Network connection timeout');

      const enhanced = enhanceMidnightError(error, 'submitTransaction');

      expect(enhanced.category).toBe('network');
      expect(enhanced.userMessage).toContain('Network error');
      expect(enhanced.suggestions?.[0]).toContain('internet connection');
    });
  });

  describe('Unknown errors', () => {
    it('should handle unknown error types gracefully', () => {
      const error = new Error('Some random error message');

      const enhanced = enhanceMidnightError(error, 'someFunction');

      expect(enhanced.category).toBe('unknown');
      expect(enhanced.userMessage).toContain('Transaction failed');
      expect(enhanced.userMessage).toContain('someFunction');
      expect(enhanced.originalMessage).toBe('Some random error message');
    });

    it('should handle non-Error objects', () => {
      const error = 'plain string error';

      const enhanced = enhanceMidnightError(error);

      expect(enhanced.category).toBe('unknown');
      expect(enhanced.originalMessage).toBe('plain string error');
    });
  });

  describe('Function name context', () => {
    it('should include function name when provided', () => {
      const error = new Error('Something went wrong');

      const enhanced = enhanceMidnightError(error, 'myFunction');

      expect(enhanced.userMessage).toContain('myFunction');
    });

    it('should work without function name', () => {
      const error = new Error('Something went wrong');

      const enhanced = enhanceMidnightError(error);

      expect(enhanced.userMessage).not.toContain('in function');
    });
  });
});

describe('formatEnhancedError', () => {
  it('should format error with suggestions', () => {
    const enhanced = enhanceMidnightError(
      new Error('expected value of type Vector<3, number> but received [ 1, 2, 3, 4, 5 ]'),
      'testFunction'
    );

    const formatted = formatEnhancedError(enhanced);

    expect(formatted).toContain('Invalid array size');
    expect(formatted).toContain('Suggestions:');
    expect(formatted).toContain('1. ');
    expect(formatted).toContain('2. ');
    expect(formatted).toContain('3. ');
  });

  it('should format error without suggestions', () => {
    const enhanced = {
      originalMessage: 'Original error',
      userMessage: 'User friendly error',
      category: 'unknown' as const,
    };

    const formatted = formatEnhancedError(enhanced);

    expect(formatted).toBe('User friendly error');
    expect(formatted).not.toContain('Suggestions:');
  });

  it('should format error with empty suggestions array', () => {
    const enhanced = {
      originalMessage: 'Original error',
      userMessage: 'User friendly error',
      suggestions: [],
      category: 'unknown' as const,
    };

    const formatted = formatEnhancedError(enhanced);

    expect(formatted).toBe('User friendly error');
    expect(formatted).not.toContain('Suggestions:');
  });
});
