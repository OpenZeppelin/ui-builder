import { TransactionForm } from '../components/TransactionForm';

import type {
  ContractAdapter,
  FormValues,
  RenderFormSchema,
  TransactionFormProps,
} from '../types/FormTypes';
import type { Meta, StoryObj } from '@storybook/react';

// Example adapter for form data processing
const mockAdapter: ContractAdapter = {
  formatTransactionData: (functionId: string, data: Record<string, unknown>) => {
    console.log('Formatting transaction data:', { functionId, data });
    return data;
  },
  isValidAddress: (address: string) => {
    // Simple validation just for the story example
    return address.startsWith('0x') && address.length === 42;
  },
};

// Basic schema with text and number fields
const basicSchema: RenderFormSchema = {
  id: 'basic-form',
  functionId: 'exampleFunction',
  title: 'Basic Form',
  fields: [
    {
      id: 'name',
      name: 'name',
      type: 'text',
      label: 'Name',
      validation: {},
    },
    {
      id: 'amount',
      name: 'amount',
      type: 'number',
      label: 'Amount',
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
  submitButton: {
    text: 'Submit Form',
    variant: 'primary',
    loadingText: 'Submitting...',
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
      type: 'address',
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
};

const meta: Meta<typeof TransactionForm> = {
  title: 'Form Renderer/TransactionForm',
  component: TransactionForm,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TransactionForm>;

// Basic form story
export const Basic: Story = {
  args: {
    schema: basicSchema,
    adapter: mockAdapter,
    onSubmit: (formData) => {
      console.log('Form submitted:', formData);
      alert('Form submitted successfully!');
    },
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
