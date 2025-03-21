import { FormProvider, useForm } from 'react-hook-form';

import { TextField } from '../components/fields/TextField';

import type { TextFieldProps } from '../components/fields/TextField';
import type { Meta, StoryObj } from '@storybook/react';

// Extended props for the wrapper component
interface TextFieldWrapperProps extends Omit<TextFieldProps, 'control'> {
  defaultValue?: string;
  showError?: boolean | string;
}

// Wrapper component to provide React Hook Form context
const TextFieldWrapper = (args: TextFieldWrapperProps) => {
  const methods = useForm({
    defaultValues: {
      [args.name]: args.defaultValue || '',
    },
    mode: 'all', // Validate on all events for immediate feedback
  });

  // If showError is true, manually set an error
  if (args.showError) {
    setTimeout(() => {
      methods.setError(args.name, {
        type: 'manual',
        message:
          args.showError === true
            ? 'This field has an error'
            : typeof args.showError === 'string'
              ? args.showError
              : 'Validation failed',
      });
    }, 100);
  }

  // Force immediate validation for specific example cases
  if (
    (args.validation?.minLength &&
      args.defaultValue &&
      args.defaultValue.length < args.validation.minLength) ||
    (args.validation?.required && !args.defaultValue) ||
    (args.validation?.pattern && args.defaultValue)
  ) {
    setTimeout(() => {
      methods.trigger(args.name);
    }, 100);
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(console.log)}>
        <TextField {...args} control={methods.control} />
      </form>
    </FormProvider>
  );
};

const meta = {
  title: 'Form Renderer/Components/Fields/TextField',
  component: TextFieldWrapper,
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
} satisfies Meta<typeof TextFieldWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic text field
export const Basic: Story = {
  args: {
    id: 'text-field',
    name: 'textField',
    label: 'Text Field',
    placeholder: 'Enter text',
  },
};

// With helper text
export const WithHelperText: Story = {
  args: {
    id: 'text-field-helper',
    name: 'textFieldHelper',
    label: 'Text Field with Helper',
    placeholder: 'Enter text',
    helperText: 'This is a helpful message',
  },
};

// With validation
export const WithValidation: Story = {
  args: {
    id: 'text-field-validation',
    name: 'textFieldValidation',
    label: 'Text Field with Validation',
    placeholder: 'Enter text',
    validation: {
      minLength: 5,
      maxLength: 10,
    },
    helperText: 'Text must be between 5-10 characters',
    defaultValue: 'abc', // Too short to pass validation
  },
};

// Required field
export const Required: Story = {
  args: {
    id: 'text-field-required',
    name: 'textFieldRequired',
    label: 'Required Text Field',
    placeholder: 'Enter text',
    validation: {
      required: true,
    },
    defaultValue: '',
    helperText: 'This field cannot be empty',
  },
};

// With pattern validation
export const WithPattern: Story = {
  args: {
    id: 'text-field-pattern',
    name: 'textFieldPattern',
    label: 'Email Field',
    placeholder: 'Enter email',
    validation: {
      pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      required: true,
    },
    helperText: 'Please enter a valid email address',
    defaultValue: 'invalid-email',
  },
};

// With error state
export const WithError: Story = {
  args: {
    id: 'text-field-error',
    name: 'textFieldError',
    label: 'Field with Error',
    placeholder: 'Enter text',
    showError: 'Custom error message',
  },
};
