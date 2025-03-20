import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { FormValues, TransactionFormProps } from '../types/FormTypes';

import { Button } from './ui/button';
import { DynamicFormField } from './DynamicFormField';

/**
 * Transaction Form Component
 *
 * Core implementation of the form renderer
 *
 * Current implementation includes:
 * - Integration with React Hook Form for state management ✅
 * - Support for form validation from schema ✅
 * - Layout customization with sections ✅
 * - Form submission through adapter ✅
 *
 * TODO: Remaining implementation tasks:
 * 1. Implement additional field components (NumberField, AddressField, etc.)
 * 2. Connect visibility conditions to actual form values using the 'watch' function
 * 3. Complete full test coverage for all form scenarios
 * 4. Add support for complex field types (arrays, nested objects)
 * @returns The rendered form component
 */
export function TransactionForm({
  schema,
  adapter,
  onSubmit,
  previewMode = false,
}: TransactionFormProps): React.ReactElement {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form with React Hook Form
  const methods = useForm<FormValues>({
    mode: schema.validation?.mode || 'onChange',
    defaultValues: schema.defaultValues || {},
  });

  // Reset form when schema changes
  useEffect(() => {
    methods.reset(schema.defaultValues || {});
  }, [schema, methods]);

  // Form submission handler
  const handleSubmit = async (data: FormValues): Promise<void> => {
    setSubmitting(true);
    setFormError(null);

    try {
      // Format data for submission using the adapter
      const functionId = schema.functionId || 'unknown';
      const formattedData = adapter.formatTransactionData(functionId, data);

      // Pass the formatted data to the onSubmit handler
      if (onSubmit) {
        // Create a FormData object if needed for the API
        // Note: Web API FormData is different from our internal FormValues type
        const formData = new FormData();

        // If formattedData is an object, append its properties to the FormData
        if (formattedData && typeof formattedData === 'object') {
          Object.entries(formattedData as Record<string, unknown>).forEach(([key, value]) => {
            formData.append(key, String(value));
          });
        }

        onSubmit(formData);
      }
    } catch (error) {
      setFormError((error as Error).message || 'An error occurred during submission');
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Build form layout with fields
  const renderFormContent = (): React.ReactNode => {
    if (!schema.fields || schema.fields.length === 0) {
      return <div className="form-empty-state">No fields defined in schema</div>;
    }

    const { errors } = methods.formState;

    return (
      <div className="form-fields-container space-y-4">
        {schema.fields.map((field) => (
          <DynamicFormField
            key={field.id}
            field={field}
            control={methods.control}
            error={errors[field.name]?.message as string}
          />
        ))}
      </div>
    );
  };

  // Apply column layout if specified
  const getLayoutClasses = (): string => {
    const { layout } = schema;
    if (!layout) return '';

    const columns = layout.columns || 1;
    return `grid grid-cols-1 md:grid-cols-${columns} gap-${layout.spacing || 4}`;
  };

  // Determine button variant based on schema configuration
  const getButtonVariant = () => {
    const { submitButton } = schema;
    if (!submitButton?.variant) return 'default';

    // Map schema button variant to our button component variants
    switch (submitButton.variant) {
      case 'primary':
        return 'default';
      case 'secondary':
        return 'secondary';
      case 'outline':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col space-y-4">
        {schema.title && <h2 className="text-xl font-bold">{schema.title}</h2>}

        {formError && (
          <div className="form-error rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {formError}
          </div>
        )}

        <form
          onSubmit={methods.handleSubmit(handleSubmit)}
          className={`transaction-form flex flex-col ${getLayoutClasses()}`}
          noValidate
        >
          <div className="mb-6">{renderFormContent()}</div>

          {!previewMode && (
            <div className="form-actions col-span-full">
              <Button type="submit" disabled={submitting} variant={getButtonVariant()}>
                {submitting
                  ? schema.submitButton?.loadingText || 'Submitting...'
                  : schema.submitButton?.text || 'Submit'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </FormProvider>
  );
}
