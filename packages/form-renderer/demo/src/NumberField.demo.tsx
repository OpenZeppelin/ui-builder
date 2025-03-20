import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { NumberField } from '../../src/components/fields/NumberField';

interface FormValues {
  age: number;
  quantity: number;
  price: number;
}

/**
 * Demo component for NumberField
 * Shows React Hook Form integration with NumberField
 */
export default function NumberFieldDemo(): React.ReactElement {
  // Setup for React Hook Form integration
  const formMethods = useForm<FormValues>({
    mode: 'onChange', // Validate on change
    defaultValues: {
      age: 0,
      quantity: 1,
      price: 0,
    },
    // Add validation rules using React Hook Form
    resolver: (values) => {
      const errors: Record<string, { type: string; message: string }> = {};

      // Age validation
      if (values.age < 18) {
        errors.age = {
          type: 'min',
          message: 'Age must be at least 18',
        };
      } else if (values.age > 120) {
        errors.age = {
          type: 'max',
          message: 'Age must be less than 120',
        };
      }

      // Quantity validation
      if (values.quantity < 1) {
        errors.quantity = {
          type: 'min',
          message: 'Quantity must be at least 1',
        };
      } else if (values.quantity > 100) {
        errors.quantity = {
          type: 'max',
          message: 'Quantity cannot exceed 100',
        };
      }

      // Price validation
      if (values.price < 0) {
        errors.price = {
          type: 'min',
          message: 'Price cannot be negative',
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
      <h1 className="text-foreground mb-8 text-2xl font-bold">NumberField Component</h1>

      <div className="space-y-6">
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <div className="mb-6 flex flex-col space-y-1.5">
            <h3 className="text-xl leading-none font-semibold tracking-tight">
              React Hook Form Integration
            </h3>
            <p className="text-muted-foreground text-sm">
              NumberField is designed specifically for numerical inputs with React Hook Form
              integration. It handles validation, errors, and form state automatically.
            </p>
          </div>

          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <NumberField<FormValues>
                  id="age-field"
                  control={control}
                  name="age"
                  label="Age"
                  placeholder="Enter your age"
                  helperText="Must be between 18 and 120"
                  min={0}
                  max={120}
                  width="half"
                />

                <NumberField<FormValues>
                  id="quantity-field"
                  control={control}
                  name="quantity"
                  label="Quantity"
                  placeholder="Enter quantity"
                  helperText="Must be between 1 and 100"
                  min={1}
                  max={100}
                  step={1}
                  width="half"
                />

                <NumberField<FormValues>
                  id="price-field"
                  control={control}
                  name="price"
                  label="Price"
                  placeholder="Enter price"
                  helperText="Price in ETH"
                  min={0}
                  step={0.01}
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
