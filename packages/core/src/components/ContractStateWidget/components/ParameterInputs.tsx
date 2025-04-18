import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { DynamicFormField } from '@openzeppelin/transaction-form-renderer';
import type { ContractFunction } from '@openzeppelin/transaction-form-types/contracts';

import { ContractAdapter } from '../../../adapters';

interface ParameterInputsProps {
  functionDetails: ContractFunction;
  values: unknown[];
  onChange: (index: number, value: unknown) => void;
  adapter: ContractAdapter;
}

/**
 * Component for rendering and managing parameter inputs for contract functions
 */
export function ParameterInputs({
  functionDetails,
  values,
  onChange,
  adapter,
}: ParameterInputsProps) {
  // Create a local form control for this set of parameters
  const { control, watch } = useForm({
    defaultValues: functionDetails.inputs.reduce(
      (acc, _, index) => {
        acc[`param${index}`] = values[index] || '';
        return acc;
      },
      {} as Record<string, unknown>
    ),
  });

  // Watch all field values and call onChange when they update
  const formValues = watch();

  useEffect(() => {
    if (!functionDetails.inputs) return;
    functionDetails.inputs.forEach((_, index) => {
      const key = `param${index}`;
      if (formValues[key] !== undefined && formValues[key] !== values[index]) {
        onChange(index, formValues[key]);
      }
    });
  }, [formValues, functionDetails.inputs, onChange, values]);

  if (!functionDetails.inputs || functionDetails.inputs.length === 0) {
    return <div className="text-xs text-muted-foreground">No parameters</div>;
  }

  return (
    <div className="space-y-2">
      {functionDetails.inputs.map((parameter, index) => {
        // Use the adapter's field generation logic (same as used in form builder)
        const fieldConfig = adapter.generateDefaultField(parameter);

        fieldConfig.width = 'full';
        fieldConfig.label = `${parameter.displayName || parameter.name} (${parameter.type})`;
        fieldConfig.helperText = '';

        return (
          <div key={`${functionDetails.id}-param-${index}`} className="mb-1">
            <DynamicFormField field={fieldConfig} control={control} adapter={adapter} />
          </div>
        );
      })}
    </div>
  );
}
