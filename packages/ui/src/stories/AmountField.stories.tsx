import type { Meta, StoryObj } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';

import { AmountField } from '../components/fields/AmountField';
import type { AmountFieldProps } from '../components/fields/AmountField';

// Extended props for the wrapper component
interface AmountFieldWrapperProps extends Omit<AmountFieldProps, 'control'> {
  defaultValue?: string | number;
  showError?: boolean | string;
}

// Wrapper component to provide React Hook Form context
const AmountFieldWrapper = (args: AmountFieldWrapperProps) => {
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

  // Force immediate validation for min/max validation
  if (
    (args.validation?.required && !args.defaultValue) ||
    (args.min !== undefined &&
      typeof args.defaultValue === 'number' &&
      args.defaultValue < args.min) ||
    (args.max !== undefined &&
      typeof args.defaultValue === 'number' &&
      args.defaultValue > args.max)
  ) {
    setTimeout(() => {
      methods.trigger(args.name);
    }, 100);
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(console.log)}>
        <AmountField {...args} control={methods.control} />
      </form>
    </FormProvider>
  );
};

const meta = {
  title: 'Renderer/Components/Fields/AmountField',
  component: AmountFieldWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: { type: 'text' },
      description: 'Initial value for the story',
    },
    showError: {
      control: { type: 'boolean' },
      description: 'Whether to show an error state',
    },
    min: {
      control: { type: 'number' },
      description: 'Minimum allowed value',
    },
    max: {
      control: { type: 'number' },
      description: 'Maximum allowed value',
    },
    step: {
      control: { type: 'number' },
      description: 'Step value for increment/decrement',
    },
    decimals: {
      control: { type: 'number', min: 0, max: 8 },
      description: 'Number of decimal places to allow',
    },
    symbol: {
      control: 'text',
      description: 'Currency or token symbol',
    },
    symbolPosition: {
      control: { type: 'radio', options: ['prefix', 'suffix'] },
      description: 'Position of the symbol',
    },
  },
} satisfies Meta<typeof AmountFieldWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic amount field
export const Basic: Story = {
  args: {
    id: 'basic-amount',
    name: 'basicAmount',
    label: 'Amount',
    placeholder: 'Enter amount',
  },
};

// With currency symbol - prefix
export const WithCurrencyPrefix: Story = {
  args: {
    id: 'amount-currency-prefix',
    name: 'amountCurrencyPrefix',
    label: 'Price in USD',
    placeholder: 'Enter price',
    symbol: '$',
    symbolPosition: 'prefix',
    decimals: 2,
    step: 0.01,
    defaultValue: '10.99',
  },
};

// With currency symbol - suffix
export const WithCurrencySuffix: Story = {
  args: {
    id: 'amount-currency-suffix',
    name: 'amountCurrencySuffix',
    label: 'Euro Amount',
    placeholder: 'Enter amount',
    symbol: '€',
    symbolPosition: 'suffix',
    decimals: 2,
    step: 0.01,
    defaultValue: '15.50',
  },
};

// With crypto token symbol
export const WithTokenSymbol: Story = {
  args: {
    id: 'amount-token',
    name: 'amountToken',
    label: 'ETH Amount',
    placeholder: 'Enter ETH amount',
    symbol: 'ETH',
    symbolPosition: 'suffix',
    decimals: 6,
    step: 0.000001,
    defaultValue: '0.05',
    helperText: 'Enter the amount of ETH to send',
  },
};

// With helper text
export const WithHelperText: Story = {
  args: {
    id: 'amount-helper',
    name: 'amountHelper',
    label: 'Donation Amount',
    placeholder: 'Enter donation',
    helperText: 'How much would you like to donate?',
    symbol: '$',
    symbolPosition: 'prefix',
  },
};

// With validation range
export const WithValidationRange: Story = {
  args: {
    id: 'amount-range',
    name: 'amountRange',
    label: 'Bet Amount',
    placeholder: 'Enter bet amount',
    min: 5,
    max: 100,
    step: 1,
    decimals: 0,
    symbol: '$',
    symbolPosition: 'prefix',
    helperText: 'Bets must be between $5 and $100',
    defaultValue: '3', // Below minimum to trigger validation
  },
};

// Required field
export const Required: Story = {
  args: {
    id: 'amount-required',
    name: 'amountRequired',
    label: 'Required Amount',
    placeholder: 'Enter amount',
    validation: {
      required: true,
    },
    symbol: '$',
    symbolPosition: 'prefix',
    helperText: 'An amount is required',
  },
};

// With custom validation
export const WithCustomValidation: Story = {
  args: {
    id: 'amount-validation',
    name: 'amountValidation',
    label: 'Sale Price',
    placeholder: 'Enter sale price',
    helperText: 'Sale price must be a multiple of 0.25',
    symbol: '$',
    symbolPosition: 'prefix',
    validateAmount: (value) => {
      // Check if amount is a multiple of 0.25
      return (value * 100) % 25 === 0 || 'Amount must be a multiple of 0.25';
    },
    defaultValue: '10.30', // Not a multiple of 0.25
  },
};

// With error
export const WithError: Story = {
  args: {
    id: 'amount-error',
    name: 'amountError',
    label: 'Amount with Error',
    placeholder: 'Enter amount',
    symbol: '$',
    symbolPosition: 'prefix',
    showError: 'Insufficient funds in account',
  },
};

// Half width
export const HalfWidth: Story = {
  args: {
    id: 'amount-half',
    name: 'amountHalf',
    label: 'Payment Amount',
    placeholder: 'Enter amount',
    symbol: '$',
    symbolPosition: 'prefix',
    width: 'half',
  },
};
