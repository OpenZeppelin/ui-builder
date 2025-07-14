import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import type {
  FormValues,
  TransactionFormProps,
  TransactionStatusUpdate,
  TxStatus,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { createDefaultFormValues } from '../utils/formUtils';

import { ExecutionConfigDisplay } from './ExecutionConfigDisplay/ExecutionConfigDisplay';
import { TransactionExecuteButton } from './transaction/TransactionExecuteButton';

import { DynamicFormField } from './DynamicFormField';
import { TransactionStatusDisplay } from './transaction';

/**
 * Transaction Form Component
 *
 * This is the main entry point for the app rendering system. It represents the top level of
 * the app rendering architecture:
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
  isWalletConnected = false,
  executionConfig,
}: TransactionFormProps): React.ReactElement {
  const [formError, setFormError] = useState<string | null>(null);
  const [executionConfigError, setExecutionConfigError] = useState<string | null>(null);
  const [runtimeApiKey, setRuntimeApiKey] = useState('');

  // Transaction Lifecycle State
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Derive networkConfig from the adapter instance
  const networkConfig = adapter.networkConfig;

  // Initialize form with React Hook Form
  const methods = useForm<FormValues>({
    mode: schema.validation?.mode || 'onChange',
    defaultValues: createDefaultFormValues(schema.fields, schema.defaultValues),
  });

  // Destructure necessary parts of formState to ensure re-renders
  const { isValid } = methods.formState;

  // Reset form when schema changes
  useEffect(() => {
    methods.reset(createDefaultFormValues(schema.fields, schema.defaultValues));
    setTxStatus('idle');
    setTxHash(null);
    setTxError(null);
    setFormError(null);
    setExecutionConfigError(null);
  }, [schema, methods]);

  // Effect to validate executionConfig
  useEffect(() => {
    const validateExecConfig = async (): Promise<void> => {
      if (executionConfig && adapter && adapter.validateExecutionConfig) {
        try {
          logger.info('TransactionForm', 'Re-validating execution config:', executionConfig);
          const validationResult = await adapter.validateExecutionConfig(executionConfig);
          if (typeof validationResult === 'string') {
            setExecutionConfigError(`Execution Configuration Error: ${validationResult}`);
          } else {
            setExecutionConfigError(null);
          }
        } catch (error) {
          logger.error('TransactionForm', 'Error reactive exec config validation:', error);
          setExecutionConfigError(
            `Exec Config Validation Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      } else {
        setExecutionConfigError(null);
      }
    };
    void validateExecConfig();
  }, [executionConfig, adapter, isWalletConnected]);

  const executeTransaction = async (data: FormValues): Promise<void> => {
    logger.info('TransactionForm', 'Internal form submission attempt', data);
    setTxStatus('idle');
    setTxHash(null);
    setTxError(null);

    if (!adapter) {
      logger.error('TransactionForm', 'Adapter not provided.');
      setTxError('Configuration error: Adapter not available.');
      setTxStatus('error');
      return;
    }
    if (!isWalletConnected) {
      logger.warn('TransactionForm', 'Wallet not connected for submission.');
      setTxError('Please connect your wallet to submit the transaction.');
      setTxStatus('error');
      return;
    }

    try {
      setTxStatus('pendingSignature');
      const formattedData = adapter.formatTransactionData(
        contractSchema,
        schema.functionId as string,
        data,
        schema.fields
      );
      logger.info('TransactionForm', 'Formatted transaction data:', formattedData);

      const onStatusChange = (status: string, details: TransactionStatusUpdate): void => {
        logger.info('TransactionForm', `Status Update: ${status}`, details);
        setTxStatus(status as TxStatus);
        if (details.transactionId) {
          setTxHash(details.transactionId); // Show relayer ID
        }
        if (details.txHash) {
          setTxHash(details.txHash); // Show final hash
        }
      };

      // The initial status is set by the strategy via the callback
      const { txHash: finalTxHash } = await adapter.signAndBroadcast(
        formattedData,
        executionConfig || { method: 'eoa', allowAny: true },
        onStatusChange,
        runtimeApiKey
      );

      logger.info('TransactionForm', `Transaction submitted with final hash: ${finalTxHash}`);
      setTxHash(finalTxHash);

      // --> Start: Wait for confirmation <--
      if (adapter.waitForTransactionConfirmation) {
        setTxStatus('pendingConfirmation');
        logger.info('TransactionForm', `Waiting for confirmation for tx: ${finalTxHash}`);
        const confirmationResult = await adapter.waitForTransactionConfirmation(finalTxHash);
        if (confirmationResult.status === 'success') {
          logger.info(
            'TransactionForm',
            `Transaction confirmed: ${finalTxHash}`,
            confirmationResult.receipt
          );
          setTxStatus('success');
          setTxError(null);
        } else {
          logger.error(
            'TransactionForm',
            `Transaction failed confirmation: ${finalTxHash}`,
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
      logger.error('TransactionForm', 'Transaction error during submission process:', error);
      setTxError(error instanceof Error ? error.message : 'An unknown error occurred.');
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

  // TODO: temporary, refactor to use the button component from the ui package
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
      <div className="mb-4 flex items-center justify-between">
        {schema.title && <h2 className="text-xl font-bold">{schema.title}</h2>}
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
          onSubmit={methods.handleSubmit(executeTransaction)}
        >
          <div className="mb-6">{renderFormContent()}</div>

          {/* Execution Config Display - Placed above the form actions */}
          {executionConfig && (
            <div className="w-full">
              <ExecutionConfigDisplay
                executionConfig={executionConfig}
                adapter={adapter}
                error={executionConfigError}
                onRuntimeApiKeyChange={setRuntimeApiKey}
              />
            </div>
          )}

          {/* Form actions - Button only */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex justify-end items-center gap-2">
              <TransactionExecuteButton
                isWalletConnected={isWalletConnected}
                isSubmitting={txStatus === 'pendingSignature' || txStatus === 'pendingConfirmation'}
                isFormValid={isValid && executionConfigError === null}
                variant={getButtonVariant()}
              />
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
