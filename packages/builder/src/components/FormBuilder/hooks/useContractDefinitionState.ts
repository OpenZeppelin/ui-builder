import { useCallback, useState } from 'react';

import type { ContractSchema, FormValues } from '@openzeppelin/transaction-form-types';

/**
 * Hook for managing contract definition state in the Transaction Form Builder.
 * Used in the second step of the form building process.
 */
export function useContractDefinitionState() {
  const [contractSchema, setContractSchema] = useState<ContractSchema | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [contractFormValues, setContractFormValues] = useState<FormValues | null>(null);

  const handleContractSchemaLoaded = useCallback(
    (schema: ContractSchema | null, formValues?: FormValues) => {
      setContractSchema(schema);
      setContractAddress(schema?.address ?? null);
      if (formValues) {
        setContractFormValues(formValues);
      } else if (!schema) {
        // If schema is null, also clear the form values
        setContractFormValues(null);
      }
    },
    []
  );

  const resetContractSchema = useCallback(() => {
    setContractSchema(null);
    setContractAddress(null);
    setContractFormValues(null);
  }, []);

  return {
    contractSchema,
    contractAddress,
    contractFormValues,
    handleContractSchemaLoaded,
    resetContractSchema,
  };
}
