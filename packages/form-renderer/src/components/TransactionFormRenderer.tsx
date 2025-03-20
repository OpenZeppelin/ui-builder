import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { FormError, FormValues, TransactionFormRendererProps } from '../types/FormTypes';

import { DynamicFormField } from './DynamicFormField';

/**
 * Transaction Form Renderer Component
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
export function TransactionFormRenderer({
  formSchema,
  adapter,
  onSubmit,
  previewMode = false,
}: TransactionFormRendererProps): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Create default values from the schema
  const defaultValues = formSchema.fields.reduce<Record<string, unknown>>((acc, field) => {
    if (field.defaultValue !== undefined) {
      acc[field.id] = field.defaultValue;
    }
    return acc;
  }, {});

  // Initialize React Hook Form
  const methods = useForm<FormValues>({
    mode: formSchema.validation?.mode || 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues,
  });

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
  } = methods;

  // Reset form when schema changes
  useEffect(() => {
    reset(defaultValues);
  }, [formSchema, reset, defaultValues]);

  // Handle form submission
  const handleFormSubmit = async (data: FormValues): Promise<void> => {
    if (previewMode) {
      console.log('Form data preview:', data);
      onSubmit?.(data);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Apply output transformations
      let transformedData = { ...data };

      // Apply field transforms
      formSchema.fields.forEach((field) => {
        if (field.transforms?.output && data[field.id] !== undefined) {
          transformedData[field.id] = field.transforms.output(data[field.id]);
        }
      });

      // Format data for blockchain transaction
      const transactionData = adapter?.formatTransactionData
        ? adapter.formatTransactionData(formSchema.id.replace('form-', ''), transformedData)
        : transformedData;

      // Submit transaction if adapter is provided, otherwise call onSubmit
      if (onSubmit) {
        onSubmit(transactionData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get submit button variant from schema or default to "primary"
  const submitButtonVariant = formSchema.submitButton?.variant || 'primary';

  // Determine if error summary should be shown
  const showErrorSummary =
    formSchema.validation?.showErrors === 'summary' || formSchema.validation?.showErrors === 'both';

  return (
    <FormProvider {...methods}>
      <div className="transaction-form">
        {/* Form title */}
        {formSchema.title && <h2 className="form-title">{formSchema.title}</h2>}

        {/* Form description */}
        {formSchema.description && <p className="form-description">{formSchema.description}</p>}

        {/* Error summary */}
        {showErrorSummary && Object.keys(errors).length > 0 && (
          <div className="error-summary">
            <p>Please fix the following errors:</p>
            <ul>
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>
                  {field}: {getErrorMessage(error as FormError)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Form body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          {/* Render form sections or fields directly */}
          {formSchema.layout?.sections ? (
            // Render form with sections
            formSchema.layout.sections.map((section) => (
              <div className="form-section" key={section.id}>
                {section.title && <h3 className="section-title">{section.title}</h3>}
                {section.description && (
                  <p className="section-description">{section.description}</p>
                )}
                <div className="section-fields">
                  {section.fields.map((fieldId) => {
                    const field = formSchema.fields.find((f) => f.id === fieldId);
                    if (!field) return null;

                    return (
                      <div className="field-wrapper" key={field.id}>
                        <DynamicFormField
                          field={field}
                          control={control}
                          error={getErrorMessage(errors[field.id] as FormError)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            // Render fields directly if no layout is provided
            <div className="form-fields">
              {formSchema.fields.map((field) => (
                <div className="field-wrapper" key={field.id}>
                  <DynamicFormField
                    field={field}
                    control={control}
                    error={getErrorMessage(errors[field.id] as FormError)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Submit error message */}
          {submitError && (
            <div className="submit-error">
              <p>{submitError}</p>
            </div>
          )}

          {/* Submit button */}
          <div className="form-actions">
            <button
              type="submit"
              className={`submit-button ${submitButtonVariant} ${isSubmitting ? 'submitting' : ''}`}
              disabled={isSubmitting || (formSchema.validation?.mode === 'onChange' && !isValid)}
            >
              {isSubmitting
                ? formSchema.submitButton?.loadingText || 'Submitting...'
                : formSchema.submitButton?.text || 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

/**
 * Extracts error message from react-hook-form errors
 */
function getErrorMessage(error: FormError): string | undefined {
  if (!error) return undefined;

  // Field errors can have different shapes in react-hook-form
  // This handles both simple string messages and objects with message property
  return typeof error === 'string' ? error : error.message || 'Invalid input';
}
