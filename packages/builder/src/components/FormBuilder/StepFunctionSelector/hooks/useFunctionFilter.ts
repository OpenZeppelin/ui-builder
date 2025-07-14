import { useEffect, useMemo, useState } from 'react';

import type { ContractFunction, ContractSchema } from '@openzeppelin/transaction-form-types';

interface UseFunctionFilterResult {
  functions: ContractFunction[];
  filteredFunctions: ContractFunction[];
  writableFunctions: ContractFunction[];
  filterValue: string;
  setFilterValue: (value: string) => void;
}

export function useFunctionFilter(contractSchema: ContractSchema | null): UseFunctionFilterResult {
  const [functions, setFunctions] = useState<ContractFunction[]>([]);
  const [filterValue, setFilterValue] = useState('');

  // Load functions when the schema changes
  useEffect(() => {
    if (contractSchema) {
      setFunctions(contractSchema.functions);
    } else {
      setFunctions([]);
    }
  }, [contractSchema]);

  // Memoize filtered functions to avoid recalculation on each render
  const filteredFunctions = useMemo(() => {
    return functions.filter((fn) =>
      fn.displayName.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [functions, filterValue]);

  // Memoize function categories
  const writableFunctions = useMemo(() => {
    return filteredFunctions.filter((fn) => fn.modifiesState);
  }, [filteredFunctions]);

  return {
    functions,
    filteredFunctions,
    writableFunctions,
    filterValue,
    setFilterValue,
  };
}
