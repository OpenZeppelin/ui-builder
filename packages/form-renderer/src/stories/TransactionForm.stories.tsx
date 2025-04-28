import type { Meta, StoryObj } from '@storybook/react';

import type { RenderFormSchema } from '@openzeppelin/transaction-form-types/forms';

import { TransactionForm } from '../components/TransactionForm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAdapter: any = {
  formatTransactionData: (_functionId: string, data: Record<string, unknown>) => {
    console.log('Mock Adapter: Formatting data', data);
    // Simulate data formatting for EVM
    // In a real adapter, this would ABI-encode the data
    return {
      to: '0x1234567890123456789012345678901234567890',
      data: '0xabcdef123...',
      value: data.value ? BigInt(data.value as string).toString() : '0',
    };
  },
  isValidAddress: (address: string): boolean => {
    // Basic EVM address check for storybook
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },
  getCompatibleFieldTypes: () => {
    // Return common types for storybook
    return ['text', 'number', 'blockchain-address'];
  },
};

// Advanced schema with multiple field types and validation
const advancedSchema: RenderFormSchema = {
  id: 'advanced-form',
  functionId: 'advancedFunction',
  title: 'Advanced Form',
  fields: [
    {
      id: 'recipient',
      name: 'recipient',
      type: 'blockchain-address',
      label: 'Recipient Address',
      validation: {
        required: true,
      },
    },
    {
      id: 'amount',
      name: 'amount',
      type: 'number',
      label: 'Transaction Amount',
      validation: {
        required: true,
        min: 0.001,
        max: 100,
      },
    },
    {
      id: 'notes',
      name: 'notes',
      type: 'text',
      label: 'Notes',
      validation: {
        required: false,
        maxLength: 200,
      },
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
  submitButton: {
    text: 'Send Transaction',
    variant: 'primary',
    loadingText: 'Processing...',
  },
  contractAddress: '0xContractAddress_Fix',
};

const meta: Meta<typeof TransactionForm> = {
  title: 'Components/TransactionForm',
  component: TransactionForm,
  tags: ['autodocs'],
  argTypes: {
    // Define argTypes if needed
  },
};

export default meta;
type Story = StoryObj<typeof TransactionForm>;

// Define args for stories
export const Primary: Story = {
  args: {
    schema: {
      id: 'primary-form',
      functionId: 'primaryFunc',
      title: 'Primary Form',
      contractAddress: '0xPrimaryContract_Fix',
      fields: [
        {
          id: 'field1',
          name: 'textInput',
          type: 'text',
          label: 'Text Input',
          validation: {},
        },
        {
          id: 'field2',
          name: 'numberInput',
          type: 'number',
          label: 'Number Input',
          validation: {},
        },
      ],
      layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
      validation: { mode: 'onChange', showErrors: 'inline' },
      submitButton: { text: 'Submit Primary', loadingText: 'Submitting Primary...' },
    },
    adapter: mockAdapter,
  },
};

// Advanced form story
export const Advanced: Story = {
  args: {
    schema: advancedSchema,
    adapter: mockAdapter,
    onSubmit: (formData) => {
      console.log('Form submitted:', formData);
      alert('Form submitted successfully!');
    },
  },
};

// Preview mode story
export const PreviewMode: Story = {
  args: {
    schema: advancedSchema,
    adapter: mockAdapter,
    previewMode: true,
  },
};

export const WithValidation: Story = {
  args: {
    schema: {
      id: 'validation-form',
      functionId: 'validationFunction',
      title: 'Form with Validation',
      contractAddress: '0xValidationMockAddress',
      fields: [
        {
          id: 'addrField',
          name: 'address',
          type: 'blockchain-address',
          label: 'Address',
          validation: { required: true },
        },
        {
          id: 'amountField',
          name: 'amount',
          type: 'number',
          label: 'Amount',
          validation: { required: true, min: 1 },
        },
        {
          id: 'optionalField',
          name: 'optional',
          type: 'text',
          label: 'Optional',
          validation: {},
        },
      ],
      layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
      validation: { mode: 'onChange', showErrors: 'inline' },
      submitButton: { text: 'Submit Validated', loadingText: 'Validating...' },
    },
    adapter: mockAdapter,
    onSubmit: (formData) => {
      console.log('Form submitted:', formData);
      alert('Form submitted successfully!');
    },
  },
};

// Mock Schemas for Demonstration
const _basicSchema: RenderFormSchema = {
  id: 'basic-form',
  title: 'Basic Form Example',
  functionId: 'basicFunc',
  contractAddress: '0xBasicContract',
  fields: [],
  layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
  validation: { mode: 'onChange', showErrors: 'inline' },
  submitButton: { text: 'Submit Basic', loadingText: 'Submitting Basic...' },
};

// Story for complex types
export const ComplexTypes: Story = {
  args: {
    adapter: mockAdapter,
    schema: {
      id: 'complex-form',
      functionId: 'complexFunc',
      title: 'Complex Types Form',
      contractAddress: '0xComplexContract_Fix',
      fields: [],
      layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
      validation: { mode: 'onChange', showErrors: 'inline' },
      submitButton: { text: 'Submit Complex', loadingText: 'Submitting Complex...' },
    },
  },
};

const _mockSchema: RenderFormSchema = {
  id: 'mock-form',
  title: 'Mock Schema Form',
  functionId: 'mockFunc',
  contractAddress: '0xMockContract',
  fields: [],
  layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
  validation: { mode: 'onChange', showErrors: 'inline' },
  submitButton: { text: 'Submit Mock', loadingText: 'Submitting Mock...' },
};

// Another mock schema
const _anotherMockSchema: RenderFormSchema = {
  id: 'another-mock-form',
  title: 'Another Mock Schema Form',
  functionId: 'anotherMockFunc',
  contractAddress: '0xAnotherMockContract',
  fields: [],
  layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
  validation: { mode: 'onChange', showErrors: 'inline' },
  submitButton: { text: 'Submit Another Mock', loadingText: 'Submitting Another Mock...' },
};

export const EVMTransfer: Story = {
  args: {
    schema: {
      id: 'evm-transfer-form',
      functionId: 'transfer',
      title: 'EVM Transfer Example',
      contractAddress: '0xEVMContractAddress_Fix',
      fields: [
        {
          id: 'addressField',
          name: 'recipient',
          type: 'blockchain-address',
          label: 'Recipient Address',
          validation: { required: true },
        },
        {
          id: 'amountField',
          name: 'amount',
          type: 'number',
          label: 'Amount (ETH)',
          validation: { required: true, min: 0.001 },
        },
        {
          id: 'checkboxField',
          name: 'sendMax',
          type: 'checkbox',
          label: 'Send Maximum Amount',
          validation: {},
        },
      ],
      layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
      validation: { mode: 'onChange', showErrors: 'inline' },
      submitButton: { text: 'Send Transfer', loadingText: 'Sending...' },
    },
    adapter: mockAdapter,
  },
};
