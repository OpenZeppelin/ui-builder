import { v4 as uuidv4 } from 'uuid';

import type { FieldType } from '@openzeppelin/transaction-form-renderer';

import type { BuilderFormConfig } from '../../core/types/FormTypes';

/**
 * Create a minimal form configuration for testing
 * @param functionName - Optional function name (defaults to 'testFunction')
 * @param chainType - Optional chain type (defaults to 'evm')
 * @returns A minimal BuilderFormConfig instance for testing
 */
export function createMinimalFormConfig(
  functionName: string = 'testFunction',
  _chainType: string = 'evm'
): BuilderFormConfig {
  return {
    functionId: functionName,
    fields: [
      {
        id: uuidv4(),
        type: 'text',
        name: 'testParam',
        label: 'Test Parameter',
        validation: {
          required: true,
        },
        helperText: `Description for Test Parameter`,
        placeholder: 'Enter test parameter',
      },
    ],
    layout: {
      columns: 1,
      spacing: 'normal',
      labelPosition: 'top',
      sections: [
        {
          id: uuidv4(),
          title: 'Test Section',
          description: 'A test section',
          fields: ['testParam'],
        },
      ],
    },
    validation: {
      mode: 'onChange',
      showErrors: 'inline',
    },
    executionConfig: {
      method: 'eoa',
      allowAny: true,
    },
    theme: {},
  };
}

/**
 * Create a complex form configuration for testing
 * @param functionName - Optional function name (defaults to 'complexFunction')
 * @param chainType - Optional chain type (defaults to 'evm')
 * @returns A complex BuilderFormConfig instance with multiple field types
 */
export function createComplexFormConfig(
  functionName: string = 'complexFunction',
  _chainType: string = 'evm'
): BuilderFormConfig {
  const basicFieldIds = [uuidv4(), uuidv4(), uuidv4()];
  const advancedFieldIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4()];

  return {
    functionId: functionName,
    fields: [
      {
        id: basicFieldIds[0],
        type: 'text',
        name: 'stringParam',
        label: 'String Parameter',
        validation: { required: true },
        helperText: 'Description for String Parameter',
        placeholder: 'Enter string parameter',
      },
      {
        id: basicFieldIds[1],
        type: 'number',
        name: 'numberParam',
        label: 'Number Parameter',
        validation: { required: true, min: 0, max: 100 },
        helperText: 'Description for Number Parameter (0-100)',
        placeholder: 'Enter number parameter',
      },
      {
        id: basicFieldIds[2],
        type: 'checkbox',
        name: 'boolParam',
        label: 'Boolean Parameter',
        validation: { required: true },
        helperText: 'Description for Boolean Parameter',
      },
      {
        id: advancedFieldIds[0],
        type: 'blockchain-address',
        name: 'addressParam',
        label: 'Address Parameter',
        validation: { required: true },
        helperText: 'Description for Address Parameter',
        placeholder: 'Enter address parameter',
      },
      {
        id: uuidv4(),
        type: 'number',
        name: 'hiddenParam',
        label: 'Hidden Number',
        validation: { required: true },
        isHidden: true,
      },
      {
        id: uuidv4(),
        type: 'text',
        name: 'hardcodedTextParam',
        label: 'Fixed Text Value',
        validation: { required: true },
        isHardcoded: true,
        hardcodedValue: 'This value is fixed',
        helperText: 'This text value is set and cannot be changed.',
      },
      {
        id: uuidv4(),
        type: 'number',
        name: 'readOnlyHardcodedNumber',
        label: 'Fixed Number (Read Only)',
        validation: { required: true },
        isHardcoded: true,
        hardcodedValue: 12345,
        isReadOnly: true,
        helperText: 'This number is fixed and displayed as read-only.',
      },
      {
        id: advancedFieldIds[1],
        type: 'textarea',
        name: 'arrayParam',
        label: 'Text Array Parameter',
        validation: { required: true },
        helperText: 'Enter text array (e.g., ["a", "b"])',
        placeholder: 'e.g., ["a", "b"]',
      },
      {
        id: advancedFieldIds[2],
        type: 'textarea',
        name: 'description',
        label: 'Description',
        validation: { required: false },
        helperText: 'Optional detailed description',
        placeholder: 'Enter description...',
      },
      {
        id: advancedFieldIds[3],
        type: 'select',
        name: 'priority',
        label: 'Priority',
        validation: { required: true },
        helperText: 'Select the priority level',
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
    ],
    layout: {
      columns: 1,
      spacing: 'normal',
      labelPosition: 'top',
      sections: [
        {
          id: uuidv4(),
          title: 'Basic Parameters',
          description: 'Description for Basic Parameters',
          fields: [basicFieldIds[0], basicFieldIds[1], basicFieldIds[2], advancedFieldIds[0]],
        },
        {
          id: uuidv4(),
          title: 'Other Parameters',
          description: 'Description for Other Parameters',
          fields: [advancedFieldIds[1], advancedFieldIds[2], advancedFieldIds[3]],
        },
        {
          id: uuidv4(),
          title: 'Hardcoded / ReadOnly Examples',
          description: 'Fields demonstrating hardcoding and read-only features.',
          fields: ['hardcodedTextParam', 'readOnlyHardcodedNumber'],
        },
      ],
    },
    validation: {
      mode: 'onChange',
      showErrors: 'inline',
    },
    executionConfig: {
      method: 'eoa',
      allowAny: false,
      specificAddress: '0x0000000000000000000000000000000000000000',
    },
    theme: {},
  };
}

/**
 * Create a test field
 * @param type - The field type
 * @param name - The field name
 * @param label - The field label
 * @param options - Optional field options
 * @returns A field configuration object
 */
export function createTestField(
  type: FieldType,
  name: string,
  label: string,
  options: Record<string, unknown> = {}
): {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  validation: { required: boolean };
  helperText: string;
  placeholder: string;
  [key: string]: unknown;
} {
  return {
    id: uuidv4(),
    type,
    name,
    label,
    validation: {
      required: true,
    },
    helperText: `Description for ${label}`,
    placeholder: `Enter ${label.toLowerCase()}`,
    ...options,
  };
}
