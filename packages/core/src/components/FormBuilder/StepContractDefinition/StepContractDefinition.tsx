import { CheckCircle } from 'lucide-react';

import { useEffect, useState } from 'react';

import type { ContractSchema } from '@openzeppelin/transaction-form-types';

import { ActionBar } from '../../Common/ActionBar';

import { ContractAddressForm } from './components/ContractAddressForm';
import { ContractPreview } from './components/ContractPreview';

import { StepContractDefinitionProps } from './types';

export function StepContractDefinition({
  onContractSchemaLoaded,
  adapter,
  networkConfig,
  existingContractSchema = null,
  onToggleContractState,
  isWidgetExpanded,
}: StepContractDefinitionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedSchema, setLoadedSchema] = useState<ContractSchema | null>(existingContractSchema);

  useEffect(() => {
    if (existingContractSchema) {
      setLoadedSchema(existingContractSchema);
    }
  }, [existingContractSchema]);

  // When adapter or networkConfig changes, reset loaded state if they are null (e.g. network deselected)
  useEffect(() => {
    if (!adapter || !networkConfig) {
      setLoadedSchema(null);
      setError(null);
      // Note: We don't call onContractSchemaLoaded(null) here as that might trigger downstream resets
      // The parent useFormBuilderState handles resetting schema when network changes.
    }
  }, [adapter, networkConfig]);

  const handleLoadContract = (schema: ContractSchema) => {
    setLoadedSchema(schema);
    onContractSchemaLoaded(schema);
  };

  // Function to clear the contract schema when address becomes invalid
  const handleClearContract = () => {
    setLoadedSchema(null);
    // Notify parent components that the contract has been cleared
    onContractSchemaLoaded(null);
  };

  // If adapter or networkConfig is not available, show a message or disable the form
  if (!adapter || !networkConfig) {
    return (
      <div className="text-muted-foreground p-4 text-center">
        Please select a valid network first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ActionBar
        network={networkConfig}
        contractAddress={loadedSchema?.address}
        onToggleContractState={onToggleContractState}
        isWidgetExpanded={isWidgetExpanded}
      />

      <ContractAddressForm
        adapter={adapter}
        networkConfig={networkConfig}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        onLoadContract={handleLoadContract}
        onClearContract={handleClearContract}
        setError={setError}
        error={error}
        existingContractAddress={loadedSchema?.address || null}
      />

      {loadedSchema && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-4">
          <p className="text-green-800 flex items-center">
            <CheckCircle className="size-5 mr-2" />
            Contract loaded successfully! Click &ldquo;Next&rdquo; to continue.
          </p>
        </div>
      )}

      <ContractPreview contractSchema={loadedSchema} />
    </div>
  );
}
