import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { TextField } from '../../src/components/fields/TextField';

interface FormValues {
  username: string;
  email: string;
  feedback: string;
}

/**
 * Demo component for TextField
 * Shows React Hook Form integration with TextField
 */
export default function TextFieldDemo(): React.ReactElement {
  // Setup for React Hook Form integration
  const formMethods = useForm<FormValues>({
    mode: 'onChange', // Validate on change
    defaultValues: {
      username: '',
      email: '',
      feedback: '',
    },
    // Add validation rules using React Hook Form
    resolver: (values) => {
      const errors: Record<string, { type: string; message: string }> = {};

      // Username validation
      if (!values.username) {
        errors.username = {
          type: 'required',
          message: 'Username is required',
        };
      } else if (values.username.length < 5) {
        errors.username = {
          type: 'minLength',
          message: 'Username must be at least 5 characters',
        };
      }

      // Email validation
      if (!values.email) {
        errors.email = {
          type: 'required',
          message: 'Email is required',
        };
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
        errors.email = {
          type: 'pattern',
          message: 'Please enter a valid email address',
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
      <h1 className="text-foreground mb-8 text-2xl font-bold">TextField Component</h1>

      <div className="space-y-6">
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <div className="mb-6 flex flex-col space-y-1.5">
            <h3 className="text-xl leading-none font-semibold tracking-tight">
              React Hook Form Integration
            </h3>
            <p className="text-muted-foreground text-sm">
              TextField is designed specifically for React Hook Form integration. It handles
              validation, errors, and form state automatically.
            </p>
          </div>

          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <TextField<FormValues>
                  id="username-field"
                  control={control}
                  name="username"
                  label="Username"
                  placeholder="Enter your username"
                  helperText="Username is required and must be at least 5 characters"
                />

                <TextField<FormValues>
                  id="email-field"
                  control={control}
                  name="email"
                  label="Email"
                  placeholder="Enter your email"
                  helperText="Enter a valid email address"
                />

                <TextField<FormValues>
                  id="feedback-field"
                  control={control}
                  name="feedback"
                  label="Feedback"
                  placeholder="Tell us what you think"
                  helperText="Optional feedback"
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
