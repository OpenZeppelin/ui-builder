import type { Meta, StoryObj } from '@storybook/react';

import { FormProvider, useForm } from 'react-hook-form';

import { SelectGroupedField } from '../components/fields/SelectGroupedField';
import type { OptionGroup, SelectGroupedFieldProps } from '../components/fields/SelectGroupedField';

// Sample option groups for select fields
const fruitGroups: OptionGroup[] = [
  {
    label: 'Common Fruits',
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'orange', label: 'Orange' },
    ],
  },
  {
    label: 'Berries',
    options: [
      { value: 'strawberry', label: 'Strawberry' },
      { value: 'blueberry', label: 'Blueberry' },
      { value: 'raspberry', label: 'Raspberry' },
    ],
  },
  {
    label: 'Exotic Fruits',
    options: [
      { value: 'mango', label: 'Mango' },
      { value: 'dragonfruit', label: 'Dragon Fruit' },
      { value: 'durian', label: 'Durian', disabled: true },
    ],
  },
];

const countryGroups: OptionGroup[] = [
  {
    label: 'North America',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'mx', label: 'Mexico' },
    ],
  },
  {
    label: 'Europe',
    options: [
      { value: 'uk', label: 'United Kingdom' },
      { value: 'fr', label: 'France' },
      { value: 'de', label: 'Germany' },
      { value: 'es', label: 'Spain' },
    ],
  },
  {
    label: 'Asia',
    options: [
      { value: 'jp', label: 'Japan' },
      { value: 'cn', label: 'China' },
      { value: 'in', label: 'India' },
    ],
  },
];

// Extended props for the wrapper component
interface SelectGroupedFieldWrapperProps extends Omit<SelectGroupedFieldProps, 'control'> {
  defaultValue?: string;
  showError?: boolean | string;
}

// Wrapper component to provide React Hook Form context
const SelectGroupedFieldWrapper = (args: SelectGroupedFieldWrapperProps) => {
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
        <SelectGroupedField {...args} control={methods.control} />
      </form>
    </FormProvider>
  );
};

const meta = {
  title: 'Renderer/Components/Fields/SelectGroupedField',
  component: SelectGroupedFieldWrapper,
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
    groups: {
      control: 'object',
      description: 'Select option groups',
    },
  },
} satisfies Meta<typeof SelectGroupedFieldWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic grouped select field
export const Basic: Story = {
  args: {
    id: 'fruit-grouped-select',
    name: 'fruitGroupedSelect',
    label: 'Select a Fruit',
    placeholder: 'Choose a fruit',
    groups: fruitGroups,
  },
};

// With helper text
export const WithHelperText: Story = {
  args: {
    id: 'fruit-grouped-select-helper',
    name: 'fruitGroupedSelectHelper',
    label: 'Select a Fruit',
    placeholder: 'Choose a fruit',
    helperText: 'Pick your favorite fruit from the list',
    groups: fruitGroups,
  },
};

// With default value
export const WithDefaultValue: Story = {
  args: {
    id: 'fruit-grouped-select-default',
    name: 'fruitGroupedSelectDefault',
    label: 'Select a Fruit',
    placeholder: 'Choose a fruit',
    groups: fruitGroups,
    defaultValue: 'strawberry',
  },
};

// Required field
export const Required: Story = {
  args: {
    id: 'fruit-grouped-select-required',
    name: 'fruitGroupedSelectRequired',
    label: 'Required Fruit Selection',
    placeholder: 'Choose a fruit',
    validation: {
      required: true,
    },
    groups: fruitGroups,
    helperText: 'You must select a fruit',
  },
};

// With many options in groups
export const WithManyOptions: Story = {
  args: {
    id: 'country-grouped-select',
    name: 'countryGroupedSelect',
    label: 'Select a Country',
    placeholder: 'Choose a country',
    groups: countryGroups,
    helperText: 'Select from categorized options',
  },
};

// With custom validation
export const WithCustomValidation: Story = {
  args: {
    id: 'fruit-grouped-select-validation',
    name: 'fruitGroupedSelectValidation',
    label: 'Select a Non-Tropical Fruit',
    placeholder: 'Choose a fruit',
    groups: fruitGroups,
    helperText: 'Bananas and Mangos are tropical, you cannot select them',
    validateSelect: (value) => {
      if (value === 'banana' || value === 'mango') {
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
    id: 'fruit-grouped-select-error',
    name: 'fruitGroupedSelectError',
    label: 'Fruit Selection with Error',
    placeholder: 'Choose a fruit',
    groups: fruitGroups,
    showError: 'Please select a valid fruit',
  },
};

// Half width
export const HalfWidth: Story = {
  args: {
    id: 'fruit-grouped-select-half',
    name: 'fruitGroupedSelectHalf',
    label: 'Select a Fruit',
    placeholder: 'Choose a fruit',
    groups: fruitGroups,
    width: 'half',
  },
};

// Third width
export const ThirdWidth: Story = {
  args: {
    id: 'fruit-grouped-select-third',
    name: 'fruitGroupedSelectThird',
    label: 'Select a Fruit',
    placeholder: 'Choose a fruit',
    groups: fruitGroups,
    width: 'third',
  },
};
