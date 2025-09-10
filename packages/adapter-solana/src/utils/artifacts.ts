/**
 * Utility functions for Solana contract artifacts validation and conversion
 */
import type { SolanaContractArtifacts } from '../types/artifacts';
import { isSolanaContractArtifacts } from '../types/artifacts';

/**
 * Validates and converts generic source input to SolanaContractArtifacts
 *
 * @param source - Generic contract source (string address or artifacts object)
 * @returns Validated SolanaContractArtifacts
 * @throws Error if the source is invalid
 */
export function validateAndConvertSolanaArtifacts(
  source: string | Record<string, unknown>
): SolanaContractArtifacts {
  if (typeof source === 'string') {
    // If source is a string, assume it's a contract address
    return { contractAddress: source };
  }

  // Validate that the object has the required structure
  if (!isSolanaContractArtifacts(source)) {
    throw new Error(
      'Invalid contract artifacts provided. Expected an object with contractAddress property.'
    );
  }

  return source;
}
