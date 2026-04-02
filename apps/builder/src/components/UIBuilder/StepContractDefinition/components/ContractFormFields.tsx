import { Loader2 } from 'lucide-react';
import { Control } from 'react-hook-form';

import { DynamicFormField } from '@openzeppelin/ui-renderer';
import type { FormFieldType, FormValues } from '@openzeppelin/ui-types';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

interface ContractFormFieldsProps {
  contractDefinitionInputs: FormFieldType[];
  control: Control<FormValues>;
  runtime: BuilderRuntime;
  isLoading: boolean;
}

/**
 * Renders the contract definition form fields
 */
export function ContractFormFields({
  contractDefinitionInputs,
  control,
  runtime,
  isLoading,
}: ContractFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Form Fields */}
      <div className="space-y-4">
        {contractDefinitionInputs.map((field) => (
          <DynamicFormField
            key={field.id}
            field={field}
            control={control}
            addressing={runtime?.addressing}
            typeMapping={runtime?.typeMapping}
          />
        ))}
      </div>

      {/* Enhanced Loading Indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading contract...</span>
        </div>
      )}
    </div>
  );
}
