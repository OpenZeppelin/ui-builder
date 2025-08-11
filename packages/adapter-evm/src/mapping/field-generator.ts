import { startCase } from 'lodash';

import type {
  FieldType,
  FieldValidation,
  FieldValue,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/contracts-ui-builder-types';
import { getDefaultValueForType } from '@openzeppelin/contracts-ui-builder-utils';

import { isValidEvmAddress } from '../utils';
import { mapEvmParamTypeToFieldType } from './type-mapper';

/**
 * Get default validation rules for a parameter type
 */
function getDefaultValidationForType(parameterType: string): FieldValidation {
  const validation: FieldValidation = { required: true };

  // Add specific validation rules based on the parameter type
  if (parameterType === 'blockchain-address') {
    return {
      ...validation,
      // Use the imported isValidEvmAddress method for direct validation
      // NOTE: FieldValidation type doesn't officially support `custom`. This relies
      // on React Hook Form's `validate` prop potentially picking this up downstream.
      // Consider alternative validation approaches if this proves problematic.
      custom: (value: unknown): boolean | string => {
        if (value === '') return true; // Empty values handled by required
        if (typeof value !== 'string') return 'Address must be a string';
        return isValidEvmAddress(value) ? true : 'Invalid address format';
      },
    } as FieldValidation & { custom?: (value: unknown) => boolean | string }; // Cast to include custom
  }

  return validation;
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
    validation: getDefaultValidationForType(parameter.type),
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
