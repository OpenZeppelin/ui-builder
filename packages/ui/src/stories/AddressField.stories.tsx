import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { AddressField } from '../components/fields/AddressField';

// Define the props directly based on what the component needs
interface AddressFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  validation?: {
    required?: boolean;
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
  };
  validateAddress?: (value: string) => string | true;
  width?: 'full' | 'half' | 'third';
}

// Extended props for the wrapper component
interface AddressFieldWrapperProps extends AddressFieldProps {
  defaultValue?: string;
  showError?: boolean | string;
}

// Wrapper component to provide React Hook Form context
const AddressFieldWrapper = (args: AddressFieldWrapperProps) => {
  const methods = useForm({
    defaultValues: {
      [args.name]: args.defaultValue || '',
    },
    mode: 'onChange', // Changed to onChange for better real-time feedback
  });

  // Use useEffect to handle error states and validation after mount
  useEffect(() => {
    // If showError is true, manually set an error
    if (args.showError) {
      methods.setError(args.name, {
        type: 'manual',
        message:
          args.showError === true
            ? 'This field has an error'
            : typeof args.showError === 'string'
              ? args.showError
              : 'Validation failed',
      });
    }

    // Force immediate validation for specific example cases
    if (
      (args.validation?.required && args.defaultValue === '') ||
      (args.validateAddress && args.defaultValue) ||
      (args.validation?.pattern && args.defaultValue)
    ) {
      // Add a small delay to ensure the form is fully mounted
      setTimeout(() => {
        methods.trigger(args.name);
      }, 100);
    }
  }, [
    methods,
    args.name,
    args.showError,
    args.validation,
    args.validateAddress,
    args.defaultValue,
  ]);

  // Explicitly include id, name, and label props
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(console.log)}>
        <AddressField
          id={args.id}
          name={args.name}
          label={args.label}
          placeholder={args.placeholder}
          helperText={args.helperText}
          validation={args.validation}
          width={args.width}
          control={methods.control}
        />
      </form>
    </FormProvider>
  );
};

const meta = {
  title: 'Renderer/Components/Fields/AddressField',
  component: AddressFieldWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Initial value for the story',
    },
    showError: {
      control: { type: 'boolean' },
      description: 'Whether to show an error state',
    },
  },
} satisfies Meta<typeof AddressFieldWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic address field
export const Basic: Story = {
  args: {
    id: 'address-field',
    name: 'addressField',
    label: 'Ethereum Address',
    placeholder: '0x...',
  },
};

// With validation
export const WithValidation: Story = {
  args: {
    id: 'address-field-validation',
    name: 'addressFieldValidation',
    label: 'Validated Ethereum Address',
    placeholder: '0x...',
    validation: {
      pattern: /^0x[a-fA-F0-9]{40}$/,
    },
    validateAddress: (value: string) => {
      if (!value.startsWith('0x')) return 'Address must start with 0x';
      if (value.length !== 42) return 'Address must be 42 characters long';
      return true;
    },
    helperText: 'Enter a valid Ethereum address',
    defaultValue: '0xinvalid', // Invalid address format
  },
};

// Required address field
export const Required: Story = {
  args: {
    id: 'address-field-required',
    name: 'addressFieldRequired',
    label: 'Required Address Field',
    placeholder: '0x...',
    validation: {
      required: true,
    },
    helperText: 'This field is required. Try entering text and then deleting it.',
    defaultValue: '', // Empty value for required field
  },
};

// With error state
export const WithError: Story = {
  args: {
    id: 'address-field-error',
    name: 'addressFieldError',
    label: 'Address with Error',
    placeholder: '0x...',
    showError: 'Invalid blockchain address',
  },
};

// Half width field
export const HalfWidth: Story = {
  args: {
    id: 'address-field-half',
    name: 'addressFieldHalf',
    label: 'Address (Half Width)',
    placeholder: '0x...',
    width: 'half',
  },
};
