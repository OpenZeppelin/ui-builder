import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { ContractAdapter, FormFieldType } from '@openzeppelin/transaction-form-renderer';

import { getFieldTypeGroups } from './utils/fieldTypeUtils';
import { FieldAdvancedSettings } from './FieldAdvancedSettings';
import { FieldBasicSettings } from './FieldBasicSettings';
import { FieldEditorFormValues } from './types';
import { TypeWarningSection } from './TypeWarningSection';
import { initializeFormValues, mapFormValuesToField } from './utils';

interface FieldEditorProps {
  field: FormFieldType;
  onUpdate: (updatedField: Partial<FormFieldType>) => void;
  adapter?: ContractAdapter;
  originalParameterType?: string;
}

/**
 * Component for editing form field properties
 */
export function FieldEditor({ field, onUpdate, adapter, originalParameterType }: FieldEditorProps) {
  // Initialize form with field values
  const { control, watch, reset } = useForm<FieldEditorFormValues>({
    defaultValues: initializeFormValues(field),
  });

  // Get field type groups using utility function
  const fieldTypeGroups = useMemo(
    () => getFieldTypeGroups(adapter, originalParameterType),
    [adapter, originalParameterType]
  );

  // Reset form when field changes
  React.useEffect(() => {
    reset(initializeFormValues(field));
  }, [field, reset]);

  // Watch for changes and update fields
  React.useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name && value) {
        // Create a partial with just the changed field
        const change = { [name]: value[name] } as Partial<FieldEditorFormValues>;
        // Convert to FormField format and update
        onUpdate(mapFormValuesToField(change));
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, onUpdate, field.validation]);

  // Field width options
  const fieldWidthOptions = [
    { value: 'full', label: 'Full Width' },
    { value: 'half', label: 'Half Width' },
    { value: 'third', label: 'One Third' },
  ];

  const selectedType = watch('fieldType');

  return (
    <div className="space-y-6">
      <FieldBasicSettings
        control={control}
        fieldTypeGroups={fieldTypeGroups}
        fieldWidthOptions={fieldWidthOptions}
      />

      <TypeWarningSection
        selectedType={selectedType}
        adapter={adapter}
        originalParameterType={originalParameterType}
      />

      <FieldAdvancedSettings control={control} />
    </div>
  );
}
