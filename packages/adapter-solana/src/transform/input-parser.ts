import type { FunctionParameter } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

// Placeholder
export function parseSolanaInput(
  _param: FunctionParameter,
  rawValue: unknown,
  _isRecursive = false
): unknown {
  logger.warn('adapter-solana', 'parseSolanaInput not implemented');
  return rawValue; // Passthrough for now
}
