import { FormProvider, useForm } from 'react-hook-form';

import { BooleanField } from '../components/fields/BooleanField';

import type { BooleanFieldProps } from '../components/fields/BooleanField';
import type { Meta, StoryObj } from '@storybook/react';

// Custom type for the wrapper component props
type BooleanFieldWrapperProps = Omit<BooleanFieldProps, 'control'> & { defaultChecked?: boolean };

// Wrapper component to provide React Hook Form context
const BooleanFieldWrapper = (args: BooleanFieldWrapperProps) => {
  const methods = useForm({
    defaultValues: {
      [args.name]: args.defaultChecked || false,
    },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(console.log)}>
        <BooleanField {...args} control={methods.control} />
      </form>
    </FormProvider>
  );
};

const meta: Meta<typeof BooleanFieldWrapper> = {
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
  },
};

export default meta;
type Story = StoryObj<typeof BooleanFieldWrapper>;

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

// With custom validation
export const WithValidation: Story = {
  args: {
    id: 'checkbox-field-validation',
    name: 'checkboxFieldValidation',
    label: 'Checkbox Field with Validation',
    helperText: 'This checkbox must be checked to proceed',
    validateBoolean: (value: boolean) => value || 'You must accept the terms to continue',
  },
};
