import { startCase } from 'lodash';

import type {
  FieldType,
  FieldValidation,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/ui-builder-types';
import { getDefaultValueForType, logger } from '@openzeppelin/ui-builder-utils';

import { mapSolanaParamTypeToFieldType } from './type-mapper';

// Placeholder - Needs specific logic
function getDefaultValidationForType(_parameterType: string): FieldValidation {
  return { required: true };
}

// Placeholder
export function generateSolanaDefaultField<T extends FieldType = FieldType>(
  parameter: FunctionParameter
): FormFieldType<T> {
  logger.warn('adapter-solana', 'generateSolanaDefaultField not implemented');
  const fieldType = mapSolanaParamTypeToFieldType(parameter.type) as T;
  return {
    id: `field-${Math.random().toString(36).substring(2, 9)}`,
    name: parameter.name || parameter.type,
    label: startCase(parameter.displayName || parameter.name || parameter.type),
    type: fieldType,
    placeholder: `Enter ${parameter.displayName || parameter.name || parameter.type}`,
    defaultValue: getDefaultValueForType(fieldType),
    validation: getDefaultValidationForType(parameter.type),
    width: 'full',
  };
}
