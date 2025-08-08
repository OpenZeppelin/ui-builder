import type { FieldType } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { SOLANA_TYPE_TO_FIELD_TYPE } from './constants';

// Placeholder
export function mapSolanaParamTypeToFieldType(parameterType: string): FieldType {
  logger.warn('adapter-solana', 'mapSolanaParamTypeToFieldType not implemented');
  return SOLANA_TYPE_TO_FIELD_TYPE[parameterType] || 'text';
}

// Placeholder
export function getSolanaCompatibleFieldTypes(parameterType: string): FieldType[] {
  logger.warn('adapter-solana', 'getSolanaCompatibleFieldTypes not implemented');
  // Allow basic types for now
  if (parameterType === 'publicKey') return ['blockchain-address', 'text'];
  if (parameterType.startsWith('u') || parameterType.startsWith('i')) return ['number', 'text'];
  return ['text', 'textarea'];
}
