import { FormProvider, useForm } from 'react-hook-form';

import { AddressField } from '../components/fields/AddressField';

import type { AddressFieldProps } from '../components/fields/AddressField';
import type { Meta, StoryObj } from '@storybook/react';

// Wrapper component to provide React Hook Form context
const AddressFieldWrapper = (args: Omit<AddressFieldProps, 'control'>) => {
  const methods = useForm();
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(console.log)}>
        <AddressField {...args} control={methods.control} />
      </form>
    </FormProvider>
  );
};

const meta: Meta<typeof AddressField> = {
  title: 'Form Renderer/Components/Fields/AddressField',
  component: AddressFieldWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AddressFieldWrapper>;

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
    validateAddress: (value: string) => {
      if (!value.startsWith('0x')) return 'Address must start with 0x';
      if (value.length !== 42) return 'Address must be 42 characters long';
      return true;
    },
    helperText: 'Enter a valid Ethereum address',
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
