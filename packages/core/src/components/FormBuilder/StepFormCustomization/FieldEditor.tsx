import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import {
  BooleanField,
  ContractAdapter,
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
  adapter?: ContractAdapter;
  originalParameterType?: string;
}

export function FieldEditor({ field, onUpdate, adapter, originalParameterType }: FieldEditorProps) {
  const { control, watch, reset } = useForm({
    defaultValues: {
      fieldType: field.type,
      fieldWidth: field.width || 'full',
      fieldLabel: field.label || '',
      fieldPlaceholder: field.placeholder || '',
      fieldDescription: field.helperText || '',
      fieldRequired: field.validation?.required || false,
    },
  });

  // Add useEffect to reset form when field prop changes
  React.useEffect(() => {
    reset({
      fieldType: field.type,
      fieldWidth: field.width || 'full',
      fieldLabel: field.label || '',
      fieldPlaceholder: field.placeholder || '',
      fieldDescription: field.helperText || '',
      fieldRequired: field.validation?.required || false,
    });
  }, [field, reset]);

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

  // Get compatible field types
  const compatibleFieldTypes = useMemo(() => {
    if (!adapter || !originalParameterType) {
      // If we don't have adapter or original type, return all field types
      return [
        'text',
        'number',
        'checkbox',
        'radio',
        'select',
        'textarea',
        'date',
        'email',
        'password',
        'address',
        'amount',
      ];
    }

    return adapter.getCompatibleFieldTypes(originalParameterType);
  }, [adapter, originalParameterType]);

  // Get recommended field type (first compatible type)
  const recommendedFieldType = useMemo(() => {
    return compatibleFieldTypes[0] || field.type;
  }, [compatibleFieldTypes, field.type]);

  // Field type options with grouping and compatibility indicators
  const fieldTypeOptions = useMemo(() => {
    // Define all field types organized by groups
    const allFieldGroups = [
      {
        label: 'Text Inputs',
        options: [
          { value: 'text', label: 'Text Input' },
          { value: 'textarea', label: 'Text Area' },
          { value: 'email', label: 'Email Input' },
          { value: 'password', label: 'Password Input' },
        ],
      },
      {
        label: 'Numeric Inputs',
        options: [
          { value: 'number', label: 'Number Input' },
          { value: 'amount', label: 'Token Amount' },
        ],
      },
      {
        label: 'Selection Inputs',
        options: [
          { value: 'select', label: 'Dropdown Select' },
          { value: 'radio', label: 'Radio Buttons' },
          { value: 'checkbox', label: 'Checkbox' },
        ],
      },
      {
        label: 'Blockchain Specific',
        options: [
          { value: 'address', label: 'Blockchain Address' },
          { value: 'date', label: 'Date Input' },
        ],
      },
    ];

    // If we don't have compatibility info, return all options as is
    if (!compatibleFieldTypes.length) {
      return allFieldGroups;
    }

    // Enhance options with compatibility information
    return allFieldGroups.map((group) => {
      return {
        label: group.label,
        options: group.options.map((option) => {
          const fieldType = option.value as FieldType;
          const isCompatible = compatibleFieldTypes.includes(fieldType);
          const isRecommended = fieldType === recommendedFieldType;

          let enhancedLabel = option.label;
          if (isRecommended) {
            enhancedLabel = `${option.label} (Recommended)`;
          }

          return {
            ...option,
            label: enhancedLabel,
            disabled: !isCompatible,
            // Add data attributes for styling
            'data-compatible': isCompatible ? 'true' : 'false',
            'data-recommended': isRecommended ? 'true' : 'false',
          };
        }),
      };
    });
  }, [compatibleFieldTypes, recommendedFieldType]);

  // Display a warning for incompatible field type selection
  const selectedFieldType = watch('fieldType') as FieldType;
  const showTypeWarning = useMemo(() => {
    return (
      compatibleFieldTypes.length > 0 &&
      selectedFieldType !== recommendedFieldType &&
      !compatibleFieldTypes.includes(selectedFieldType)
    );
  }, [compatibleFieldTypes, recommendedFieldType, selectedFieldType]);

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

        <div>
          <SelectField
            id="field-type"
            name="fieldType"
            label="Field Type"
            control={control}
            optionGroups={fieldTypeOptions}
            placeholder="Select field type"
            validateSelect={(value) => {
              onUpdate({ type: value as FieldType });
              return true;
            }}
          />

          {showTypeWarning && (
            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
              <p className="font-medium">Warning: Incompatible Field Type</p>
              <p>This field type may not be suitable for {originalParameterType} data.</p>
            </div>
          )}
        </div>

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
