import { capitalize } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { Ecosystem } from '@openzeppelin/transaction-form-types/common';
import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';
import type { FieldType } from '@openzeppelin/transaction-form-types/forms';

import type { BuilderFormConfig } from '../../core/types/FormTypes';

/**
 * Create a minimal form configuration for testing
 * @param functionName - Optional function name (defaults to 'testFunction')
 * @param ecosystem - Optional ecosystem (defaults to 'evm')
 * @returns A minimal BuilderFormConfig instance for testing
 */
export function createMinimalFormConfig(
  functionName: string = 'testFunction',
  _ecosystem: Ecosystem = 'evm'
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
    contractAddress: '0xe34139463bA50bD61336E0c446Bd8C0867c6fE65',
  };
}

/**
 * Creates a minimal mock ContractSchema for testing.
 */
export function createMinimalContractSchema(
  functionName: string,
  ecosystem: Ecosystem
): ContractSchema {
  return {
    ecosystem,
    name: 'MockContract',
    address: '0x1234567890123456789012345678901234567890', // Use a valid-looking address
    functions: [
      {
        id: functionName,
        name: functionName,
        displayName: capitalize(functionName),
        inputs: [], // Basic schema assumes no inputs for simplicity
        type: 'function',
        modifiesState: true,
      },
      // Add a basic view function for potential widget tests?
      {
        id: 'viewFunction',
        name: 'viewFunction',
        displayName: 'View Function',
        inputs: [],
        type: 'function',
        modifiesState: false,
        stateMutability: 'view',
      },
    ],
  };
}

/**
 * Create a complex form configuration for testing
 * @param functionName - Optional function name (defaults to 'complexFunction')
 * @param ecosystem - Optional ecosystem (defaults to 'evm')
 * @returns A complex BuilderFormConfig instance with multiple field types
 */
export function createComplexFormConfig(
  functionName: string = 'complexFunction',
  _ecosystem: Ecosystem = 'evm'
): BuilderFormConfig {
  const basicFieldIds = [uuidv4(), uuidv4(), uuidv4()];
  const advancedFieldIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4()];

  return {
    functionId: functionName,
    title: 'Complex Test Form',
    description: 'A test form with multiple different field types',
    fields: [
      {
        id: basicFieldIds[0],
        type: 'text',
        name: 'stringParam',
        label: 'Text Parameter',
        placeholder: 'Enter text',
        helperText: 'A basic text field',
        validation: {
          required: true,
          minLength: 3,
          maxLength: 100,
        },
      },
      {
        id: basicFieldIds[1],
        type: 'number',
        name: 'numberParam',
        label: 'Number Parameter',
        placeholder: 'Enter a number',
        helperText: 'A number field',
        validation: {
          required: true,
          min: 1,
          max: 100,
        },
      },
      {
        id: basicFieldIds[2],
        type: 'checkbox',
        name: 'boolParam',
        label: 'Boolean Parameter',
        helperText: 'A checkbox field',
        defaultValue: false,
        validation: {
          required: true,
        },
      },
      {
        id: advancedFieldIds[0],
        type: 'blockchain-address',
        name: 'addressParam',
        label: 'Address Parameter',
        placeholder: '0x...',
        helperText: 'Enter an Ethereum address',
        validation: {
          required: true,
        },
      },
      {
        id: advancedFieldIds[1],
        type: 'textarea',
        name: 'longTextParam',
        label: 'Long Text Parameter',
        placeholder: 'Enter detailed information',
        helperText: 'A textarea for longer content',
        validation: {
          required: false,
          maxLength: 1000,
        },
      },
      {
        id: advancedFieldIds[2],
        type: 'select',
        name: 'selectParam',
        label: 'Select Parameter',
        placeholder: 'Choose an option',
        helperText: 'A dropdown selection field',
        validation: {
          required: true,
        },
        options: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
          { label: 'Option C', value: 'c' },
        ],
      },
      {
        id: advancedFieldIds[3],
        type: 'date',
        name: 'dateParam',
        label: 'Date Parameter',
        placeholder: 'Select a date',
        helperText: 'A date selection field',
        validation: {
          required: false,
        },
      },
      {
        id: 'hardcodedTextParam',
        type: 'text',
        name: 'hardcodedTextParam',
        label: 'Hardcoded Text',
        isHardcoded: true,
        hardcodedValue: 'This is a fixed value',
        helperText: 'This field has a hardcoded value',
        validation: {},
      },
      {
        id: 'readOnlyText',
        type: 'text',
        name: 'readOnlyText',
        label: 'Read-Only Text',
        isReadOnly: true,
        defaultValue: 'Cannot be changed',
        helperText: 'This field is read-only',
        validation: {},
      },
      {
        id: 'readOnlyHardcodedNumber',
        type: 'number',
        name: 'readOnlyHardcodedNumber',
        label: 'Hardcoded Read-Only Number',
        isHardcoded: true,
        hardcodedValue: 42,
        isReadOnly: true,
        helperText: 'This field is hardcoded and read-only',
        validation: {},
      },
    ],
    layout: {
      columns: 1,
      spacing: 'normal',
      labelPosition: 'top',
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
    contractAddress: '0xe34139463bA50bD61336E0c446Bd8C0867c6fE65',
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
    contractAddress: '0xe34139463bA50bD61336E0c446Bd8C0867c6fE65',
  };
}
