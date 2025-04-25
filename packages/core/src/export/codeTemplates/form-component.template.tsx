/*------------TEMPLATE COMMENT START------------*/
/**
 * Form Component Template
 *
 * Uses a template syntax that's compatible with TypeScript and Prettier:
 * - "@@param-name@@" - Template variable markers (consistent across all templates)
 */
/*------------TEMPLATE COMMENT END------------*/
import { useEffect, useMemo, useState } from 'react';

import { ContractStateWidget, TransactionForm } from '@openzeppelin/transaction-form-renderer';
import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';
import type {
  FormFieldType,
  RenderFormSchema,
  TransactionFormProps,
} from '@openzeppelin/transaction-form-types/forms';

/*------------TEMPLATE COMMENT START------------*/
// This import will be replaced at generation time
/*------------TEMPLATE COMMENT END------------*/
// @ts-expect-error - This is a placeholder for the correct adapter import
import { AdapterPlaceholder } from '../adapters/@@chain-type@@/adapter';

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

  // Create the adapter instance for @@chain-type@@
  /*------------TEMPLATE COMMENT START------------*/
  // @@adapter-class-name@@ will be replaced at generation time
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

  // @ts-expect-error - contractAddress will be present at generation time
  const contractAddress = formSchema.contractAddress;

  useEffect(() => {
    if (contractAddress) {
      adapter.loadContract(contractAddress).then(setContractSchema);
    }
  }, [contractAddress, adapter]);

  const toggleWidget = () => {
    setIsWidgetVisible((prev) => !prev);
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
        console.log('Mock submission successful!');
      }
    } catch (error) {
      console.error('Submission error:', error);
      // TODO: Set an error state to display to the user
      setTransactionResult({ error: (error as Error).message });
    }
  };

  return (
    <div className="generated-form-container">
      {transactionResult && (
        <div className="transaction-result mb-4 rounded-md bg-green-50 p-4 text-green-800">
          <h3 className="font-medium">Transaction Successful!</h3>
          <p className="mt-2 text-sm">Transaction Hash: {transactionResult.txHash || 'N/A'}</p>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <TransactionForm schema={formSchema} adapter={adapter} onSubmit={handleSubmit} />
        </div>

        {/* Right sidebar with ContractStateWidget */}
        {contractSchema && contractAddress && (
          <div className="w-[300px] flex-shrink-0">
            <div className="sticky top-4">
              <ContractStateWidget
                contractSchema={contractSchema}
                contractAddress={contractAddress}
                adapter={adapter}
                isVisible={isWidgetVisible}
                onToggle={toggleWidget}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
