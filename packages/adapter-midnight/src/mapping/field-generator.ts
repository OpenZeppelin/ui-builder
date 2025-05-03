import type { FunctionParameter } from '@openzeppelin/transaction-form-types/contracts';
import type {
  FieldType,
  FieldValue,
  FormFieldType,
} from '@openzeppelin/transaction-form-types/forms';

/**
 * Generate default field configuration for a Midnight function parameter
 *
 * TODO: Implement proper Midnight field generation in future phases
 */
export function generateMidnightDefaultField<T extends FieldType = FieldType>(
  parameter: FunctionParameter
): FormFieldType<T> {
  // Default to text fields for now
  const fieldType = 'text' as T;

  return {
    id: Math.random().toString(36).substring(2, 11),
    name: parameter.name || 'placeholder',
    label: parameter.displayName || parameter.name || 'Placeholder Field',
    type: fieldType,
    placeholder: 'Placeholder - not implemented yet',
    helperText: 'Midnight adapter is not fully implemented yet',
    defaultValue: '' as FieldValue<T>,
    validation: { required: true },
    width: 'full',
  };
}
