import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import {
  BooleanField,
  ContractAdapter,
  FieldType,
  FormFieldType,
  type OptionGroup,
  SelectField,
  SelectGroupedField,
  TextAreaField,
  TextField,
} from '@openzeppelin/transaction-form-renderer';

import { TypeConversionWarning } from './TypeConversionWarning';

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

  // Organize field types into groups with compatibility indicators
  const fieldTypeGroups = useMemo(() => {
    // Get compatible field types if adapter and parameter type are available
    const compatibleTypes =
      adapter && originalParameterType
        ? adapter.getCompatibleFieldTypes(originalParameterType)
        : ([
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
            'hidden',
          ] as FieldType[]);

    // The first compatible type is considered recommended
    const recommendedType = compatibleTypes[0];

    // Find the full option details for the recommended type
    const findOptionDetails = (type: FieldType) => {
      if (type.includes('text')) return { value: type, label: 'Text Input' };
      if (type === 'textarea') return { value: type, label: 'Text Area' };
      if (type === 'email') return { value: type, label: 'Email Input' };
      if (type === 'password') return { value: type, label: 'Password Input' };
      if (type === 'number') return { value: type, label: 'Number Input' };
      if (type === 'amount') return { value: type, label: 'Token Amount' };
      if (type === 'select') return { value: type, label: 'Dropdown Select' };
      if (type === 'radio') return { value: type, label: 'Radio Buttons' };
      if (type === 'checkbox') return { value: type, label: 'Checkbox' };
      if (type === 'address') return { value: type, label: 'Blockchain Address' };
      return { value: type, label: type.charAt(0).toUpperCase() + type.slice(1) };
    };

    const recommendedOption = findOptionDetails(recommendedType);

    // Helper function to create option objects
    const createOption = (type: FieldType, label: string) => ({
      value: type,
      label,
      disabled: !compatibleTypes.includes(type),
    });

    // Create grouped structure with compatibility indicators
    const groups: OptionGroup[] = [
      // Add Recommended group at the top
      {
        label: 'Recommended',
        options: [
          {
            ...recommendedOption,
            disabled: false,
          },
        ],
      },
      {
        label: 'Text Inputs',
        options: ['text', 'textarea', 'email', 'password']
          .filter((type) => type !== recommendedType) // Remove the recommended type
          .map((type) => {
            if (type === 'text') return createOption('text' as FieldType, 'Text Input');
            if (type === 'textarea') return createOption('textarea' as FieldType, 'Text Area');
            if (type === 'email') return createOption('email' as FieldType, 'Email Input');
            if (type === 'password') return createOption('password' as FieldType, 'Password Input');
            return createOption(type as FieldType, type);
          }),
      },
      {
        label: 'Numeric Inputs',
        options: ['number', 'amount']
          .filter((type) => type !== recommendedType)
          .map((type) => {
            if (type === 'number') return createOption('number' as FieldType, 'Number Input');
            if (type === 'amount') return createOption('amount' as FieldType, 'Token Amount');
            return createOption(type as FieldType, type);
          }),
      },
      {
        label: 'Selection Inputs',
        options: ['select', 'radio', 'checkbox']
          .filter((type) => type !== recommendedType)
          .map((type) => {
            if (type === 'select') return createOption('select' as FieldType, 'Dropdown Select');
            if (type === 'radio') return createOption('radio' as FieldType, 'Radio Buttons');
            if (type === 'checkbox') return createOption('checkbox' as FieldType, 'Checkbox');
            return createOption(type as FieldType, type);
          }),
      },
      {
        label: 'Blockchain Specific',
        options: ['address']
          .filter((type) => type !== recommendedType)
          .map((type) => {
            if (type === 'address')
              return createOption('address' as FieldType, 'Blockchain Address');
            return createOption(type as FieldType, type);
          }),
      },
    ];

    // Filter out empty groups (when all options were the recommended type)
    return groups.filter((group) => group.label === 'Recommended' || group.options.length > 0);
  }, [adapter, originalParameterType]);

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
      } else if (name === 'fieldType') {
        onUpdate({ type: value.fieldType as FieldType });
      } else if (name === 'fieldWidth') {
        onUpdate({ width: value.fieldWidth as 'full' | 'half' | 'third' });
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

  // Display a type conversion warning if not using the recommended type
  const selectedType = watch('fieldType') as FieldType;
  // Recommended type is the first compatible type
  const recommendedType =
    adapter && originalParameterType
      ? adapter.getCompatibleFieldTypes(originalParameterType)[0]
      : 'text';

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

      {/* Display field type conversion warning using the dedicated component */}
      {adapter && originalParameterType && (
        <TypeConversionWarning
          selectedType={selectedType}
          recommendedType={recommendedType}
          originalParameterType={originalParameterType}
        />
      )}

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
