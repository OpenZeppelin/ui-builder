import { AdapterExportManager } from '../AdapterExportManager';
import { TemplateManager } from '../TemplateManager';

import type { ChainType } from '../../core/types/ContractSchema';
import type { ExportOptions } from '../../core/types/ExportTypes';
import type { BuilderFormConfig } from '../../core/types/FormTypes';

/**
 * FormCodeGenerator class responsible for generating React components
 * that use the shared form-renderer package.
 *
 * Current implementation:
 * - Generates only the form component code
 * - Uses a consistent import pattern that works in both dev and production
 * - Integrates with TemplateManager to generate complete projects
 * - Integrates with AdapterExportManager to include required adapter files
 */
export class FormCodeGenerator {
  private templateManager: TemplateManager;
  private adapterExportManager: AdapterExportManager;

  constructor() {
    this.templateManager = new TemplateManager();
    this.adapterExportManager = new AdapterExportManager();
  }

  /**
   * Generate a React component for a form that uses the shared form-renderer package.
   * Uses a consistent import path that works in both development and production
   * thanks to pnpm workspace resolution.
   *
   * This component is integrated into the export template structure by the
   * generateTemplateProject method, replacing the placeholder components.
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
   * Generate a complete React project by integrating with the template system.
   * Uses the typescript-react-vite template and replaces placeholder files with generated code.
   *
   * @param formConfig The form configuration from the builder
   * @param chainType The selected blockchain type
   * @param functionId The ID of the contract function
   * @param options Additional options for export customization
   * @returns A record of file paths to file contents for the complete project
   */
  async generateTemplateProject(
    formConfig: BuilderFormConfig,
    chainType: ChainType,
    functionId: string,
    options: ExportOptions = { chainType }
  ): Promise<Record<string, string>> {
    // Generate the form component code
    const formComponentCode = this.generateFormComponent(formConfig, chainType, functionId);

    // Create a structure with the custom files to replace in the template
    const customFiles: Record<string, string> = {
      // Replace FormPlaceholder.tsx with our generated form component
      'src/components/GeneratedForm.tsx': formComponentCode,

      // We need to update App.tsx to import GeneratedForm instead of FormPlaceholder
      'src/components/App.tsx': this.generateUpdatedAppComponent(functionId),
    };

    // Get adapter files if needed
    if (options.includeAdapters !== false) {
      const adapterFiles = await this.adapterExportManager.getAdapterFiles(chainType);
      Object.assign(customFiles, adapterFiles);
    }

    // Use the template manager to create a complete project
    return await this.templateManager.createProject('typescript-react-vite', customFiles, options);
  }

  /**
   * Generate an updated App component that imports the GeneratedForm instead of FormPlaceholder
   *
   * @param functionId The ID of the function this form is for (used in titles)
   * @returns The content of the updated App.tsx file
   */
  private generateUpdatedAppComponent(functionId: string): string {
    return `import { GeneratedForm } from './GeneratedForm';

/**
 * App Component
 *
 * Main application component that wraps the form.
 */
export function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Transaction Form for ${functionId}</h1>
        <p>A form for interacting with blockchain contracts</p>
      </header>

      <main className="main">
        <div className="container">
          <GeneratedForm 
            onSubmit={(txData) => {
              console.log('Transaction submitted:', txData);
              return Promise.resolve({ txHash: 'demo-tx-hash-' + Date.now() });
            }}
            onError={(error) => {
              console.error('Transaction error:', error);
            }}
          />
        </div>
      </main>

      <footer className="footer">
        <p>Generated with OpenZeppelin Transaction Form Builder</p>
        <p>© ${new Date().getFullYear()} OpenZeppelin</p>
      </footer>
    </div>
  );
}`;
  }

  /**
   * Get the class name for a chain type's adapter.
   * Converts chain type to PascalCase (e.g., 'evm' -> 'EVMAdapter').
   */
  private getAdapterClassName(chainType: ChainType): string {
    return `${chainType.charAt(0).toUpperCase()}${chainType.slice(1)}Adapter`;
  }
}
