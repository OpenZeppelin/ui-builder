import type { FieldType, FormFieldType } from '@openzeppelin/transaction-form-renderer';

import { useForm } from 'react-hook-form';

import { SelectField, type SelectOption } from '@form-renderer/components/fields/SelectField';

import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

interface FieldEditorProps {
  field: FormFieldType;
  onUpdate: (updatedField: Partial<FormFieldType>) => void;
}

export function FieldEditor({ field, onUpdate }: FieldEditorProps) {
  const { control } = useForm({
    defaultValues: {
      fieldType: field.type,
      fieldWidth: field.width || 'full',
    },
  });

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
        <div className="space-y-2">
          <Label htmlFor="field-label">Field Label</Label>
          <Input
            id="field-label"
            value={field.label || ''}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Enter field label"
          />
        </div>

        <div className="space-y-2">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-placeholder">Placeholder Text</Label>
          <Input
            id="field-placeholder"
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Enter placeholder text"
          />
        </div>

        <div className="space-y-2">
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="field-description">Field Description</Label>
        <Textarea
          id="field-description"
          value={field.helperText || ''}
          onChange={(e) => onUpdate({ helperText: e.target.value })}
          placeholder="Enter field description or instructions"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="field-required"
          checked={field.validation?.required || false}
          onCheckedChange={(checked) =>
            onUpdate({
              validation: {
                ...field.validation,
                required: !!checked,
              },
            })
          }
        />
        <Label htmlFor="field-required">Required Field</Label>
      </div>
    </div>
  );
}
