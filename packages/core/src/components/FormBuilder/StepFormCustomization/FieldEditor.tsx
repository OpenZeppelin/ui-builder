import React from 'react';
import { useForm } from 'react-hook-form';

import {
  BooleanField,
  FieldType,
  FormFieldType,
  SelectField,
  type SelectOption,
  TextAreaField,
  TextField,
} from '@openzeppelin/transaction-form-renderer';

interface FieldEditorProps {
  field: FormFieldType;
  onUpdate: (updatedField: Partial<FormFieldType>) => void;
}

export function FieldEditor({ field, onUpdate }: FieldEditorProps) {
  const { control, watch } = useForm({
    defaultValues: {
      fieldType: field.type,
      fieldWidth: field.width || 'full',
      fieldLabel: field.label || '',
      fieldPlaceholder: field.placeholder || '',
      fieldDescription: field.helperText || '',
      fieldRequired: field.validation?.required || false,
    },
  });

  // Watch for changes and update the field
  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'fieldLabel') {
        onUpdate({ label: value.fieldLabel });
      } else if (name === 'fieldPlaceholder') {
        onUpdate({ placeholder: value.fieldPlaceholder });
      } else if (name === 'fieldDescription') {
        onUpdate({ helperText: value.fieldDescription });
      } else if (name === 'fieldRequired') {
        onUpdate({
          validation: {
            ...field.validation,
            required: !!value.fieldRequired,
          },
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, onUpdate, field.validation]);

  // Field type options
  const fieldTypeOptions: SelectOption[] = [
    { value: 'text', label: 'Text Input' },
    { value: 'number', label: 'Number Input' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'select', label: 'Dropdown Select' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'address', label: 'Blockchain Address' },
    { value: 'amount', label: 'Token Amount' },
  ];

  // Field width options
  const fieldWidthOptions: SelectOption[] = [
    { value: 'full', label: 'Full Width' },
    { value: 'half', label: 'Half Width' },
    { value: 'third', label: 'One Third' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          id="field-label"
          name="fieldLabel"
          label="Field Label"
          control={control}
          placeholder="Enter field label"
        />

        <SelectField
          id="field-type"
          name="fieldType"
          label="Field Type"
          control={control}
          options={fieldTypeOptions}
          placeholder="Select field type"
          validateSelect={(value) => {
            onUpdate({ type: value as FieldType });
            return true;
          }}
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
          validateSelect={(value) => {
            onUpdate({ width: value as 'full' | 'half' | 'third' });
            return true;
          }}
        />
      </div>

      <TextAreaField
        id="field-description"
        name="fieldDescription"
        label="Field Description"
        control={control}
        placeholder="Enter field description or instructions"
      />

      <BooleanField
        id="field-required"
        name="fieldRequired"
        label="Required Field"
        control={control}
      />
    </div>
  );
}
