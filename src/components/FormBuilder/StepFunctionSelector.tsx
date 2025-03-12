import { useEffect, useState } from 'react';

import { Button } from '../ui/button';

import type { ContractFunction, ContractSchema } from '../../lib/types/ContractSchema';

interface StepFunctionSelectorProps {
  contractSchema: ContractSchema | null;
  onFunctionSelected: (functionId: string | null) => void;
}

export function StepFunctionSelector({
  contractSchema,
  onFunctionSelected,
}: StepFunctionSelectorProps) {
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [functions, setFunctions] = useState<ContractFunction[]>([]);

  useEffect(() => {
    if (contractSchema) {
      // Filter to only include callable functions
      const callableFunctions = contractSchema.functions.filter(
        (fn: ContractFunction) => fn.type === 'function'
      );
      setFunctions(callableFunctions);
    }
  }, [contractSchema]);

  useEffect(() => {
    // Update parent component when selection changes
    onFunctionSelected(selectedFunction);
  }, [selectedFunction, onFunctionSelected]);

  const selectFunction = (functionId: string) => {
    // Toggle selection - if already selected, deselect it
    setSelectedFunction(selectedFunction === functionId ? null : functionId);
  };

  const filteredFunctions = functions.filter((fn) =>
    fn.displayName.toLowerCase().includes(filterValue.toLowerCase())
  );

  if (!contractSchema) {
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
