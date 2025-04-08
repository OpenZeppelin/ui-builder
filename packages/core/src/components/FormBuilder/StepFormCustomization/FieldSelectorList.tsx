import { FormFieldType } from '@openzeppelin/transaction-form-renderer';

interface FieldSelectorListProps {
  /**
   * The array of form fields to display
   */
  fields: FormFieldType[];

  /**
   * The currently selected field index
   */
  selectedFieldIndex: number | null;

  /**
   * Callback when a field is selected
   */
  onSelectField: (index: number) => void;
}

/**
 * Component that displays a list of fields with their types and allows selection
 */
export function FieldSelectorList({
  fields,
  selectedFieldIndex,
  onSelectField,
}: FieldSelectorListProps) {
  return (
    <div className="col-span-1 space-y-4 border-r pr-4">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className={`cursor-pointer rounded-md border p-3 ${
            selectedFieldIndex === index ? 'border-primary bg-primary/5' : ''
          }`}
          onClick={() => onSelectField(index)}
        >
          <p className="font-medium">{field.label}</p>
          <p className="text-muted-foreground text-xs">
            <code className="bg-muted rounded-sm border px-1 py-0.5 font-mono text-xs">
              {field.originalParameterType}
            </code>
            {' → '}
            {field.type}
          </p>
        </div>
      ))}
    </div>
  );
}
