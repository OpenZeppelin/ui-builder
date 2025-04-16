import { useMemo } from 'react';

import { TransactionForm } from '@openzeppelin/transaction-form-renderer';
import type { ChainType, ContractFunction } from '@openzeppelin/transaction-form-types/contracts';

import { getContractAdapter } from '../../../adapters';
import { formSchemaFactory } from '../../../core/factories/FormSchemaFactory';
import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import { Card, CardContent } from '../../ui/card';

interface FormPreviewProps {
  formConfig: BuilderFormConfig;
  functionDetails: ContractFunction;
  selectedChain: ChainType;
}

/**
 * Form preview component that renders a preview of the form being built
 * Uses the TransactionForm component from the form-renderer package
 */
export function FormPreview({ formConfig, functionDetails, selectedChain }: FormPreviewProps) {
  // Get the adapter for the selected chain
  const adapter = useMemo(() => getContractAdapter(selectedChain), [selectedChain]);

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

    try {
      // Format data using the adapter, passing the field config
      const functionId = renderSchema.functionId || functionDetails.id || 'unknown';
      const formattedData = adapter.formatTransactionData(
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

  return (
    <Card className="overflow-visible">
      <CardContent className="p-6">
        <TransactionForm
          schema={renderSchema}
          adapter={adapter}
          onSubmit={handleSubmit}
          previewMode={true}
        />
      </CardContent>
    </Card>
  );
}
