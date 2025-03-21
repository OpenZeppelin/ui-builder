import { FormProvider, useForm } from 'react-hook-form';

import { NumberField } from '../components/fields/NumberField';

import type { NumberFieldProps } from '../components/fields/NumberField';
import type { Meta, StoryObj } from '@storybook/react';

// Wrapper component to provide React Hook Form context
const NumberFieldWrapper = (args: Omit<NumberFieldProps, 'control'>) => {
  const methods = useForm();
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(console.log)}>
        <NumberField {...args} control={methods.control} />
      </form>
    </FormProvider>
  );
};

const meta: Meta<typeof NumberField> = {
  title: 'Form Renderer/Components/Fields/NumberField',
  component: NumberFieldWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NumberFieldWrapper>;

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
    min: 5,
    max: 100,
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
    step: 0.5,
    helperText: 'Increments by 0.5',
  },
};
