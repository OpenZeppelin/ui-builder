import { useEffect, useState } from 'react';

import { Button } from '../ui/button';

import type { AbiItem } from '../../adapters/evm/types';
import type { ContractFunction, ContractSchema } from '../../core/types/ContractSchema';

interface StepFunctionSelectorProps {
  contractDefinition: AbiItem[];
  selectedFunction: string | null;
  onFunctionSelected: (functionId: string | null) => void;
}

export function StepFunctionSelector({
  contractDefinition,
  selectedFunction,
  onFunctionSelected,
}: StepFunctionSelectorProps) {
  const [filterValue, setFilterValue] = useState('');
  const [functions, setFunctions] = useState<ContractFunction[]>([]);

  useEffect(() => {
    if (contractDefinition.length > 0) {
      // Transform the contract definition into a chain-agnostic schema
      const contractSchema: ContractSchema = {
        chainType: 'evm', // Hardcoded for now, will be based on selected chain later
        functions: contractDefinition
          .filter((item) => item.type === 'function')
          .map((item) => ({
            id: `${item.name}_${item.inputs?.map((i) => i.type).join('_') || ''}`,
            name: item.name || '',
            displayName: item.name ? formatMethodName(item.name) : 'Unknown Method',
            inputs:
              item.inputs?.map((input) => ({
                name: input.name,
                type: input.type,
                displayName: formatInputName(input.name, input.type),
              })) || [],
            type: item.type,
            stateMutability: item.stateMutability,
          })),
      };

      // Filter to only include callable functions
      const callableFunctions = contractSchema.functions.filter(
        (fn: ContractFunction) => fn.type === 'function'
      );
      setFunctions(callableFunctions);
    }
  }, [contractDefinition]);

  const selectFunction = (functionId: string) => {
    // Toggle selection - if already selected, deselect it
    onFunctionSelected(selectedFunction === functionId ? null : functionId);
  };

  const filteredFunctions = functions.filter((fn) =>
    fn.displayName.toLowerCase().includes(filterValue.toLowerCase())
  );

  if (contractDefinition.length === 0) {
    return (
      <div className="py-8 text-center">
        <p>Please upload a contract definition first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Contract Function</h3>
        <p className="text-muted-foreground">
          Choose the contract function you want to create a transaction form for. Each function will
          have its own dedicated form.
        </p>
      </div>

      <div>
        <input
          type="text"
          placeholder="Filter functions..."
          className="w-full rounded border p-2"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        />
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {filteredFunctions.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center">
            {functions.length === 0
              ? 'No callable functions found in this contract.'
              : 'No functions match your filter.'}
          </p>
        ) : (
          filteredFunctions.map((fn) => (
            <div
              key={fn.id}
              className={`rounded-md border p-4 ${
                selectedFunction === fn.id ? 'border-primary bg-primary/5' : 'border-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{fn.displayName}</h4>
                  <div className="text-muted-foreground mt-1 text-sm">
                    {fn.inputs.length > 0 ? (
                      <span>
                        Parameters: {fn.inputs.map((input) => input.name || input.type).join(', ')}
                      </span>
                    ) : (
                      <span>No parameters</span>
                    )}
                  </div>
                </div>
                <Button
                  variant={selectedFunction === fn.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => selectFunction(fn.id)}
                >
                  {selectedFunction === fn.id ? 'Selected' : 'Select'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatMethodName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function formatInputName(name: string, type: string): string {
  if (!name || name === '') {
    return `Parameter (${type})`;
  }
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
}
