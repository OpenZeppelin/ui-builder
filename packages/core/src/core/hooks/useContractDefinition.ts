/**
 * Hook for loading contract definitions
 */

import { useCallback, useState } from 'react';

import { loadContractDefinition } from '../../services/ContractLoader';

import type { ChainType, ContractSchema } from '../types/ContractSchema';

export function useContractDefinition() {
  const [contractSchema, setContractSchema] = useState<ContractSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContract = useCallback(
    async (chainType: ChainType, contractDefinition: string | File) => {
      setLoading(true);
      setError(null);

      try {
        const schema = await loadContractDefinition(chainType, contractDefinition);
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
