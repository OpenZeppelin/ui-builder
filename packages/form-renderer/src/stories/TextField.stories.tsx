import { FormProvider, useForm } from 'react-hook-form';

import { TextField } from '../components/fields/TextField';

import type { TextFieldProps } from '../components/fields/TextField';
import type { Meta, StoryObj } from '@storybook/react';

// Wrapper component to provide React Hook Form context
const TextFieldWrapper = (args: Omit<TextFieldProps, 'control'>) => {
  const methods = useForm();
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(console.log)}>
        <TextField {...args} control={methods.control} />
      </form>
    </FormProvider>
  );
};

const meta: Meta<typeof TextFieldWrapper> = {
  title: 'Form Renderer/Fields/TextField',
  component: TextFieldWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TextFieldWrapper>;

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
    minLength: 5,
    maxLength: 10,
  },
};
