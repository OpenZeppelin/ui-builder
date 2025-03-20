import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { FormValues, TransactionFormProps } from '../types/FormTypes';

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
        await onSubmit(formattedData);
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
      <div className="form-fields-container">
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

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleSubmit)}
        className={`transaction-form ${getLayoutClasses()}`}
        noValidate
      >
        {schema.title && <h2 className="form-title mb-4 text-xl font-bold">{schema.title}</h2>}
        {formError && (
          <div className="form-error mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {formError}
          </div>
        )}

        {renderFormContent()}

        {!previewMode && (
          <div className="form-actions mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting
                ? schema.submitButton?.loadingText || 'Submitting...'
                : schema.submitButton?.text || 'Submit'}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
