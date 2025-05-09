/**
 * Hook for loading contract definitions
 */
import { useCallback, useState } from 'react';

import { ContractAdapter, ContractSchema } from '@openzeppelin/transaction-form-types';

import { loadContractDefinition } from '../../services/ContractLoader';

export function useContractDefinition() {
  const [contractSchema, setContractSchema] = useState<ContractSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContract = useCallback(
    async (adapter: ContractAdapter, contractDefinition: string | File) => {
      setLoading(true);
      setError(null);

      try {
        const schema = await loadContractDefinition(adapter, contractDefinition);
        setContractSchema(schema);
        return schema;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error loading contract';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { contractSchema, loading, error, loadContract };
}
