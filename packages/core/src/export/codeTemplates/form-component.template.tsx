/*------------TEMPLATE COMMENT START------------*/
/**
 * Form Component Template
 *
 * Uses a template syntax that's compatible with TypeScript and Prettier:
 * - "@@param-name@@" - Template variable markers (consistent across all templates)
 */
/*------------TEMPLATE COMMENT END------------*/
/*------------TEMPLATE COMMENT START------------*/
// This import will be replaced at generation time
/*------------TEMPLATE COMMENT END------------*/
// @ts-expect-error - This is a placeholder for the correct adapter import
import { AdapterPlaceholder } from '@@adapter-package-name@@';

import { useEffect, useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContractStateWidget,
  TransactionForm,
  WalletConnectionProvider,
  logger,
} from '@openzeppelin/transaction-form-renderer';
import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';
import type {
  FormFieldType,
  RenderFormSchema,
  TransactionFormProps,
} from '@openzeppelin/transaction-form-types/forms';

// Define type for transaction result (this will be implemented in the future)
interface TransactionResult {
  txHash?: string;
  error?: string;
}

/**
 * Generated Transaction Form for @@function-id@@
 *
 * This component renders a form for interacting with a blockchain contract.
 * It uses the shared form-renderer package which ensures consistent behavior
 * with the preview in the form builder.
 */
export default function GeneratedForm({ onSubmit }: TransactionFormProps) {
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
  const [contractSchema, setContractSchema] = useState<ContractSchema | null>(null);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Create the adapter instance for @@chain-type@@
  /*------------TEMPLATE COMMENT START------------*/
  // AdapterPlaceholder will be replaced at generation time
  /*------------TEMPLATE COMMENT END------------*/
  const adapter = useMemo(() => new AdapterPlaceholder(), []);

  // Form schema generated from the builder and transformed by FormSchemaFactory
  /*------------TEMPLATE COMMENT START------------*/
  // This is an empty object that will be replaced at generation time with a properly
  // transformed RenderFormSchema that includes all necessary properties
  /*------------TEMPLATE COMMENT END------------*/
  // @ts-expect-error - This is a placeholder for the correct form schema import
  const formSchema: RenderFormSchema = {};

  // Original field configurations (including hidden, hardcoded values)
  /*------------TEMPLATE COMMENT START------------*/
  // This is an empty array that will be replaced at generation time with the
  // original, unfiltered FormFieldType[] configuration.
  /*------------TEMPLATE COMMENT END------------*/
  const allFieldsConfig: FormFieldType[] = [];

  // Execution configuration selected in the builder
  /*------------TEMPLATE COMMENT START------------*/
  // This will be replaced at generation time with the stringified ExecutionConfig or 'undefined'.
  // Use 'unknown' for the placeholder type. Assign undefined and use comment marker for replacement.
  /*------------TEMPLATE COMMENT END------------*/
  const executionConfig: unknown | undefined = undefined; /*@@EXECUTION_CONFIG_JSON@@*/
  // TODO (Export Integration): Use executionConfig at runtime to determine
  // how to sign/broadcast (e.g., standard EOA signing, Safe interaction, relayer API).

  const contractAddress = formSchema.contractAddress;

  useEffect(() => {
    setLoadError(null);
    setContractSchema(null);

    if (contractAddress) {
      adapter
        .loadContract(contractAddress)
        .then(setContractSchema)
        .catch((err: unknown) => {
          // Catch error during contract loading
          logger.error('GeneratedForm', 'Error loading contract schema:', err);
          // Create a new Error object if caught value is not already one
          const errorToSet =
            err instanceof Error ? err : new Error('Failed to load contract state');
          setLoadError(errorToSet);
          setContractSchema(null);
        });
    } else {
      setContractSchema(null);
    }
  }, [contractAddress, adapter]);

  const toggleWidget = () => {
    setIsWidgetVisible((prev: boolean) => !prev);
  };

  // Handle form submission - remove async for now
  const handleSubmit = (formData: FormData) => {
    // Log the execution config (will be used for signing/broadcasting logic later)
    console.log('Using Execution Config:', executionConfig);

    // Convert FormData to Record<string, unknown> for adapter
    const submittedInputs: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      submittedInputs[key] = value;
    });

    try {
      const functionId = '@@function-id@@';
      // Format data using the adapter, passing the original field configurations
      const formattedData = adapter.formatTransactionData(
        functionId,
        submittedInputs,
        allFieldsConfig // Pass the original config here
      );

      // --- Integration with onSubmit prop ---
      if (onSubmit) {
        // We might need to reconsider passing raw FormData if onSubmit expects the formatted data
        // For now, assume onSubmit handles the interaction
        onSubmit(formData);
        setTransactionResult({ txHash: '0x_SUBMITTED_VIA_PROP' }); // Indicate submission via prop
      } else {
        // --- Default submission logic (if no onSubmit provided) ---
        // This would typically involve signing and broadcasting
        console.log('Formatted data:', formattedData);
        // const result = await adapter.signAndBroadcast(formattedData);
        // setTransactionResult(result);
        // For template testing:
        setTransactionResult({ txHash: '0x_MOCK_TX_HASH' });
        logger.info('GeneratedForm', 'Mock submission successful!');
      }
    } catch (error) {
      logger.error('GeneratedForm', 'Submission error:', error);
      // TODO: Set an error state to display to the user
      setTransactionResult({ error: (error as Error).message });
    }
  };

  return (
    <WalletConnectionProvider adapter={adapter}>
      <div className="flex gap-4">
        <div className="flex-1">
          <Card>
            <CardHeader>
              {/* Render title unconditionally; React handles empty strings */}
              <CardTitle>{/*@@formSchema.title@@*/}</CardTitle>
              {/* Render description unconditionally */}
              <CardDescription>{/*@@formSchema.description@@*/}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {transactionResult && (
                <div className="transaction-result rounded-md bg-green-50 p-4 text-green-800">
                  <h3 className="font-medium">Transaction Successful!</h3>
                  <p className="mt-2 text-sm">
                    Transaction Hash: {transactionResult.txHash || 'N/A'}
                  </p>
                </div>
              )}
              {/* Check the actual contractAddress variable at runtime */}
              {contractAddress ? (
                <TransactionForm schema={formSchema} adapter={adapter} onSubmit={handleSubmit} />
              ) : (
                <div className="text-destructive-foreground rounded-md bg-destructive p-4">
                  <h3 className="font-medium">Configuration Error</h3>
                  <p className="mt-2 text-sm">Missing contract address in the form schema.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {contractAddress && (
          <div className="w-[300px] flex-shrink-0">
            <div className="sticky top-4">
              <ContractStateWidget
                contractSchema={contractSchema}
                contractAddress={contractAddress}
                adapter={adapter}
                isVisible={isWidgetVisible}
                onToggle={toggleWidget}
                error={loadError}
              />
            </div>
          </div>
        )}
      </div>
    </WalletConnectionProvider>
  );
}
