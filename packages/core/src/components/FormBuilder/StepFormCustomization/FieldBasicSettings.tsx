import React from 'react';
import { Control } from 'react-hook-form';

import {
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
}

/**
 * Component for editing basic field settings like label, type, etc.
 */
export function FieldBasicSettings({
  control,
  fieldTypeGroups,
  fieldWidthOptions,
}: FieldBasicSettingsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TextField
        id="field-label"
        name="fieldLabel"
        label="Field Label"
        control={control}
        placeholder="Enter field label"
      />

      <SelectGroupedField
        id="field-type"
        name="fieldType"
        label="Field Type"
        control={control}
        groups={fieldTypeGroups}
        placeholder="Select field type"
      />

      <TextField
        id="field-placeholder"
        name="fieldPlaceholder"
        label="Placeholder Text"
        control={control}
        placeholder="Enter placeholder text"
      />

      <SelectField
        id="field-width"
        name="fieldWidth"
        label="Field Width"
        control={control}
        options={fieldWidthOptions}
        placeholder="Select field width"
      />
    </div>
  );
}
