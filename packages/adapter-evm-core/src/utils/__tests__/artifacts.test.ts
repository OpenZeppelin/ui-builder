/**
 * Unit tests for EVM contract artifacts utility functions
 */
import { describe, expect, it } from 'vitest';

import { validateAndConvertEvmArtifacts } from '../artifacts';

describe('validateAndConvertEvmArtifacts', () => {
  it('should convert string address to artifacts object', () => {
    const address = '0x1234567890123456789012345678901234567890';

    const result = validateAndConvertEvmArtifacts(address);

    expect(result).toEqual({
      contractAddress: address,
    });
  });

  it('should return valid artifacts object as-is', () => {
    const artifacts = {
      contractAddress: '0x1234567890123456789012345678901234567890',
      contractDefinition: '[{"type":"function","name":"test"}]',
    };

    const result = validateAndConvertEvmArtifacts(artifacts);

    expect(result).toBe(artifacts);
  });

  it('should return artifacts with proxy detection options', () => {
    const artifacts = {
      contractAddress: '0x1234567890123456789012345678901234567890',
      __proxyDetectionOptions: {
        skipProxyDetection: true,
      },
    };

    const result = validateAndConvertEvmArtifacts(artifacts);

    expect(result).toBe(artifacts);
  });

  it('should throw error for invalid artifacts object', () => {
    const invalidArtifacts = {
      someOtherProperty: 'value',
    };

    expect(() => validateAndConvertEvmArtifacts(invalidArtifacts)).toThrow(
      'Invalid contract artifacts provided. Expected an object with contractAddress property.'
    );
  });

  it('should throw error for artifacts with non-string contractAddress', () => {
    const invalidArtifacts = {
      contractAddress: 123,
    };

    expect(() => validateAndConvertEvmArtifacts(invalidArtifacts)).toThrow(
      'Invalid contract artifacts provided. Expected an object with contractAddress property.'
    );
  });

  it('should accept artifacts with extra properties', () => {
    const artifacts = {
      contractAddress: '0x1234567890123456789012345678901234567890',
      extraProperty: 'should be ignored',
    };

    const result = validateAndConvertEvmArtifacts(artifacts);

    expect(result).toEqual(artifacts);
  });

  it('should handle empty string address', () => {
    const result = validateAndConvertEvmArtifacts('');

    expect(result).toEqual({
      contractAddress: '',
    });
  });
});
