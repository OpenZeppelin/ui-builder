/**
 * Unit tests for Solana contract artifacts types and validation
 */
import { describe, expect, it } from 'vitest';

import { isSolanaContractArtifacts, type SolanaContractArtifacts } from '../artifacts';

describe('Solana Contract Artifacts', () => {
  describe('isSolanaContractArtifacts', () => {
    it('should return true for valid artifacts with only contractAddress', () => {
      const artifacts: SolanaContractArtifacts = {
        contractAddress: '11111111111111111111111111111112',
      };

      const result = isSolanaContractArtifacts(artifacts);

      expect(result).toBe(true);
    });

    it('should return true for valid artifacts with contractAddress and idl', () => {
      const artifacts: SolanaContractArtifacts = {
        contractAddress: '11111111111111111111111111111112',
        idl: '{"version":"0.1.0","name":"test","instructions":[]}',
      };

      const result = isSolanaContractArtifacts(artifacts);

      expect(result).toBe(true);
    });

    it('should return false for null', () => {
      const result = isSolanaContractArtifacts(null);
      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      const result = isSolanaContractArtifacts(undefined);
      expect(result).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(isSolanaContractArtifacts('string')).toBe(false);
      expect(isSolanaContractArtifacts(123)).toBe(false);
      expect(isSolanaContractArtifacts(true)).toBe(false);
      expect(isSolanaContractArtifacts([])).toBe(false);
    });

    it('should return false for object without contractAddress', () => {
      const artifacts = {
        idl: '{"version":"0.1.0","name":"test","instructions":[]}',
      };

      const result = isSolanaContractArtifacts(artifacts);

      expect(result).toBe(false);
    });

    it('should return false for object with non-string contractAddress', () => {
      const artifacts = {
        contractAddress: 123,
      };

      const result = isSolanaContractArtifacts(artifacts);

      expect(result).toBe(false);
    });

    it('should return true even with extra properties', () => {
      const artifacts = {
        contractAddress: '11111111111111111111111111111112',
        extraProperty: 'should be ignored',
        someNumber: 42,
      };

      const result = isSolanaContractArtifacts(artifacts);

      expect(result).toBe(true);
    });

    it('should handle empty contractAddress string', () => {
      const artifacts = {
        contractAddress: '',
      };

      const result = isSolanaContractArtifacts(artifacts);

      expect(result).toBe(true); // Type guard only checks type, not validity
    });

    it('should handle Solana program ID format', () => {
      const artifacts = {
        contractAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      };

      const result = isSolanaContractArtifacts(artifacts);

      expect(result).toBe(true);
    });

    it('should handle idl as optional string', () => {
      const artifacts = {
        contractAddress: '11111111111111111111111111111112',
        idl: '', // Empty string is still valid
      };

      const result = isSolanaContractArtifacts(artifacts);

      expect(result).toBe(true);
    });
  });
});
