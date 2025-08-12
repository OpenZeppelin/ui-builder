import type { FormFieldType } from '@openzeppelin/contracts-ui-builder-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@openzeppelin/contracts-ui-builder-ui';

interface MobileFieldSelectorProps {
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
 * Unified field selector that displays current field information and allows selection
 * in a single component. Acts as both indicator and selector.
 */
export function MobileFieldSelector({
  fields,
  selectedFieldIndex,
  onSelectField,
}: MobileFieldSelectorProps) {
  const effectiveSelectedIndex = selectedFieldIndex ?? 0;
  const selectedField = fields[effectiveSelectedIndex];

  return (
    <div className="space-y-3">
      {/* Unified selector/indicator */}
      <Select
        value={effectiveSelectedIndex.toString()}
        onValueChange={(value) => onSelectField(parseInt(value, 10))}
      >
        <SelectTrigger className="h-auto min-h-[3rem] px-4 py-3 bg-card border-2 border-border hover:border-primary/50 transition-colors [&>svg]:ml-3">
          <SelectValue asChild>
            {selectedField ? (
              <div className="flex items-center justify-between w-full pr-2">
                <div className="flex flex-col items-start flex-1">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Editing Field
                  </span>
                  <span className="font-semibold text-base mt-0.5">{selectedField.label}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {selectedField.originalParameterType}
                  </code>
                </div>
              </div>
            ) : (
              <span>Choose a field to edit</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {fields.map((field, index) => (
            <SelectItem key={field.id} value={index.toString()} className="py-3">
              <div className="flex flex-col w-full">
                <div className="font-medium text-sm">{field.label}</div>
                <div className="text-muted-foreground text-xs">
                  {field.originalParameterType} → {field.type}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
