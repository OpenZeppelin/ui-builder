import { useEffect, useState } from 'react';

import { Button } from '../ui/button';

import { AbiItem } from './StepArtifactSubmit';

// Types for form configuration
export interface FormMethod {
  name: string;
  displayName: string;
  methodId: string; // function signature
  inputs: AbiInput[];
  stateMutability: string;
  selected: boolean;
}

export interface AbiInput {
  name: string;
  type: string;
  displayName: string;
  internalType?: string;
  components?: AbiInput[];
}

interface StepFormBuilderProps {
  abi: AbiItem[];
  onFormConfigChange: (config: FormMethod[]) => void;
}

export function StepFormBuilder({ abi, onFormConfigChange }: StepFormBuilderProps) {
  const [methods, setMethods] = useState<FormMethod[]>([]);
  const [filter, setFilter] = useState('');

  // Process ABI when it changes
  useEffect(() => {
    if (abi && abi.length) {
      // Filter out only function type ABI items
      const functionMethods = abi
        .filter((item) => item.type === 'function')
        .map((item) => {
          // Generate method ID (simplified for now)
          const methodId = `${item.name}(${item.inputs?.map((input) => input.type).join(',') || ''})`;

          return {
            name: item.name || '',
            displayName: formatMethodName(item.name || ''),
            methodId,
            inputs:
              item.inputs?.map((input) => ({
                name: input.name,
                type: input.type,
                displayName: formatInputName(input.name, input.type),
                internalType: input.internalType,
                components: input.components as AbiInput[] | undefined,
              })) || [],
            stateMutability: item.stateMutability || 'nonpayable',
            selected: false,
          };
        });

      setMethods(functionMethods);
    }
  }, [abi]);

  // Update parent component when selection changes
  useEffect(() => {
    onFormConfigChange(methods);
  }, [methods, onFormConfigChange]);

  // Toggle method selection
  const toggleMethodSelection = (methodId: string) => {
    setMethods((prevMethods) =>
      prevMethods.map((method) =>
        method.methodId === methodId ? { ...method, selected: !method.selected } : method
      )
    );
  };

  // Select all methods
  const selectAll = () => {
    setMethods((prevMethods) => prevMethods.map((method) => ({ ...method, selected: true })));
  };

  // Deselect all methods
  const deselectAll = () => {
    setMethods((prevMethods) => prevMethods.map((method) => ({ ...method, selected: false })));
  };

  // Filter methods based on search input
  const filteredMethods = methods.filter((method) =>
    method.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Contract Methods</h3>
        <p className="text-muted-foreground text-sm">
          Choose which methods from your contract to include in the form.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll} disabled={methods.length === 0}>
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deselectAll}
              disabled={methods.length === 0}
            >
              Deselect All
            </Button>
          </div>
          <div className="relative max-w-sm">
            <input
              type="text"
              placeholder="Filter methods..."
              className="border-input bg-background w-full rounded-md border p-2 pr-8 text-sm shadow-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <button
                onClick={() => setFilter('')}
                className="text-muted-foreground hover:text-foreground absolute top-2 right-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {methods.length === 0 ? (
          <div className="flex items-center justify-center rounded-md border border-dashed p-8">
            <p className="text-muted-foreground text-sm">
              No contract methods found. Please upload a contract ABI first.
            </p>
          </div>
        ) : filteredMethods.length === 0 ? (
          <div className="flex items-center justify-center rounded-md border border-dashed p-8">
            <p className="text-muted-foreground text-sm">No methods match your filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMethods.map((method) => (
              <div
                key={method.methodId}
                className={`rounded-md border p-4 ${
                  method.selected ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{method.displayName}</h4>
                      <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-medium">
                        {method.stateMutability}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {method.inputs.length > 0
                        ? `${method.inputs.length} parameter${
                            method.inputs.length === 1 ? '' : 's'
                          }`
                        : 'No parameters'}
                    </p>
                  </div>
                  <Button
                    variant={method.selected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleMethodSelection(method.methodId)}
                  >
                    {method.selected ? 'Selected' : 'Select'}
                  </Button>
                </div>

                {method.selected && method.inputs.length > 0 && (
                  <div className="bg-background mt-4 space-y-2 rounded-md p-3">
                    <h5 className="text-sm font-medium">Parameters</h5>
                    <div className="space-y-1">
                      {method.inputs.map((input, index) => (
                        <div
                          key={`${method.methodId}-input-${index}`}
                          className="hover:bg-muted/50 flex items-center justify-between rounded-sm p-1 text-xs"
                        >
                          <span className="font-medium">{input.displayName}</span>
                          <span className="text-muted-foreground">{input.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function formatMethodName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
}

function formatInputName(name: string, type: string): string {
  if (!name) {
    return `${type} Input`;
  }
  return name
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
}
