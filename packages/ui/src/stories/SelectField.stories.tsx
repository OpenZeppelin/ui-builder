import type { Meta, StoryObj } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';

import { SelectField } from '../components/fields/SelectField';
import type { SelectFieldProps, SelectOption } from '../components/fields/SelectField';

// Sample options for select fields
const fruitOptions: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'elderberry', label: 'Elderberry' },
];

const countryOptions: SelectOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
];

// Extended props for the wrapper component
interface SelectFieldWrapperProps extends Omit<SelectFieldProps, 'control'> {
  defaultValue?: string;
  showError?: boolean | string;
}

// Wrapper component to provide React Hook Form context
const SelectFieldWrapper = (args: SelectFieldWrapperProps) => {
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
        <SelectField {...args} control={methods.control} />
      </form>
    </FormProvider>
  );
};

const meta = {
  title: 'Renderer/Components/Fields/SelectField',
  component: SelectFieldWrapper,
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
      description: 'Select options',
    },
  },
} satisfies Meta<typeof SelectFieldWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic select field
export const Basic: Story = {
  args: {
    id: 'fruit-select',
    name: 'fruitSelect',
    label: 'Select a Fruit',
    placeholder: 'Choose a fruit',
    options: fruitOptions,
  },
};

// With helper text
export const WithHelperText: Story = {
  args: {
    id: 'fruit-select-helper',
    name: 'fruitSelectHelper',
    label: 'Select a Fruit',
    placeholder: 'Choose a fruit',
    helperText: 'Pick your favorite fruit from the list',
    options: fruitOptions,
  },
};

// With default value
export const WithDefaultValue: Story = {
  args: {
    id: 'fruit-select-default',
    name: 'fruitSelectDefault',
    label: 'Select a Fruit',
    placeholder: 'Choose a fruit',
    options: fruitOptions,
    defaultValue: 'banana',
  },
};

// Required field
export const Required: Story = {
  args: {
    id: 'fruit-select-required',
    name: 'fruitSelectRequired',
    label: 'Required Fruit Selection',
    placeholder: 'Choose a fruit',
    validation: {
      required: true,
    },
    options: fruitOptions,
    defaultValue: '',
    helperText: 'You must select a fruit',
  },
};

// With many options
export const WithManyOptions: Story = {
  args: {
    id: 'country-select',
    name: 'countrySelect',
    label: 'Select a Country',
    placeholder: 'Choose a country',
    options: countryOptions,
    helperText: 'Select from a longer list of options',
  },
};

// With custom validation
export const WithCustomValidation: Story = {
  args: {
    id: 'fruit-select-validation',
    name: 'fruitSelectValidation',
    label: 'Select a Non-Tropical Fruit',
    placeholder: 'Choose a fruit',
    options: fruitOptions,
    helperText: 'Bananas are tropical, you cannot select them',
    validateSelect: (value) => {
      if (value === 'banana') {
        return 'Please select a non-tropical fruit';
      }
      return true;
    },
    defaultValue: 'banana', // Will trigger the validation error
  },
};

// With error
export const WithError: Story = {
  args: {
    id: 'fruit-select-error',
    name: 'fruitSelectError',
    label: 'Fruit Selection with Error',
    placeholder: 'Choose a fruit',
    options: fruitOptions,
    showError: 'Please select a valid fruit',
  },
};

// Half width
export const HalfWidth: Story = {
  args: {
    id: 'fruit-select-half',
    name: 'fruitSelectHalf',
    label: 'Select a Fruit',
    placeholder: 'Choose a fruit',
    options: fruitOptions,
    width: 'half',
  },
};
