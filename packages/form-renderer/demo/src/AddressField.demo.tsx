import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { AddressField } from '../../src/components/fields/AddressField';

interface FormValues {
  walletAddress: string;
  contractAddress: string;
  customAddress: string;
}

// Simple EVM address validation for demo
const isValidEvmAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Demo component for AddressField
 * Shows React Hook Form integration with AddressField
 */
export default function AddressFieldDemo(): React.ReactElement {
  // Setup for React Hook Form integration
  const formMethods = useForm<FormValues>({
    mode: 'onChange', // Validate on change
    defaultValues: {
      walletAddress: '',
      contractAddress: '',
      customAddress: '',
    },
    // Add validation rules using React Hook Form
    resolver: (values) => {
      const errors: Record<string, { type: string; message: string }> = {};

      // Wallet Address validation
      if (!values.walletAddress) {
        errors.walletAddress = {
          type: 'required',
          message: 'Wallet address is required',
        };
      } else if (!isValidEvmAddress(values.walletAddress)) {
        errors.walletAddress = {
          type: 'pattern',
          message: 'Please enter a valid EVM address (0x followed by 40 hex characters)',
        };
      }

      // Contract Address validation
      if (!values.contractAddress) {
        errors.contractAddress = {
          type: 'required',
          message: 'Contract address is required',
        };
      } else if (!isValidEvmAddress(values.contractAddress)) {
        errors.contractAddress = {
          type: 'pattern',
          message: 'Please enter a valid EVM address (0x followed by 40 hex characters)',
        };
      }

      // Custom Address validation
      if (values.customAddress && !values.customAddress.startsWith('0x')) {
        errors.customAddress = {
          type: 'pattern',
          message: 'Address must start with 0x',
        };
      }

      return {
        values,
        errors: Object.keys(errors).length > 0 ? errors : {},
      };
    },
  });

  const { handleSubmit, control, formState } = formMethods;
  const { errors, isValid, isSubmitting, isDirty } = formState;

  // Form submission handler
  const onSubmit = (data: FormValues): void => {
    console.log('Form submitted:', data);
    // Would typically send to API here
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-foreground mb-8 text-2xl font-bold">AddressField Component</h1>

      <div className="space-y-6">
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <div className="mb-6 flex flex-col space-y-1.5">
            <h3 className="text-xl leading-none font-semibold tracking-tight">
              React Hook Form Integration
            </h3>
            <p className="text-muted-foreground text-sm">
              AddressField is designed specifically for blockchain addresses with React Hook Form
              integration. It handles validation, errors, and form state automatically.
            </p>
          </div>

          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <AddressField<FormValues>
                  id="wallet-address-field"
                  control={control}
                  name="walletAddress"
                  label="Wallet Address"
                  placeholder="0x..."
                  helperText="Enter your EVM wallet address"
                  width="full"
                />

                <AddressField<FormValues>
                  id="contract-address-field"
                  control={control}
                  name="contractAddress"
                  label="Contract Address"
                  placeholder="0x..."
                  helperText="Enter a smart contract address"
                  width="full"
                />

                <AddressField<FormValues>
                  id="custom-address-field"
                  control={control}
                  name="customAddress"
                  label="Custom Address (Optional)"
                  placeholder="0x..."
                  helperText="Optional address with custom validation"
                  validateAddress={(address) => address.startsWith('0x')}
                  width="full"
                />
              </div>

              {/* Debug section */}
              <div className="border-border/40 bg-muted/50 rounded-lg border p-4">
                <h4 className="mb-3 text-sm font-medium">Form State</h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Valid:</span>
                      <span className={isValid ? 'text-success' : 'text-muted-foreground'}>
                        {isValid ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Submitting:</span>
                      <span className={isSubmitting ? 'text-info' : 'text-muted-foreground'}>
                        {isSubmitting ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Dirty:</span>
                      <span className={isDirty ? 'text-info' : 'text-muted-foreground'}>
                        {isDirty ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Errors:</span>
                      <span
                        className={
                          Object.keys(errors).length > 0 ? 'text-destructive' : 'text-success'
                        }
                      >
                        {Object.keys(errors).length > 0 ? 'Yes' : 'None'}
                      </span>
                    </div>
                  </div>

                  {Object.keys(errors).length > 0 && (
                    <div className="mt-2">
                      <h5 className="mb-1 text-xs font-medium">Error Details:</h5>
                      <pre className="bg-background max-h-24 overflow-auto rounded-md border p-2 text-xs">
                        {JSON.stringify(errors, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 font-medium shadow transition-colors disabled:opacity-50"
                >
                  Submit Form
                </button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
