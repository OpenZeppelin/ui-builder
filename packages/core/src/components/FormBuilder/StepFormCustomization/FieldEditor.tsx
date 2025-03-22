import type { FieldType, FormFieldType } from '@openzeppelin/transaction-form-renderer';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@form-renderer/components/ui/select';

import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

interface FieldEditorProps {
  field: FormFieldType;
  onUpdate: (updatedField: Partial<FormFieldType>) => void;
}

export function FieldEditor({ field, onUpdate }: FieldEditorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Edit Field</h3>

      <div className="flex flex-col gap-2">
        <Label htmlFor="field-label">Label</Label>
        <Input
          id="field-label"
          value={field.label}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ label: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="field-placeholder">Placeholder</Label>
        <Input
          id="field-placeholder"
          value={field.placeholder || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onUpdate({ placeholder: e.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="field-help">Help Text</Label>
        <Textarea
          id="field-help"
          value={field.helperText || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onUpdate({ helperText: e.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="field-type">Field Type</Label>
        <Select
          value={field.type}
          onValueChange={(value) => onUpdate({ type: value as FieldType })}
        >
          <SelectTrigger id="field-type">
            <SelectValue placeholder="Select field type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text Input</SelectItem>
            <SelectItem value="number">Number Input</SelectItem>
            <SelectItem value="checkbox">Checkbox</SelectItem>
            <SelectItem value="select">Dropdown Select</SelectItem>
            <SelectItem value="textarea">Text Area</SelectItem>
            <SelectItem value="address">Blockchain Address</SelectItem>
            <SelectItem value="amount">Token Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="field-width">Field Width</Label>
        <Select
          value={field.width || 'full'}
          onValueChange={(value) => onUpdate({ width: value as 'full' | 'half' | 'third' })}
        >
          <SelectTrigger id="field-width">
            <SelectValue placeholder="Select field width" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Width</SelectItem>
            <SelectItem value="half">Half Width</SelectItem>
            <SelectItem value="third">One Third</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="field-required"
          checked={field.validation.required || false}
          onCheckedChange={(checked: boolean | 'indeterminate') =>
            onUpdate({
              validation: {
                ...field.validation,
                required: checked === true,
              },
            })
          }
        />
        <Label htmlFor="field-required">Required Field</Label>
      </div>
    </div>
  );
}
