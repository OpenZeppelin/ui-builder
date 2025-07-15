import type { FunctionParameter } from '@openzeppelin/contracts-ui-builder-types';

// Placeholder
export function parseSolanaInput(
  _param: FunctionParameter,
  rawValue: unknown,
  _isRecursive = false
): unknown {
  console.warn('parseSolanaInput not implemented');
  return rawValue; // Passthrough for now
}
