import type { ChainType } from '../../core/types/ContractSchema';
import type { BuilderFormConfig } from '../../core/types/FormTypes';

/**
 * FormCodeGenerator class responsible for generating React components
 * that use the shared form-renderer package.
 *
 * NOTE: This is only one part of the complete export system. A full implementation
 * would need to integrate with the templates package (@openzeppelin/transaction-form-builder-templates)
 * to generate complete projects based on the template files.
 *
 * Current implementation:
 * - Generates only the form component code
 * - Uses a consistent import pattern that works in both dev and production
 *
 * TODO: Integration with templates package:
 * - Add a TemplateManager class that handles template file access
 * - Copy and process all files from the templates package
 * - Replace placeholder files (like FormPlaceholder.tsx) with generated code
 * - Add required adapter files for the selected blockchain
 * - Update package.json with correct dependencies
 * - Generate a complete, runnable project
 */
export class FormCodeGenerator {
  /**
   * Generate a React component for a form that uses the shared form-renderer package.
   * Uses a consistent import path that works in both development and production
   * thanks to pnpm workspace resolution.
   *
   * NOTE: In a complete implementation, this code would be inserted into the template
   * project structure from the templates package, replacing the FormPlaceholder.tsx file.
   *
   * @param formConfig The form configuration from the builder
   * @param chainType The selected blockchain type
   * @param functionId The ID of the contract function
   * @returns Generated React component code as a string
   */
  generateFormComponent(
    formConfig: BuilderFormConfig,
    chainType: ChainType,
    functionId: string
  ): string {
    const adapterClassName = this.getAdapterClassName(chainType);

    return `import React, { useState } from 'react';
import { TransactionForm } from '@openzeppelin/transaction-form-builder-form-renderer';
import { ${adapterClassName} } from '../adapters/${chainType}/adapter';

/**
 * Generated Transaction Form for ${functionId}
 * 
 * This component renders a form for interacting with a blockchain contract.
 * It uses the shared form-renderer package which ensures consistent behavior
 * with the preview in the form builder.
 * 
 * NOTE: In a complete export implementation, this file would replace
 * FormPlaceholder.tsx in the template project structure from the
 * @openzeppelin/transaction-form-builder-templates package.
 */
export default function GeneratedForm({ onSubmit, onError }) {
  const [transactionResult, setTransactionResult] = useState(null);
  
  // Create the adapter instance for ${chainType}
  const adapter = new ${adapterClassName}();
  
  // Form schema generated from the builder
  const formSchema = ${JSON.stringify(formConfig, null, 2)};
  
  // Add the function ID to the schema
  formSchema.functionId = "${functionId}";
  
  // Add title and other required properties for RenderFormSchema
  formSchema.id = "form-${functionId}";
  formSchema.title = "Transaction Form for ${functionId}";
  formSchema.submitButton = {
    text: "Submit Transaction",
    loadingText: "Processing...",
    variant: "primary"
  };
  
  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      // If an external submission handler is provided, use it
      if (onSubmit) {
        const result = await onSubmit(formData);
        setTransactionResult(result);
        return result;
      }
      
      // Otherwise, use the adapter to submit the transaction directly
      const result = await adapter.signAndBroadcast(formData);
      setTransactionResult(result);
      return result;
    } catch (error) {
      console.error('Form submission error:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  };
  
  return (
    <div className="generated-form-container">
      {transactionResult && (
        <div className="transaction-result mb-4 rounded-md bg-green-50 p-4 text-green-800">
          <h3 className="font-medium">Transaction Successful!</h3>
          <p className="mt-2 text-sm">
            Transaction Hash: {transactionResult.txHash || 'N/A'}
          </p>
        </div>
      )}
      
      <TransactionForm
        schema={formSchema}
        adapter={adapter}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
`;
  }

  /**
   * Get the class name for a chain type's adapter.
   * Converts chain type to PascalCase (e.g., 'evm' -> 'EVMAdapter').
   */
  private getAdapterClassName(chainType: ChainType): string {
    return `${chainType.charAt(0).toUpperCase()}${chainType.slice(1)}Adapter`;
  }
}
