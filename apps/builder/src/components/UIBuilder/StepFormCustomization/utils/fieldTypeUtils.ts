import { capitalize } from 'lodash';

import type { ContractAdapter } from '@openzeppelin/ui-types';
import { FieldType } from '@openzeppelin/ui-types';

/**
 * Field type option with display label
 */
export interface FieldTypeOption {
  value: FieldType;
  label: string;
  disabled?: boolean;
}

/**
 * Option group structure for select fields
 */
export interface OptionGroup {
  label: string;
  options: FieldTypeOption[];
}

/**
 * Map field types to human-readable labels
 */
export function getFieldTypeLabel(type: FieldType): string {
  const labelMap: Record<string, string> = {
    text: 'Text Input',
    textarea: 'Text Area',
    bytes: 'Bytes Input (Hex/Base64)',
    email: 'Email Input',
    password: 'Password Input',
    number: 'Number Input',
    bigint: 'Big Integer',
    amount: 'Token Amount',
    select: 'Dropdown Select',
    radio: 'Radio Buttons',
    checkbox: 'Checkbox',
    'blockchain-address': 'Blockchain Address',
    enum: 'Enum Field',
    map: 'Map Field (Key-Value Pairs)',
  };

  return labelMap[type] || capitalize(type);
}

/**
 * Get field type details with label
 */
export function getFieldTypeOption(type: FieldType, disabled = false): FieldTypeOption {
  return {
    value: type,
    label: getFieldTypeLabel(type),
    disabled,
  };
}

/**
 * Default field types when no adapter is available
 */
const DEFAULT_FIELD_TYPES: FieldType[] = [
  'text',
  'number',
  'bigint',
  'checkbox',
  'radio',
  'select',
  'textarea',
  'bytes',
  'email',
  'password',
  'blockchain-address',
  'amount',
  'enum',
];

/**
 * Get a label for a field type category
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    text: 'Text Inputs',
    numeric: 'Numeric Inputs',
    selection: 'Selection Inputs',
    blockchain: 'Blockchain Specific',
  };

  return labels[category] || category;
}

/**
 * Check if a field should display the "Field Type" dropdown selector
 * Some field types (like runtime secrets) have a fixed type and don't need selection
 */
export function shouldShowFieldTypeSelector(fieldType?: string): boolean {
  // Runtime secret fields have a fixed type - no need for dropdown
  if (fieldType === 'runtimeSecret') {
    return false;
  }

  // All other field types can be converted/customized
  return true;
}

/**
 * Generate field type groups based on adapter and parameter type
 */
export function getFieldTypeGroups(
  adapter?: ContractAdapter,
  originalParameterType?: string
): OptionGroup[] {
  // Get compatible field types
  const compatibleTypes =
    adapter && originalParameterType
      ? adapter.getCompatibleFieldTypes(originalParameterType)
      : DEFAULT_FIELD_TYPES;

  const recommendedType = compatibleTypes[0];
  const recommendedOption = getFieldTypeOption(recommendedType, false);

  // Define field type categories
  const fieldTypeCategories: Record<string, FieldType[]> = {
    text: ['text', 'textarea', 'bytes', 'email', 'password'],
    numeric: ['number', 'bigint', 'amount'],
    selection: ['select', 'radio', 'checkbox', 'enum'],
    blockchain: ['blockchain-address'],
  };

  // Create the field type groups
  const groups = [
    {
      label: 'Recommended',
      options: [recommendedOption],
    },
    ...Object.entries(fieldTypeCategories).map(([category, types]) => ({
      label: getCategoryLabel(category),
      options: types
        .filter((type) => type !== recommendedType)
        .map((type) =>
          getFieldTypeOption(type as FieldType, !compatibleTypes.includes(type as FieldType))
        ),
    })),
  ];

  // Remove empty groups
  return groups.filter((group) => group.label === 'Recommended' || group.options.length > 0);
}
