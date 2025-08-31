import { capitalize } from 'lodash';

import type { ContractAdapter } from '@openzeppelin/contracts-ui-builder-types';
import { FieldType } from '@openzeppelin/contracts-ui-builder-types';

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
    email: 'Email Input',
    password: 'Password Input',
    number: 'Number Input',
    amount: 'Token Amount',
    select: 'Dropdown Select',
    radio: 'Radio Buttons',
    checkbox: 'Checkbox',
    'blockchain-address': 'Blockchain Address',
    enum: 'Enum Field',
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
  'checkbox',
  'radio',
  'select',
  'textarea',
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
    text: ['text', 'textarea', 'email', 'password'],
    numeric: ['number', 'amount'],
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
