/**
 * Unit tests for EVM contract artifacts types and validation
 */
import { describe, expect, it } from 'vitest';

import { isEvmContractArtifacts, type EvmContractArtifacts } from '../artifacts';

describe('EVM Contract Artifacts', () => {
  describe('isEvmContractArtifacts', () => {
    it('should return true for valid artifacts with only contractAddress', () => {
      const artifacts = {
        contractAddress: '0x1234567890123456789012345678901234567890',
      };

      const result = isEvmContractArtifacts(artifacts);

      expect(result).toBe(true);
    });

    it('should return true for valid artifacts with all optional properties', () => {
      const artifacts: EvmContractArtifacts = {
        contractAddress: '0x1234567890123456789012345678901234567890',
        contractDefinition: '[{"type":"function","name":"test"}]',
        __proxyDetectionOptions: {
          skipProxyDetection: true,
        },
      };

      const result = isEvmContractArtifacts(artifacts);

      expect(result).toBe(true);
    });

    it('should return false for null', () => {
      const result = isEvmContractArtifacts(null);
      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      const result = isEvmContractArtifacts(undefined);
      expect(result).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(isEvmContractArtifacts('string')).toBe(false);
      expect(isEvmContractArtifacts(123)).toBe(false);
      expect(isEvmContractArtifacts(true)).toBe(false);
      expect(isEvmContractArtifacts([])).toBe(false);
    });

    it('should return false for object without contractAddress', () => {
      const artifacts = {
        contractDefinition: '[{"type":"function","name":"test"}]',
      };

      const result = isEvmContractArtifacts(artifacts);

      expect(result).toBe(false);
    });

    it('should return false for object with non-string contractAddress', () => {
      const artifacts = {
        contractAddress: 123,
      };

      const result = isEvmContractArtifacts(artifacts);

      expect(result).toBe(false);
    });

    it('should return true even with extra properties', () => {
      const artifacts = {
        contractAddress: '0x1234567890123456789012345678901234567890',
        extraProperty: 'should be ignored',
      };

      const result = isEvmContractArtifacts(artifacts);

      expect(result).toBe(true);
    });

    it('should handle empty contractAddress string', () => {
      const artifacts = {
        contractAddress: '',
      };

      const result = isEvmContractArtifacts(artifacts);

      expect(result).toBe(true); // Type guard only checks type, not validity
    });

    it('should handle proxy detection options correctly', () => {
      const artifacts = {
        contractAddress: '0x1234567890123456789012345678901234567890',
        __proxyDetectionOptions: {
          skipProxyDetection: false,
        },
      };

      const result = isEvmContractArtifacts(artifacts);

      expect(result).toBe(true);
    });
  });
});
