import { startCase } from 'lodash';

import type {
  FieldType,
  FieldValidation,
  FieldValue,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/contracts-ui-builder-types';
import { getDefaultValueForType } from '@openzeppelin/contracts-ui-builder-utils';

import { mapEvmParamTypeToFieldType } from './type-mapper';

/**
 * Get default validation rules for a parameter type.
 * Only includes serializable validation rules - no custom functions.
 */
function getDefaultValidationForType(): FieldValidation {
  return { required: true };
}

/**
 * Generate default field configuration for an EVM function parameter.
 */
export function generateEvmDefaultField<T extends FieldType = FieldType>(
  parameter: FunctionParameter
): FormFieldType<T> {
  const fieldType = mapEvmParamTypeToFieldType(parameter.type) as T;
  const baseField: FormFieldType<T> = {
    id: `field-${Math.random().toString(36).substring(2, 9)}`,
    name: parameter.name || parameter.type, // Use type if name missing
    label: startCase(parameter.displayName || parameter.name || parameter.type),
    type: fieldType,
    placeholder: `Enter ${parameter.displayName || parameter.name || parameter.type}`,
    helperText: parameter.description || '',
    defaultValue: getDefaultValueForType(fieldType) as FieldValue<T>,
    validation: getDefaultValidationForType(),
    width: 'full',
  };

  // Preserve components for object and array-object types
  if (parameter.components && (fieldType === 'object' || fieldType === 'array-object')) {
    const result = {
      ...baseField,
      components: parameter.components,
    };
    return result;
  }

  return baseField;
}
