import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { FormValues, TransactionFormProps } from '@openzeppelin/transaction-form-types/forms';

import { useWalletConnection } from '../hooks/useWalletConnection';

import { TransactionExecuteButton } from './transaction/TransactionExecuteButton';
import { WalletConnectButton } from './wallet/WalletConnectButton';

import { DynamicFormField } from './DynamicFormField';

/**
 * Transaction Form Component
 *
 * This is the main entry point for the form rendering system. It represents the top level of
 * the form rendering architecture:
 *
 * 1. TransactionForm receives a schema and adapter from the transaction form builder
 * 2. It sets up React Hook Form for state management and validation
 * 3. It renders fields dynamically using the DynamicFormField component
 * 4. Provides wallet connection UI (demo implementation)
 * 5. On submission, it processes data through the adapter before passing to handlers
 *
 * Note: The previewMode prop is currently used only for demo purposes and does not affect
 * the visibility of wallet connection or transaction execution UI. In the future, it will be used
 * to enable/disable actual blockchain interactions without changing the UI structure.
 *
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
  const [transactionSuccess, setTransactionSuccess] = useState(false);

  // Use the wallet connection hook
  const { isConnected, handleConnectionChange } = useWalletConnection();

  // Initialize form with React Hook Form
  const methods = useForm<FormValues>({
    mode: schema.validation?.mode || 'onChange',
    defaultValues: schema.defaultValues || {},
  });

  // Reset form when schema changes
  useEffect(() => {
    methods.reset(schema.defaultValues || {});
  }, [schema, methods]);

  // Form submission handler - use previewMode here to determine whether actual transaction execution
  // should happen in the future, without changing UI
  const handleSubmit = async (data: FormValues): Promise<void> => {
    setSubmitting(true);
    setFormError(null);
    setTransactionSuccess(false);

    try {
      // Add artificial delay to ensure loading state is visible
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Format data for submission using the adapter
      const functionId = schema.functionId || 'unknown';
      const formattedData = adapter.formatTransactionData(functionId, data, schema.fields);

      // In future implementation, previewMode would prevent actual blockchain interaction
      // but for now, we'll just pass the formatted data to the onSubmit handler regardless
      if (!previewMode) {
        // Future: Here we would handle actual blockchain transaction
        // This is where wallet connection would be required
      }

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

      // Simulate transaction success after a delay
      setTimeout(() => {
        setTransactionSuccess(true);
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setTransactionSuccess(false);
        }, 5000);

        // Keep loading state visible until transaction completes
        setSubmitting(false);
      }, 1500);
    } catch (error) {
      setFormError((error as Error).message || 'An error occurred during submission');
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
            adapter={adapter}
          />
        ))}
      </div>
    );
  };

  // Apply fixed column layout
  // TODO: Add support for layout customization in the UI
  const getLayoutClasses = (): string => {
    // Fixed layout with 1 column and normal spacing
    return 'grid grid-cols-1 gap-4';
  };

  // Determine button variant based on schema configuration
  const getButtonVariant = ():
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link' => {
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

  // Close success message
  const handleCloseSuccess = (): void => {
    setTransactionSuccess(false);
  };

  return (
    <FormProvider {...methods}>
      {/* Header with wallet connection */}
      <div className="mb-4 flex items-center justify-between">
        {schema.title && <h2 className="text-xl font-bold">{schema.title}</h2>}
        <div className="wallet-connection">
          <WalletConnectButton onConnectionChange={handleConnectionChange} />
        </div>
      </div>

      {/* Always render description container, just change content */}
      <div className="description-container mb-6">
        <p className="text-muted-foreground rounded-md border border-gray-100 bg-gray-50 p-3 text-sm">
          {schema.description || 'No description provided.'}
        </p>
      </div>

      <div className="flex flex-col space-y-4">
        {formError && (
          <div className="form-error rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {formError}
          </div>
        )}

        {transactionSuccess && (
          <div className="transaction-success rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Transaction executed successfully!</p>
                <p className="text-sm">
                  Transaction hash: 0x{Math.random().toString(16).substring(2, 42)}
                </p>
              </div>
              <button
                type="button"
                className="text-green-700 hover:text-green-900"
                onClick={handleCloseSuccess}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        <form
          className={`transaction-form flex flex-col ${getLayoutClasses()}`}
          noValidate
          onSubmit={methods.handleSubmit(handleSubmit)}
        >
          <div className="mb-6">{renderFormContent()}</div>

          {/* Form actions - always visible regardless of preview mode */}
          <div className="form-actions col-span-full mt-4 pt-4 border-t border-gray-100 flex justify-end">
            <TransactionExecuteButton
              isWalletConnected={isConnected}
              isSubmitting={submitting}
              isFormValid={methods.formState.isValid}
              variant={getButtonVariant()}
            />
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
