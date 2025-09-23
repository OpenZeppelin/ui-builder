import type { FunctionParameter } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

// Placeholder
export function parseSolanaInput(
  _param: FunctionParameter,
  rawValue: unknown,
  _isRecursive = false
): unknown {
  logger.warn('adapter-solana', 'parseSolanaInput not implemented');
  return rawValue; // Passthrough for now
}
