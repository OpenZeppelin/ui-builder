/**
 * Unit tests for Stellar contract artifacts utility functions
 */
import { describe, expect, it } from 'vitest';

import { validateAndConvertStellarArtifacts } from '../artifacts';

describe('validateAndConvertStellarArtifacts', () => {
  it('should convert string address to artifacts object', () => {
    const address = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCYSG7';

    const result = validateAndConvertStellarArtifacts(address);

    expect(result).toEqual({
      contractAddress: address,
    });
  });

  it('should return valid artifacts object as-is', () => {
    const artifacts = {
      contractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCYSG7',
    };

    const result = validateAndConvertStellarArtifacts(artifacts);

    expect(result).toBe(artifacts);
  });

  it('should throw error for invalid artifacts object', () => {
    const invalidArtifacts = {
      someOtherProperty: 'value',
    };

    expect(() => validateAndConvertStellarArtifacts(invalidArtifacts)).toThrow(
      'Invalid contract artifacts provided. Expected an object with contractAddress property.'
    );
  });

  it('should throw error for artifacts with non-string contractAddress', () => {
    const invalidArtifacts = {
      contractAddress: 123,
    };

    expect(() => validateAndConvertStellarArtifacts(invalidArtifacts)).toThrow(
      'Invalid contract artifacts provided. Expected an object with contractAddress property.'
    );
  });

  it('should accept artifacts with extra properties', () => {
    const artifacts = {
      contractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCYSG7',
      extraProperty: 'should be ignored',
    };

    const result = validateAndConvertStellarArtifacts(artifacts);

    expect(result).toEqual(artifacts);
  });

  it('should handle empty string address', () => {
    const result = validateAndConvertStellarArtifacts('');

    expect(result).toEqual({
      contractAddress: '',
    });
  });

  it('should handle contract address starting with C', () => {
    const address = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCYSG7';

    const result = validateAndConvertStellarArtifacts(address);

    expect(result).toEqual({
      contractAddress: address,
    });
  });
});
