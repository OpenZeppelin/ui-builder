import { CheckCircle } from 'lucide-react';

import { useEffect, useState } from 'react';

import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

import { ContractAddressForm } from './components/ContractAddressForm';
import { ContractPreview } from './components/ContractPreview';

import { StepContractDefinitionProps } from './types';

export function StepContractDefinition({
  onContractSchemaLoaded,
  selectedEcosystem,
  existingContractSchema = null,
}: StepContractDefinitionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedSchema, setLoadedSchema] = useState<ContractSchema | null>(existingContractSchema);

  useEffect(() => {
    if (existingContractSchema) {
      setLoadedSchema(existingContractSchema);
    }
  }, [existingContractSchema]);

  const handleLoadContract = (schema: ContractSchema) => {
    setLoadedSchema(schema);
    onContractSchemaLoaded(schema);
  };

  return (
    <div className="space-y-6">
      <ContractAddressForm
        selectedEcosystem={selectedEcosystem}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        onLoadContract={handleLoadContract}
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
