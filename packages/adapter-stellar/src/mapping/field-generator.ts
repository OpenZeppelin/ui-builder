import type {
  FieldType,
  FieldValue,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/contracts-ui-builder-types';

/**
 * Generate default field configuration for a Stellar function parameter
 *
 * TODO: Implement proper Stellar field generation in future phases
 */
export function generateStellarDefaultField<T extends FieldType = FieldType>(
  parameter: FunctionParameter
): FormFieldType<T> {
  // Default to text fields for now as a placeholder
  const fieldType = 'text' as T;

  return {
    id: Math.random().toString(36).substring(2, 11),
    name: parameter.name || 'placeholder',
    label: parameter.displayName || parameter.name || 'Placeholder Field',
    type: fieldType,
    placeholder: 'Placeholder - Stellar adapter not fully implemented yet',
    helperText: 'Stellar adapter is not fully implemented yet',
    defaultValue: '' as FieldValue<T>,
    validation: { required: true },
    width: 'full',
  };
}
