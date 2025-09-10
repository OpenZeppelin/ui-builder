/**
 * Utility functions for Midnight contract artifacts validation and conversion
 */
import type { MidnightContractArtifacts } from '../types/artifacts';
import { isMidnightContractArtifacts } from '../types/artifacts';

/**
 * Validates and converts generic source input to MidnightContractArtifacts
 *
 * @param source - Generic contract source (string address or artifacts object)
 * @returns Validated MidnightContractArtifacts
 * @throws Error if the source is invalid
 */
export function validateAndConvertMidnightArtifacts(
  source: string | Record<string, unknown>
): MidnightContractArtifacts {
  if (typeof source === 'string') {
    throw new Error(
      'Midnight adapter requires contract artifacts object, not just an address string.'
    );
  }

  // Validate that the object has the required structure
  if (!isMidnightContractArtifacts(source)) {
    throw new Error(
      'Invalid contract artifacts provided. Expected an object with contractAddress, privateStateId, and contractSchema properties.'
    );
  }

  return source;
}
