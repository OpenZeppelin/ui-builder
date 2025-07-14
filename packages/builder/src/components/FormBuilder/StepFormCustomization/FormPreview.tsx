import { useMemo } from 'react';

import { TransactionForm } from '@openzeppelin/contracts-ui-builder-renderer';
import { useDerivedAccountStatus, useWalletState } from '@openzeppelin/transaction-form-react-core';
import type { ContractFunction, ContractSchema } from '@openzeppelin/transaction-form-types';
import { Card, CardContent } from '@openzeppelin/transaction-form-ui';

import { formSchemaFactory } from '../../../core/factories/FormSchemaFactory';
import type { BuilderFormConfig } from '../../../core/types/FormTypes';

interface FormPreviewProps {
  formConfig: BuilderFormConfig;
  functionDetails: ContractFunction;
  contractSchema: ContractSchema;
}

/**
 * Form preview component that renders a preview of the form being built
 * Uses the TransactionForm component from the form-renderer package
 */
export function FormPreview({ formConfig, functionDetails, contractSchema }: FormPreviewProps) {
  const {
    activeAdapter: adapter,
    isAdapterLoading: adapterLoading,
    activeNetworkConfig: networkConfig,
  } = useWalletState();

  const { isConnected: isWalletConnected } = useDerivedAccountStatus();

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

    return formSchemaFactory.builderConfigToRenderSchema(formConfig, formTitle, formDescription);
  }, [formConfig, functionDetails]);

  if (adapterLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading form preview...</div>;
  }

  if (!adapter) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Form preview requires an active adapter from global state.
      </div>
    );
  }

  if (!networkConfig) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Form preview requires an active network configuration from global state.
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
          <TransactionForm
            schema={renderSchema}
            adapter={adapter}
            contractSchema={contractSchema}
            isWalletConnected={isWalletConnected}
            executionConfig={formConfig.executionConfig}
          />
        </CardContent>
      </Card>
    </div>
  );
}
