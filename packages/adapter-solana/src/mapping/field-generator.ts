import { startCase } from 'lodash';

import type {
  FieldType,
  FieldValidation,
  FieldValue,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/transaction-form-types';

import { mapSolanaParamTypeToFieldType } from './type-mapper';

// Placeholder - Needs specific logic
function getDefaultValueForType<T extends FieldType>(fieldType: T): FieldValue<T> {
  // Return a default value compatible with most basic types (string/number/bool etc.)
  // Specific adapters might refine this.
  switch (fieldType) {
    case 'checkbox':
      return false as FieldValue<T>;
    case 'number':
      return 0 as FieldValue<T>;
    default:
      return '' as FieldValue<T>;
  }
}

// Placeholder - Needs specific logic
function getDefaultValidationForType(_parameterType: string): FieldValidation {
  return { required: true };
}

// Placeholder
export function generateSolanaDefaultField<T extends FieldType = FieldType>(
  parameter: FunctionParameter
): FormFieldType<T> {
  console.warn('generateSolanaDefaultField not implemented');
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
