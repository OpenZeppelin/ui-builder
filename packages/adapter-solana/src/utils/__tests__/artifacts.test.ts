/**
 * Unit tests for Solana contract artifacts utility functions
 */
import { describe, expect, it } from 'vitest';

import { validateAndConvertSolanaArtifacts } from '../artifacts';

describe('validateAndConvertSolanaArtifacts', () => {
  it('should convert string address to artifacts object', () => {
    const address = '11111111111111111111111111111112';

    const result = validateAndConvertSolanaArtifacts(address);

    expect(result).toEqual({
      contractAddress: address,
    });
  });

  it('should return valid artifacts object as-is', () => {
    const artifacts = {
      contractAddress: '11111111111111111111111111111112',
      idl: '{"version":"0.1.0","name":"test","instructions":[]}',
    };

    const result = validateAndConvertSolanaArtifacts(artifacts);

    expect(result).toBe(artifacts);
  });

  it('should return artifacts with only contractAddress', () => {
    const artifacts = {
      contractAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    };

    const result = validateAndConvertSolanaArtifacts(artifacts);

    expect(result).toBe(artifacts);
  });

  it('should throw error for invalid artifacts object', () => {
    const invalidArtifacts = {
      idl: '{"version":"0.1.0","name":"test","instructions":[]}',
    };

    expect(() => validateAndConvertSolanaArtifacts(invalidArtifacts)).toThrow(
      'Invalid contract artifacts provided. Expected an object with contractAddress property.'
    );
  });

  it('should throw error for artifacts with non-string contractAddress', () => {
    const invalidArtifacts = {
      contractAddress: 123,
    };

    expect(() => validateAndConvertSolanaArtifacts(invalidArtifacts)).toThrow(
      'Invalid contract artifacts provided. Expected an object with contractAddress property.'
    );
  });

  it('should accept artifacts with extra properties', () => {
    const artifacts = {
      contractAddress: '11111111111111111111111111111112',
      extraProperty: 'should be ignored',
    };

    const result = validateAndConvertSolanaArtifacts(artifacts);

    expect(result).toEqual(artifacts);
  });

  it('should handle empty string address', () => {
    const result = validateAndConvertSolanaArtifacts('');

    expect(result).toEqual({
      contractAddress: '',
    });
  });

  it('should handle Solana program ID format', () => {
    const address = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

    const result = validateAndConvertSolanaArtifacts(address);

    expect(result).toEqual({
      contractAddress: address,
    });
  });
});
