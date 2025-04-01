import { useMemo } from 'react';

import { TransactionForm } from '@openzeppelin/transaction-form-renderer';

import { getContractAdapter } from '../../../adapters';
import { formSchemaFactory } from '../../../core/factories/FormSchemaFactory';
import { Card, CardContent } from '../../ui/card';

import type { ChainType, ContractFunction } from '../../../core/types/ContractSchema';
import type { BuilderFormConfig } from '../../../core/types/FormTypes';

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
    return formSchemaFactory.builderConfigToRenderSchema(
      formConfig,
      functionDetails.displayName || functionDetails.name,
      functionDetails.description
    );
  }, [formConfig, functionDetails]);

  // Create mock submission handler for preview
  const handleSubmit = (data: FormData) => {
    console.log('Form submitted in preview mode with data:', data);
    // In a real implementation, this would be a no-op in preview mode
  };

  return (
    <Card>
      <CardContent className="pt-6">
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
