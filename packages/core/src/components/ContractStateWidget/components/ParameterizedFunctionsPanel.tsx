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

  // Query a specific parameterized function
  const queryFunction = async (functionId: string) => {
    const functionDetails = functions.find((f) => f.id === functionId);
    if (!functionDetails) return;

    // Get parameter values for this function
    const params = paramValues[functionId] || [];

    // Add to loading set
    setLoadingFunctions((prev) => new Set([...prev, functionId]));

    try {
      const result = await adapter.queryViewFunction(
        contractAddress,
        functionId,
        params,
        contractSchema
      );
      setResults((prev) => ({ ...prev, [functionId]: result }));
    } catch (err) {
      console.error(`Error querying function ${functionDetails.name}:`, err);
      setResults((prev) => ({
        ...prev,
        [functionId]: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }));
    } finally {
      setLoadingFunctions((prev) => {
        const newSet = new Set([...prev]);
        newSet.delete(functionId);
        return newSet;
      });
    }
  };

  if (functions.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No parameterized view functions found in this contract.
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-1 max-h-64 overflow-y-auto">
      {functions.map((func) => (
        <AccordionItem key={func.id} value={func.id} className="border-b-0 py-1">
          <AccordionTrigger className="py-1 text-xs">
            {func.name} ({func.inputs?.length || 0} params)
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-2 px-1">
            <div className="space-y-2">
              <ParameterInputs
                functionDetails={func}
                values={paramValues[func.id] || []}
                onChange={(index, value) => updateParam(func.id, index, value)}
                adapter={adapter}
              />

              <div>
                <Button
                  onClick={() => void queryFunction(func.id)}
                  disabled={loadingFunctions.has(func.id)}
                  size="sm"
                  className="text-xs w-full"
                >
                  {loadingFunctions.has(func.id) ? 'Querying...' : 'Query'}
                </Button>
              </div>

              {results[func.id] !== undefined && (
                <FunctionResult
                  functionDetails={func}
                  result={results[func.id]}
                  loading={loadingFunctions.has(func.id)}
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
