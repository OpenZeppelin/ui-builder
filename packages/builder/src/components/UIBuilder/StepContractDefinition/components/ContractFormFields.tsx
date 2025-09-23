import { Control } from 'react-hook-form';

import { DynamicFormField } from '@openzeppelin/ui-builder-renderer';
import type { ContractAdapter, FormFieldType, FormValues } from '@openzeppelin/ui-builder-types';

interface ContractFormFieldsProps {
  contractDefinitionInputs: FormFieldType[];
  control: Control<FormValues>;
  adapter: ContractAdapter;
  isLoading: boolean;
}

/**
 * Renders the contract definition form fields
 */
export function ContractFormFields({
  contractDefinitionInputs,
  control,
  adapter,
  isLoading,
}: ContractFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Form Fields */}
      <div className="space-y-4">
        {contractDefinitionInputs.map((field) => (
          <DynamicFormField key={field.id} field={field} control={control} adapter={adapter} />
        ))}
      </div>

      {/* Loading Indicator */}
      {isLoading && <p className="text-sm text-muted-foreground">Loading contract...</p>}
    </div>
  );
}
