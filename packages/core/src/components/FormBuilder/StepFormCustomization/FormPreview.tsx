import { useMemo } from 'react';

import {
  Card,
  CardContent,
  TransactionForm,
  WalletConnectionProvider,
} from '@openzeppelin/transaction-form-renderer';
import { NetworkConfig } from '@openzeppelin/transaction-form-types';
import type { ContractFunction, ContractSchema } from '@openzeppelin/transaction-form-types';

import { getAdapter } from '../../../core/ecosystemManager';
import { formSchemaFactory } from '../../../core/factories/FormSchemaFactory';
import type { BuilderFormConfig } from '../../../core/types/FormTypes';

interface FormPreviewProps {
  formConfig: BuilderFormConfig;
  functionDetails: ContractFunction;
  contractSchema: ContractSchema;
  networkConfig: NetworkConfig | null;
}

/**
 * Form preview component that renders a preview of the form being built
 * Uses the TransactionForm component from the form-renderer package
 */
export function FormPreview({
  formConfig,
  functionDetails,
  contractSchema,
  networkConfig,
}: FormPreviewProps) {
  // Get the adapter using the networkConfig
  const adapter = useMemo(() => {
    if (!networkConfig) return null;
    return getAdapter(networkConfig);
  }, [networkConfig]);

  // Convert BuilderFormConfig to RenderFormSchema using the FormSchemaFactory
  const renderSchema = useMemo(() => {
    // Use the custom title and description from formConfig if available, otherwise use defaults
    const formTitle =
      formConfig.title !== undefined
        ? formConfig.title
        : `${functionDetails.displayName || functionDetails.name} Form`;

    const formDescription =
      formConfig.description !== undefined
        ? formConfig.description
        : functionDetails.description ||
          `Form for interacting with the ${functionDetails.displayName} function.`;

    const schema = formSchemaFactory.builderConfigToRenderSchema(
      formConfig,
      formTitle,
      formDescription
    );

    return schema;
  }, [formConfig, functionDetails]);

  // Create mock submission handler for preview
  const handleSubmit = (data: FormData) => {
    console.log('Form submitted in preview mode with FormData:', data);

    // Convert FormData back to simple Record for adapter input (assuming simple key-value for now)
    // NOTE: FormData handling might be more complex depending on actual usage
    const submittedInputs: Record<string, unknown> = {};
    data.forEach((value, key) => {
      submittedInputs[key] = value;
    });
    console.log('Form submitted in preview mode with Parsed Inputs:', submittedInputs);

    if (!adapter) {
      console.error('Preview error: Adapter not available due to missing networkConfig.');
      return;
    }

    try {
      // Format data using the adapter, passing the field config
      const functionId = renderSchema.functionId || functionDetails.id || 'unknown';

      // Use the passed-in contractSchema directly
      const formattedData = adapter.formatTransactionData(
        contractSchema,
        functionId,
        submittedInputs, // Pass the parsed submitted data
        formConfig.fields // Pass the original field configurations
      );
      console.log('Adapter formatted data (Preview):', formattedData);
    } catch (error) {
      console.error('Error formatting data in preview:', error);
    }

    // In a real implementation, this would be a no-op or trigger a mock transaction
  };

  if (!adapter) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Form preview requires a selected network.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute -top-3 left-4 bg-primary text-white text-xs px-2 py-1 rounded-sm z-10">
        Preview
      </div>
      <Card className="overflow-visible border-dashed border-primary/50 bg-gray-50/50">
        <CardContent className="p-6">
          <WalletConnectionProvider adapter={adapter}>
            <TransactionForm
              schema={renderSchema}
              adapter={adapter}
              onSubmit={handleSubmit}
              contractSchema={contractSchema}
              networkConfig={networkConfig}
            />
          </WalletConnectionProvider>
        </CardContent>
      </Card>
    </div>
  );
}
