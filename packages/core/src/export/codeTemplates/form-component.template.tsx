/*------------TEMPLATE COMMENT START------------*/
/**
 * Form Component Template
 *
 * Uses a template syntax that's compatible with TypeScript and Prettier:
 * - "@@param-name@@" - Template variable markers (consistent across all templates)
 */
/*------------TEMPLATE COMMENT END------------*/
import { useState } from 'react';

import {
  RenderFormSchema,
  TransactionForm,
  TransactionFormProps,
} from '@openzeppelin/transaction-form-renderer';

/*------------TEMPLATE COMMENT START------------*/
// This import will be replaced at generation time
/*------------TEMPLATE COMMENT END------------*/
// @ts-expect-error - This is a placeholder for the correct adapter import
import { AdapterPlaceholder } from '../adapters/@@chain-type@@/adapter';

// Define type for transaction result (this will be implemented in the future)
interface TransactionResult {
  txHash?: string;
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

  // Create the adapter instance for @@chain-type@@
  /*------------TEMPLATE COMMENT START------------*/
  // @@adapter-class-name@@ will be replaced at generation time
  /*------------TEMPLATE COMMENT END------------*/
  const adapter = new AdapterPlaceholder();

  // Form schema generated from the builder
  /*------------TEMPLATE COMMENT START------------*/
  // This is an empty object that will be replaced at generation time
  /*------------TEMPLATE COMMENT END------------*/
  // @ts-expect-error - This is a placeholder for the correct form schema import
  const formSchema: RenderFormSchema = {};

  // Add title and other required properties for RenderFormSchema
  // TODO: review this, we should not need to do this as it all should come from the builder
  formSchema.id = 'form-@@function-id@@';
  formSchema.title = 'Transaction Form for @@function-id@@';
  formSchema.submitButton = {
    text: 'Submit Transaction',
    loadingText: 'Processing...',
    variant: 'primary',
  };

  // Handle form submission
  const handleSubmit = (formData: FormData) => {
    // If an external submission handler is provided, use it
    if (onSubmit) {
      // Result will be something like { txHash: '0x123' } or { error: 'Error message' }
      // This will be implemented in the future, when we actually submit the transaction
      const result = { txHash: '0x123' }; // result will be returned from the external submission handler, but for now we'll just return a hardcoded value
      onSubmit(formData);
      setTransactionResult({ txHash: '0x123' });
      return result;
    } else {
      throw new Error('No submission handler provided');
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

      <TransactionForm schema={formSchema} adapter={adapter} onSubmit={handleSubmit} />
    </div>
  );
}
