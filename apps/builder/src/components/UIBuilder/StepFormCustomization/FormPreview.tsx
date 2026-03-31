import { useMemo } from 'react';

import { Card, CardContent } from '@openzeppelin/ui-components';
import { useDerivedAccountStatus } from '@openzeppelin/ui-react';
import { TransactionForm } from '@openzeppelin/ui-renderer';
import type { ContractFunction, ContractSchema } from '@openzeppelin/ui-types';

import { formSchemaFactory } from '../../../core/factories/FormSchemaFactory';
import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import { useBuilderAnalytics } from '../../../hooks/useBuilderAnalytics';
import { useBuilderWalletState } from '../../../hooks/useBuilderWalletState';

interface FormPreviewProps {
  formConfig: BuilderFormConfig;
  functionDetails: ContractFunction;
  contractSchema: ContractSchema;
}

/**
 * Form preview component that renders a preview of the form being built
 * Uses the TransactionForm component from the renderer package
 */
export function FormPreview({ formConfig, functionDetails, contractSchema }: FormPreviewProps) {
  const {
    activeAdapter: adapter,
    activeNetworkConfig: networkConfig,
    isAdapterLoading: adapterLoading,
  } = useBuilderWalletState();

  const { isConnected: isWalletConnected } = useDerivedAccountStatus();
  const { trackTransactionExecuted } = useBuilderAnalytics();

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
            onTransactionSuccess={({ network_id, ecosystem, execution_method }) => {
              trackTransactionExecuted(network_id, ecosystem, execution_method);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
