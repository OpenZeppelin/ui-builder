import type { FieldType } from '@openzeppelin/transaction-form-renderer';

import { v4 as uuidv4 } from 'uuid';

import type { BuilderFormConfig } from '../../core/types/FormTypes';

/**
 * Create a minimal form configuration for testing
 * @param functionName - Optional function name (defaults to 'testFunction')
 * @param chainType - Optional chain type (defaults to 'evm')
 * @returns A minimal BuilderFormConfig instance for testing
 */
export function createMinimalFormConfig(
  functionName: string = 'testFunction',
  chainType: string = 'evm'
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
  chainType: string = 'evm'
): BuilderFormConfig {
  const basicFieldIds = [uuidv4(), uuidv4(), uuidv4()];
  const advancedFieldIds = [uuidv4(), uuidv4()];

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
        validation: { required: true },
        helperText: 'Description for Number Parameter',
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
        type: 'address',
        name: 'addressParam',
        label: 'Address Parameter',
        validation: { required: true },
        helperText: 'Description for Address Parameter',
        placeholder: 'Enter address parameter',
      },
      {
        id: advancedFieldIds[1],
        type: 'number',
        name: 'arrayParam',
        label: 'Array Parameter',
        validation: { required: true },
        helperText: 'Description for Array Parameter',
        placeholder: 'Enter array parameter',
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
          fields: [basicFieldIds[0], basicFieldIds[1], basicFieldIds[2]],
        },
        {
          id: uuidv4(),
          title: 'Advanced Parameters',
          description: 'Description for Advanced Parameters',
          fields: [advancedFieldIds[0], advancedFieldIds[1]],
        },
      ],
    },
    validation: {
      mode: 'onChange',
      showErrors: 'inline',
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
