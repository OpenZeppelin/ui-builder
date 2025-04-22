import { useCallback, useState } from 'react';

import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

/**
 * Hook for managing contract definition state in the Transaction Form Builder.
 * Used in the second step of the form building process.
 */
export function useContractDefinitionState() {
  const [contractSchema, setContractSchema] = useState<ContractSchema | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  const handleContractSchemaLoaded = useCallback((schema: ContractSchema) => {
    setContractSchema(schema);
    setContractAddress(schema.address ?? null);
  }, []);

  const resetContractSchema = useCallback(() => {
    setContractSchema(null);
    setContractAddress(null);
  }, []);

  return {
    contractSchema,
    contractAddress,
    handleContractSchemaLoaded,
    resetContractSchema,
  };
}
