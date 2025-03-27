import type { Meta, StoryObj } from '@storybook/react';

import { FormProvider, useForm } from 'react-hook-form';

import { RadioField } from '../components/fields/RadioField';

import type { RadioFieldProps, RadioOption } from '../components/fields/RadioField';

// Sample options for radio fields
const colorOptions: RadioOption[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple', disabled: true },
  { value: 'yellow', label: 'Yellow' },
];

const sizeOptions: RadioOption[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

// Extended props for the wrapper component
interface RadioFieldWrapperProps extends Omit<RadioFieldProps, 'control'> {
  defaultValue?: string;
  showError?: boolean | string;
}

// Wrapper component to provide React Hook Form context
const RadioFieldWrapper = (args: RadioFieldWrapperProps) => {
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

  // Force immediate validation for required fields
  if (args.validation?.required && !args.defaultValue) {
    setTimeout(() => {
      methods.trigger(args.name);
    }, 100);
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(console.log)}>
        <RadioField {...args} control={methods.control} />
      </form>
    </FormProvider>
  );
};

const meta = {
  title: 'Form Renderer/Components/Fields/RadioField',
  component: RadioFieldWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Initial selected value for the story',
    },
    showError: {
      control: { type: 'boolean' },
      description: 'Whether to show an error state',
    },
    options: {
      control: 'object',
      description: 'Radio options',
    },
    layout: {
      control: { type: 'radio', options: ['vertical', 'horizontal'] },
      description: 'Layout direction for radio buttons',
    },
  },
} satisfies Meta<typeof RadioFieldWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic radio field with vertical layout (default)
export const BasicVertical: Story = {
  args: {
    id: 'color-radio',
    name: 'colorRadio',
    label: 'Select a Color',
    options: colorOptions,
    layout: 'vertical',
  },
};

// Radio field with horizontal layout
export const HorizontalLayout: Story = {
  args: {
    id: 'size-radio-horizontal',
    name: 'sizeRadioHorizontal',
    label: 'Select a Size',
    options: sizeOptions,
    layout: 'horizontal',
  },
};

// With helper text
export const WithHelperText: Story = {
  args: {
    id: 'color-radio-helper',
    name: 'colorRadioHelper',
    label: 'Select a Color',
    helperText: 'Choose your favorite color from the options',
    options: colorOptions,
  },
};

// With default value
export const WithDefaultValue: Story = {
  args: {
    id: 'color-radio-default',
    name: 'colorRadioDefault',
    label: 'Select a Color',
    options: colorOptions,
    defaultValue: 'blue',
  },
};

// Required field
export const Required: Story = {
  args: {
    id: 'color-radio-required',
    name: 'colorRadioRequired',
    label: 'Required Color Selection',
    validation: {
      required: true,
    },
    options: colorOptions,
    defaultValue: '',
    helperText: 'You must select a color',
  },
};

// With custom validation
export const WithCustomValidation: Story = {
  args: {
    id: 'color-radio-validation',
    name: 'colorRadioValidation',
    label: 'Select a Warm Color',
    options: colorOptions,
    helperText: 'Blue is a cool color, you should select a warm color',
    validateRadio: (value) => {
      if (value === 'blue') {
        return 'Please select a warm color';
      }
      return true;
    },
    defaultValue: 'blue', // Will trigger the validation error
  },
};

// With error
export const WithError: Story = {
  args: {
    id: 'color-radio-error',
    name: 'colorRadioError',
    label: 'Color Selection with Error',
    options: colorOptions,
    showError: 'Please select a valid color',
  },
};

// Half width
export const HalfWidth: Story = {
  args: {
    id: 'color-radio-half',
    name: 'colorRadioHalf',
    label: 'Select a Color',
    options: colorOptions,
    width: 'half',
  },
};
