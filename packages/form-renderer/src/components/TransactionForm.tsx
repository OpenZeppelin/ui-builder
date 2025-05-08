import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import type {
  FormValues,
  TransactionFormProps,
  TxStatus,
} from '@openzeppelin/transaction-form-types';

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
}: TransactionFormProps): React.ReactElement {
  const [formError, setFormError] = useState<string | null>(null);

  // Transaction Lifecycle State
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Use the wallet connection context
  const { isConnected } = useWalletConnection();

  // Derive networkConfig from the adapter instance
  const networkConfig = adapter.networkConfig;

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
    logger.info('TransactionForm', 'Form submitted', data);
    setTxStatus('idle'); // Reset status on new submission
    setTxHash(null);
    setTxError(null);

    if (!adapter) {
      logger.error('TransactionForm', 'Adapter not provided');
      setTxError('Configuration error: Adapter not available.');
      setTxStatus('error');
      return;
    }

    const connectionStatus = adapter.getWalletConnectionStatus();
    if (!connectionStatus.isConnected) {
      logger.warn('TransactionForm', 'Wallet not connected for submission');
      setTxError('Please connect your wallet to submit the transaction.');
      setTxStatus('error');
      return;
    }

    try {
      setTxStatus('pendingSignature');
      const formattedData = adapter.formatTransactionData(
        contractSchema,
        schema.functionId as string, // TODO: Ensure functionId is present
        data,
        schema.fields // Pass all fields config
      );
      logger.info('TransactionForm', 'Formatted transaction data:', formattedData);

      const { txHash: submittedTxHash } = await adapter.signAndBroadcast(formattedData);
      logger.info('TransactionForm', `Transaction submitted with hash: ${submittedTxHash}`);
      setTxHash(submittedTxHash);

      // --> Start: Wait for confirmation <--
      if (adapter.waitForTransactionConfirmation) {
        setTxStatus('pendingConfirmation');
        logger.info('TransactionForm', `Waiting for confirmation for tx: ${submittedTxHash}`);
        const confirmationResult = await adapter.waitForTransactionConfirmation(submittedTxHash);
        if (confirmationResult.status === 'success') {
          logger.info(
            'TransactionForm',
            `Transaction confirmed: ${submittedTxHash}`,
            confirmationResult.receipt
          );
          setTxStatus('success');
          setTxError(null);
        } else {
          logger.error(
            'TransactionForm',
            `Transaction failed confirmation: ${submittedTxHash}`,
            confirmationResult.error
          );
          setTxError(
            confirmationResult.error?.message ?? 'Transaction failed during confirmation.'
          );
          setTxStatus('error');
        }
      } else {
        // If adapter doesn't support waiting, consider submission as success immediately
        logger.warn(
          'TransactionForm',
          'Adapter does not support waitForTransactionConfirmation. Marking as success after submission.'
        );
        setTxStatus('success'); // Or maybe a different status like 'submitted'?
        setTxError(null);
      }
      // --> End: Wait for confirmation <--
    } catch (error) {
      logger.error('TransactionForm', 'Transaction error:', error);
      setTxError(error instanceof Error ? error.message : 'An unknown error occurred.');
      setTxStatus('error');
      // Keep txHash if it was set before the error (e.g., during signAndBroadcast)
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

  // Get explorer URL for the transaction
  const getExplorerTxUrl = (hash: string): string | null => {
    if (!adapter || !hash || !networkConfig) return null;

    if (adapter.getExplorerTxUrl) {
      // Call adapter method (which uses its internal networkConfig)
      return adapter.getExplorerTxUrl(hash);
    }

    // Fallback using getExplorerUrl (also uses internal networkConfig)
    console.warn(
      'getExplorerTxUrl not implemented by adapter, trying getExplorerUrl as fallback (might expect address).'
    );
    // Ensure adapter.getExplorerUrl exists before calling
    return adapter.getExplorerUrl ? adapter.getExplorerUrl(hash) : null;
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

        {/* Transaction Status Display - Moved OUTSIDE the form to avoid pointer-events-none */}
        {txStatus !== 'idle' && (
          <div className="mb-8 pointer-events-auto">
            <TransactionStatusDisplay
              status={txStatus}
              txHash={txHash}
              error={txError}
              explorerUrl={txHash ? getExplorerTxUrl(txHash) : null}
              onClose={handleResetStatus}
            />
          </div>
        )}

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
