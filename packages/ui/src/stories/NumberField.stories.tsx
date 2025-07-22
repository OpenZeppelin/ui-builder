import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { NumberField } from '../components/fields/NumberField';
import type { NumberFieldProps } from '../components/fields/NumberField';

// Extended props for the wrapper component
interface NumberFieldWrapperProps extends Omit<NumberFieldProps, 'control'> {
  defaultValue?: number | string;
  showError?: boolean | string;
}

// Wrapper component to provide React Hook Form context
const NumberFieldWrapper = (args: NumberFieldWrapperProps) => {
  const methods = useForm({
    defaultValues: {
      [args.name]: args.defaultValue !== undefined ? args.defaultValue : '',
    },
    mode: 'onChange', // Changed to onChange for consistent behavior
  });

  // Use useEffect to set errors or trigger validation after mount
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

    // Force validation for certain scenarios
    if (
      (args.validation?.required &&
        (args.defaultValue === '' || args.defaultValue === undefined)) ||
      (typeof args.defaultValue === 'string' &&
        args.defaultValue !== '' &&
        isNaN(Number(args.defaultValue)))
    ) {
      // Add a small delay to ensure the form is fully mounted
      setTimeout(() => {
        methods.trigger(args.name);
      }, 100);
    }

    // For min/max validation demonstration
    if (
      (args.validation?.min !== undefined &&
        typeof args.defaultValue === 'number' &&
        args.defaultValue < args.validation.min) ||
      (args.validation?.max !== undefined &&
        typeof args.defaultValue === 'number' &&
        args.defaultValue > args.validation.max)
    ) {
      setTimeout(() => {
        methods.trigger(args.name);
      }, 100);
    }
  }, [methods, args.name, args.showError, args.validation, args.defaultValue]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(console.log)}>
        <NumberField {...args} control={methods.control} />
      </form>
    </FormProvider>
  );
};

const meta = {
  title: 'Renderer/Components/Fields/NumberField',
  component: NumberFieldWrapper,
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
} satisfies Meta<typeof NumberFieldWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic number field
export const Basic: Story = {
  args: {
    id: 'number-field',
    name: 'numberField',
    label: 'Number Field',
    placeholder: 'Enter a number',
  },
};

// With min and max values
export const WithMinMax: Story = {
  args: {
    id: 'number-field-min-max',
    name: 'numberFieldMinMax',
    label: 'Number Field with Min/Max',
    placeholder: 'Enter a number',
    validation: {
      min: 5,
      max: 100,
    },
    defaultValue: 2, // Below minimum
    helperText: 'Value must be between 5 and 100',
  },
};

// With step value
export const WithStep: Story = {
  args: {
    id: 'number-field-step',
    name: 'numberFieldStep',
    label: 'Number Field with Step',
    placeholder: 'Enter a number',
    step: 0.5, // Step is still a direct prop as it controls UI increment behavior
    helperText: 'Increments by 0.5',
  },
};

// Required number field
export const Required: Story = {
  args: {
    id: 'number-field-required',
    name: 'numberFieldRequired',
    label: 'Required Number Field',
    placeholder: 'Enter a number',
    validation: {
      required: true,
    },
    defaultValue: '', // Empty value to trigger required validation
    helperText: 'This field is required',
  },
};

// With invalid input
export const InvalidInput: Story = {
  args: {
    id: 'number-field-invalid',
    name: 'numberFieldInvalid',
    label: 'Number Field with Invalid Input',
    placeholder: 'Enter a number',
    defaultValue: '-', // Incomplete number to trigger validation
    helperText: 'Try entering incomplete numbers like "-" or "5." to see validation',
  },
};

// With error state
export const WithError: Story = {
  args: {
    id: 'number-field-error',
    name: 'numberFieldError',
    label: 'Field with Error',
    placeholder: 'Enter a number',
    showError: 'This number is invalid',
  },
};

// Comprehensive validation
export const ComprehensiveValidation: Story = {
  args: {
    id: 'number-field-comprehensive',
    name: 'numberFieldComprehensive',
    label: 'Comprehensive Validation',
    placeholder: 'Enter a number',
    step: 0.1,
    validation: {
      required: true,
      min: 0,
      max: 10,
    },
    defaultValue: 11.5, // Above maximum and not a whole number
    validateNumber: (value: number) => {
      if (value % 1 !== 0) return 'Only whole numbers are allowed';
      return true;
    },
    helperText: 'Enter a whole number between 0 and 10',
  },
};
