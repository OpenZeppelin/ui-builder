import { useState } from 'react';

import { Button } from '@openzeppelin/transaction-form-renderer';
import type {
  ContractFunction,
  ContractSchema,
} from '@openzeppelin/transaction-form-types/contracts';

import { ContractAdapter } from '../../../adapters';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion';

import { FunctionResult } from './FunctionResult';
import { ParameterInputs } from './ParameterInputs';

interface ParameterizedFunctionsPanelProps {
  functions: ContractFunction[];
  contractAddress: string;
  adapter: ContractAdapter;
  contractSchema: ContractSchema;
}

/**
 * Panel for displaying and querying view functions that require parameters
 */
export function ParameterizedFunctionsPanel({
  functions,
  contractAddress,
  adapter,
  contractSchema,
}: ParameterizedFunctionsPanelProps) {
  // Track parameter values and results for each function
  const [paramValues, setParamValues] = useState<Record<string, unknown[]>>({});
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [loadingFunctions, setLoadingFunctions] = useState<Set<string>>(new Set());

  // Update parameter value for a specific function
  const updateParam = (functionId: string, paramIndex: number, value: unknown) => {
    setParamValues((prev) => {
      const functionParams = [...(prev[functionId] || [])];
      functionParams[paramIndex] = value;
      return { ...prev, [functionId]: functionParams };
    });
  };

  // Query a specific function with its parameters
  const queryFunction = async (fn: ContractFunction) => {
    setLoadingFunctions((prev) => new Set(prev).add(fn.id));

    // Validate contract address first
    if (!contractAddress || contractAddress.trim() === '') {
      setResults((prev) => ({
        ...prev,
        [fn.id]: 'Error: Contract address is empty or not provided',
      }));

      // Remove loading state
      setLoadingFunctions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fn.id);
        return newSet;
      });

      return;
    }

    try {
      const params = paramValues[fn.id] || [];
      const result = await adapter.queryViewFunction(
        contractAddress,
        fn.id,
        params,
        contractSchema
      );

      setResults((prev) => ({
        ...prev,
        [fn.id]: adapter.formatFunctionResult(result, fn),
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [fn.id]: `Error: ${(error as Error).message}`,
      }));
    } finally {
      setLoadingFunctions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fn.id);
        return newSet;
      });
    }
  };

  if (functions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">No parameterized view functions available</div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
      {functions.map((fn) => (
        <AccordionItem key={fn.id} value={fn.id}>
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            {fn.displayName || fn.name}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <ParameterInputs
                functionDetails={fn}
                values={paramValues[fn.id] || []}
                onChange={(index, value) => updateParam(fn.id, index, value)}
                adapter={adapter}
              />

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => void queryFunction(fn)}
                  disabled={loadingFunctions.has(fn.id)}
                >
                  {loadingFunctions.has(fn.id) ? 'Querying...' : 'Query'}
                </Button>
              </div>

              {results[fn.id] !== undefined && (
                <FunctionResult
                  functionDetails={fn}
                  result={results[fn.id]}
                  loading={loadingFunctions.has(fn.id)}
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
