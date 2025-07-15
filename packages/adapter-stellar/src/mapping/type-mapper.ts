import type { FieldType } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Map a Stellar-specific parameter type to a form field type
 *
 * TODO: Implement proper Stellar type mapping in future phases
 */
export function mapStellarParameterTypeToFieldType(_parameterType: string): FieldType {
  // Placeholder implementation that defaults everything to text fields
  return 'text';
}

/**
 * Get field types compatible with a specific parameter type
 * @param _parameterType The blockchain parameter type
 * @returns Array of compatible field types
 *
 * TODO: Implement proper Stellar field type compatibility in future phases
 */
export function getStellarCompatibleFieldTypes(_parameterType: string): FieldType[] {
  // Placeholder implementation that returns all field types
  return [
    'text',
    'number',
    'checkbox',
    'radio',
    'select',
    'textarea',
    'date',
    'email',
    'password',
    'blockchain-address',
    'amount',
    'hidden',
  ];
}
