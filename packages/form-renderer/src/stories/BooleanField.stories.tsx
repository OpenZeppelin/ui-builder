import { FormProvider, useForm } from 'react-hook-form';

import { BooleanField } from '../components/fields/BooleanField';

import type { BooleanFieldProps } from '../components/fields/BooleanField';
import type { Meta, StoryObj } from '@storybook/react';

// Extended props for the wrapper component
interface BooleanFieldWrapperProps extends Omit<BooleanFieldProps, 'control'> {
  defaultChecked?: boolean;
  showError?: boolean | string;
}

// Wrapper component to provide React Hook Form context
const BooleanFieldWrapper = (args: BooleanFieldWrapperProps) => {
  const methods = useForm({
    defaultValues: {
      [args.name]: args.defaultChecked || false,
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

  // Force immediate validation for required fields or fields with validateBoolean functions
  if ((args.validation?.required && !args.defaultChecked) || args.validateBoolean) {
    setTimeout(() => {
      methods.trigger(args.name);
    }, 100);
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(console.log)}>
        <BooleanField {...args} control={methods.control} />
      </form>
    </FormProvider>
  );
};

const meta = {
  title: 'Form Renderer/Components/Fields/BooleanField',
  component: BooleanFieldWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    defaultChecked: {
      control: 'boolean',
      description: 'Initial checked state for the story',
    },
    showError: {
      control: { type: 'boolean' },
      description: 'Whether to show an error state',
    },
  },
} satisfies Meta<typeof BooleanFieldWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic checkbox field
export const Basic: Story = {
  args: {
    id: 'checkbox-field',
    name: 'checkboxField',
    label: 'Checkbox Field',
  },
};

// Initially checked
export const InitiallyChecked: Story = {
  args: {
    id: 'checkbox-field-checked',
    name: 'checkboxFieldChecked',
    label: 'Checkbox Field (Checked)',
    defaultChecked: true,
  },
};

// With helper text
export const WithHelperText: Story = {
  args: {
    id: 'checkbox-field-helper',
    name: 'checkboxFieldHelper',
    label: 'Checkbox Field with Helper',
    helperText: 'This is a helpful message explaining the checkbox',
  },
};

// Required checkbox
export const Required: Story = {
  args: {
    id: 'checkbox-field-required',
    name: 'checkboxFieldRequired',
    label: 'Required Checkbox',
    validation: {
      required: true,
    },
    helperText: 'This field is required',
  },
};

// With error state
export const WithError: Story = {
  args: {
    id: 'checkbox-field-error',
    name: 'checkboxFieldError',
    label: 'Checkbox with Error',
    showError: 'This checkbox has a validation error',
  },
};

// With custom validation
export const WithValidation: Story = {
  args: {
    id: 'checkbox-field-validation',
    name: 'checkboxFieldValidation',
    label: 'Checkbox Field with Validation',
    helperText: 'This checkbox must be checked to proceed',
    validation: {
      required: true,
    },
    validateBoolean: (value: boolean) => value || 'You must accept the terms to continue',
    defaultChecked: false, // Initially unchecked, which fails the validateBoolean check
  },
};
