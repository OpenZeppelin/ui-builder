import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import type { FormValues, TransactionFormProps } from '@openzeppelin/transaction-form-types/forms';
import type { TransactionStatus } from '@openzeppelin/transaction-form-types/transactions/status';

import { createDefaultFormValues } from '../utils/formUtils';
import { logger } from '../utils/logger';

import { TransactionExecuteButton } from './transaction/TransactionExecuteButton';
import { WalletConnectButton } from './wallet/WalletConnectButton';
import { useWalletConnection } from './wallet/useWalletConnection';

import { DynamicFormField } from './DynamicFormField';
import { TransactionStatusDisplay } from './transaction';

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
  contractSchema,
  adapter,
  onSubmit,
}: TransactionFormProps): React.ReactElement {
  const [formError, setFormError] = useState<string | null>(null);

  // Transaction Lifecycle State
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Use the wallet connection context
  const { isConnected } = useWalletConnection();

  // Initialize form with React Hook Form
  const methods = useForm<FormValues>({
    mode: schema.validation?.mode || 'onChange',
    defaultValues: createDefaultFormValues(schema.fields, schema.defaultValues),
  });

  // Reset form when schema changes
  useEffect(() => {
    methods.reset(createDefaultFormValues(schema.fields, schema.defaultValues));
    setTxStatus('idle');
    setTxHash(null);
    setTxError(null);
    setFormError(null);
  }, [schema, methods]);

  // Form submission handler - Actual transaction logic
  const handleSubmit = async (data: FormValues): Promise<void> => {
    if (!isConnected) {
      setTxError('Wallet not connected.');
      setTxStatus('error');
      return;
    }

    setTxStatus('pendingSignature');
    setTxHash(null);
    setTxError(null);
    setFormError(null);

    try {
      // 1. Format transaction data using the adapter
      const functionId = schema.functionId || 'unknown';
      const formattedData = adapter.formatTransactionData(
        contractSchema,
        functionId,
        data,
        schema.fields
      );

      // 2. Sign and broadcast transaction using the adapter
      const result = await adapter.signAndBroadcast(formattedData);

      // 3. Update state on successful initiation
      setTxHash(result.txHash);
      setTxStatus('pendingConfirmation'); // Move to pending confirmation
      logger.info('TransactionForm', 'Transaction submitted:', result.txHash);

      // Call original onSubmit if provided
      if (onSubmit) {
        logger.info(
          'TransactionForm',
          'Calling original onSubmit after transaction submission attempt.'
        );
      }
    } catch (error) {
      logger.error('TransactionForm', 'Transaction Error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown transaction error occurred.';
      setTxError(errorMessage);
      setTxStatus('error');
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

  const handleResetStatus = (): void => {
    setTxStatus('idle');
    setTxHash(null);
    setTxError(null);
  };

  return (
    <FormProvider {...methods}>
      {/* Header with wallet connection */}
      <div className="mb-4 flex items-center justify-between">
        {schema.title && <h2 className="text-xl font-bold">{schema.title}</h2>}
        <div className="wallet-connection">
          <WalletConnectButton />
        </div>
      </div>

      {/* Always render description container, just change content */}
      <div className="description-container mb-6">
        <p className="text-muted-foreground rounded-md border border-gray-100 bg-gray-50 p-3 text-sm">
          {schema.description || 'No description provided.'}
        </p>
      </div>

      <div className="flex flex-col space-y-4">
        {/* Display General Form Error (if any) */}
        {formError && (
          <div className="form-error rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {formError}
          </div>
        )}

        {/* Render the Transaction Status Display */}
        <TransactionStatusDisplay
          status={txStatus}
          txHash={txHash}
          error={txError}
          // Pass explorer URL (will be null initially, adapter provides it)
          explorerUrl={txHash ? adapter.getExplorerUrl(txHash) : null}
          onClose={handleResetStatus}
          className="mb-4"
        />

        <form
          className={`transaction-form flex flex-col ${getLayoutClasses()} ${txStatus !== 'idle' ? 'opacity-70 pointer-events-none' : ''}`}
          noValidate
          onSubmit={methods.handleSubmit(handleSubmit)}
        >
          <div className="mb-6">{renderFormContent()}</div>

          {/* Form actions */}
          <div className="form-actions mt-4 flex justify-end border-t border-gray-100 pt-4">
            <TransactionExecuteButton
              isWalletConnected={isConnected}
              isSubmitting={txStatus === 'pendingSignature' || txStatus === 'pendingConfirmation'}
              isFormValid={methods.formState.isValid}
              variant={getButtonVariant()}
            />
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
