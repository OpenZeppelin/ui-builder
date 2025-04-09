import { useMemo } from 'react';
import { Control, useWatch } from 'react-hook-form';

import {
  BooleanField,
  ContractAdapter,
  DynamicFormField,
  FormFieldType,
  FormValues,
  SelectField,
  SelectGroupedField,
  TextField,
} from '@openzeppelin/transaction-form-renderer';

import { OptionGroup } from './utils/fieldTypeUtils';
import { FieldEditorFormValues } from './types';

interface FieldBasicSettingsProps {
  /**
   * React Hook Form control
   */
  control: Control<FieldEditorFormValues>;

  /**
   * Field type groups for the select dropdown
   */
  fieldTypeGroups: OptionGroup[];

  /**
   * Field width options for the select dropdown
   */
  fieldWidthOptions: { value: string; label: string }[];

  adapter?: ContractAdapter;
}

/**
 * Component for editing basic field settings like label, type, etc.
 */
export function FieldBasicSettings({
  control,
  fieldTypeGroups,
  fieldWidthOptions,
  adapter,
}: FieldBasicSettingsProps) {
  const isHardcoded = useWatch({ control, name: 'isHardcoded' }) || false;
  const fieldType = useWatch({ control, name: 'type' }) || 'text';

  // Construct synthetic field config for DynamicFormField
  const hardcodedFieldConfig = useMemo(
    (): FormFieldType => ({
      id: 'hardcoded-value',
      name: 'hardcodedValue',
      label: 'Hardcoded Value',
      type: fieldType,
      validation: { required: true },
    }),
    [fieldType]
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TextField
        id="field-label"
        name="label"
        label="Field Label"
        control={control}
        placeholder="Enter field label"
      />

      <SelectGroupedField
        id="field-type"
        name="type"
        label="Field Type"
        control={control}
        groups={fieldTypeGroups}
        placeholder="Select field type"
      />

      <TextField
        id="field-placeholder"
        name="placeholder"
        label="Placeholder Text"
        control={control}
        placeholder="Enter placeholder text"
      />

      <SelectField
        id="field-width"
        name="width"
        label="Field Width"
        control={control}
        options={fieldWidthOptions}
        placeholder="Select field width"
      />

      <div className="grid grid-cols-1 gap-4 border-t pt-4 md:col-span-2 md:grid-cols-2">
        <BooleanField
          id="is-hidden"
          name="isHidden"
          label="Hide field from form UI"
          control={control}
          helperText="Field will not be shown, but its value (if any) is still used."
        />

        <BooleanField
          id="is-hardcoded"
          name="isHardcoded"
          label="Use hardcoded value"
          control={control}
          helperText="Provide a fixed value instead of user input."
        />
      </div>

      {isHardcoded && adapter && (
        <div className="space-y-4 border-t pt-4 md:col-span-2">
          <DynamicFormField
            key={`hardcoded-${fieldType}`}
            field={hardcodedFieldConfig}
            control={control as unknown as Control<FormValues>}
            adapter={adapter}
          />
          <BooleanField
            id="is-read-only"
            name="isReadOnly"
            label="Display as read-only"
            control={control}
            helperText="If checked, the field shows the hardcoded value but cannot be edited by the end-user."
          />
        </div>
      )}
      {isHardcoded && !adapter && fieldType === 'blockchain-address' && (
        <div className="text-destructive border-t pt-4 text-sm md:col-span-2">
          Cannot edit hardcoded address value: Adapter not available.
        </div>
      )}
    </div>
  );
}
