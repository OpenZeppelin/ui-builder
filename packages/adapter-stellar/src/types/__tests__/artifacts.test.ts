/**
 * Unit tests for Stellar contract artifacts types and validation
 */
import { describe, expect, it } from 'vitest';

import { isStellarContractArtifacts, type StellarContractArtifacts } from '../artifacts';

describe('Stellar Contract Artifacts', () => {
  describe('isStellarContractArtifacts', () => {
    it('should return true for valid artifacts with contractAddress', () => {
      const artifacts: StellarContractArtifacts = {
        contractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCYSG7',
      };

      const result = isStellarContractArtifacts(artifacts);

      expect(result).toBe(true);
    });

    it('should return false for null', () => {
      const result = isStellarContractArtifacts(null);
      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      const result = isStellarContractArtifacts(undefined);
      expect(result).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(isStellarContractArtifacts('string')).toBe(false);
      expect(isStellarContractArtifacts(123)).toBe(false);
      expect(isStellarContractArtifacts(true)).toBe(false);
      expect(isStellarContractArtifacts([])).toBe(false);
    });

    it('should return false for object without contractAddress', () => {
      const artifacts = {
        someOtherProperty: 'value',
      };

      const result = isStellarContractArtifacts(artifacts);

      expect(result).toBe(false);
    });

    it('should return false for object with non-string contractAddress', () => {
      const artifacts = {
        contractAddress: 123,
      };

      const result = isStellarContractArtifacts(artifacts);

      expect(result).toBe(false);
    });

    it('should return true even with extra properties', () => {
      const artifacts = {
        contractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCYSG7',
        extraProperty: 'should be ignored',
        anotherExtra: 42,
      };

      const result = isStellarContractArtifacts(artifacts);

      expect(result).toBe(true);
    });

    it('should handle empty contractAddress string', () => {
      const artifacts = {
        contractAddress: '',
      };

      const result = isStellarContractArtifacts(artifacts);

      expect(result).toBe(true); // Type guard only checks type, not validity
    });

    it('should handle contract address starting with C', () => {
      const artifacts = {
        contractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCYSG7',
      };

      const result = isStellarContractArtifacts(artifacts);

      expect(result).toBe(true);
    });
  });
});
