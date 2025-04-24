import { useState } from 'react';

import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

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

      {loadedSchema && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-4">
          <p className="text-green-800 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Contract loaded successfully! Click &ldquo;Next&rdquo; to continue.
          </p>
        </div>
      )}

      <ContractPreview contractSchema={loadedSchema} />
    </div>
  );
}
