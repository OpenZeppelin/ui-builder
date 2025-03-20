import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { TextField } from '../../src/components/fields/TextField';

interface FormValues {
  username: string;
  email: string;
}

/**
 * Demo component for TextField
 * Shows basic usage and React Hook Form integration
 */
export default function TextFieldDemo() {
  // State for standalone text field
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();

  // Setup for React Hook Form integration
  const formMethods = useForm<FormValues>({
    mode: 'onChange', // Validate on change
    defaultValues: {
      username: '',
      email: '',
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

  // Validation handler for standalone field
  const handleChange = (newValue: string) => {
    setValue(newValue);

    if (newValue.length < 3) {
      setError('Input must be at least 3 characters');
    } else {
      setError(undefined);
    }
  };

  // Form submission handler
  const onSubmit = (data: FormValues) => {
    console.log('Form submitted:', data);
    // Would typically send to API here
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-foreground mb-8 text-2xl font-bold">TextField Component</h1>

      <div className="space-y-10">
        {/* Standalone Usage */}
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <div className="mb-6 flex flex-col space-y-1.5">
            <h3 className="text-xl leading-none font-semibold tracking-tight">Basic Usage</h3>
            <p className="text-muted-foreground text-sm">
              TextField can be used standalone with your own state management.
            </p>
          </div>

          <div className="space-y-6">
            <TextField
              id="standalone-field"
              label="Name"
              value={value}
              onChange={handleChange}
              placeholder="Enter your name"
              helperText="Please enter at least 3 characters"
              error={error}
              name="name"
            />

            <div className="border-border/40 bg-muted/50 rounded-lg border p-4">
              <h4 className="mb-2 text-sm font-medium">Current Value:</h4>
              <code className="bg-background rounded border px-2 py-1 text-sm">
                {value || '""'}
              </code>
            </div>
          </div>
        </div>

        {/* React Hook Form Integration */}
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <div className="mb-6 flex flex-col space-y-1.5">
            <h3 className="text-xl leading-none font-semibold tracking-tight">
              React Hook Form Integration
            </h3>
            <p className="text-muted-foreground text-sm">
              TextField integrates seamlessly with React Hook Form for validation and form state
              management.
            </p>
          </div>

          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <TextField
                  id="username-field"
                  control={control}
                  name="username"
                  label="Username"
                  placeholder="Enter your username"
                  helperText="Username is required and must be at least 5 characters"
                />

                <TextField
                  id="email-field"
                  control={control}
                  name="email"
                  label="Email"
                  placeholder="Enter your email"
                  helperText="Enter a valid email address"
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
