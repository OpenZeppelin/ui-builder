/**
 * Utility functions for EVM contract artifacts validation and conversion
 */
import type { EvmContractArtifacts } from '../types/artifacts';
import { isEvmContractArtifacts } from '../types/artifacts';

/**
 * Validates and converts generic source input to EvmContractArtifacts
 *
 * @param source - Generic contract source (string address or artifacts object)
 * @returns Validated EvmContractArtifacts
 * @throws Error if the source is invalid
 */
export function validateAndConvertEvmArtifacts(
  source: string | Record<string, unknown>
): EvmContractArtifacts {
  if (typeof source === 'string') {
    // If source is a string, assume it's a contract address
    return { contractAddress: source };
  }

  // Validate that the object has the required structure
  if (!isEvmContractArtifacts(source)) {
    throw new Error(
      'Invalid contract artifacts provided. Expected an object with contractAddress property.'
    );
  }

  return source;
}
