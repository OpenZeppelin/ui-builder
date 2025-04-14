import { useState } from 'react';

import type { ContractSchema } from '../../../core/types/ContractSchema';

import { ContractAddressForm } from './components/ContractAddressForm';
import { ContractPreview } from './components/ContractPreview';

import { StepContractDefinitionProps } from './types';

export function StepContractDefinition({
  onContractSchemaLoaded,
  selectedChain,
}: StepContractDefinitionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedSchema, setLoadedSchema] = useState<ContractSchema | null>(null);

  const handleLoadContract = (schema: ContractSchema) => {
    setLoadedSchema(schema);
    onContractSchemaLoaded(schema);
  };

  return (
    <div className="space-y-6">
      <ContractAddressForm
        selectedChain={selectedChain}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        onLoadContract={handleLoadContract}
        setError={setError}
        error={error}
      />
      <ContractPreview contractSchema={loadedSchema} />
    </div>
  );
}
