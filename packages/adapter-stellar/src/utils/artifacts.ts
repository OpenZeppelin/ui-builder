/**
 * Utility functions for Stellar contract artifacts validation and conversion
 */
import type { StellarContractArtifacts } from '../types/artifacts';
import { isStellarContractArtifacts } from '../types/artifacts';

/**
 * Validates and converts generic source input to StellarContractArtifacts
 *
 * @param source - Generic contract source (string address or artifacts object)
 * @returns Validated StellarContractArtifacts
 * @throws Error if the source is invalid
 */
export function validateAndConvertStellarArtifacts(
  source: string | Record<string, unknown>
): StellarContractArtifacts {
  if (typeof source === 'string') {
    // If source is a string, assume it's a contract address
    return { contractAddress: source };
  }

  // Validate that the object has the required structure
  if (!isStellarContractArtifacts(source)) {
    throw new Error(
      'Invalid contract artifacts provided. Expected an object with contractAddress property.'
    );
  }

  return source;
}
