import type { FunctionParameter } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

// Placeholder
export function parseSolanaInput(
  _param: FunctionParameter,
  rawValue: unknown,
  _isRecursive = false
): unknown {
  logger.warn('adapter-solana', 'parseSolanaInput not implemented');
  return rawValue; // Passthrough for now
}
