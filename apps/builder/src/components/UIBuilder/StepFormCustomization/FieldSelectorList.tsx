import { TooltipProvider } from '@openzeppelin/ui-components';
import type { FormFieldType } from '@openzeppelin/ui-types';

import { FieldHeader, ParameterFieldDisplay, RuntimeSecretFieldDisplay } from './components';

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

  /**
   * Map of field IDs to their validation error status
   */
  fieldValidationErrors?: Map<string, boolean>;

  /**
   * Optional callback when a field should be removed
   */
  onDeleteField?: (index: number) => void;
}

/**
 * Component that displays a list of fields with their types and allows selection
 */
export function FieldSelectorList({
  fields,
  selectedFieldIndex,
  onSelectField,
  fieldValidationErrors,
  onDeleteField,
}: FieldSelectorListProps) {
  return (
    <TooltipProvider>
      <div className="space-y-2 border-r pr-4">
        {fields.map((field, index) => {
          const isSelected = (selectedFieldIndex ?? 0) === index;
          const hasValidationError = fieldValidationErrors?.get(field.id) ?? false;
          const isRuntimeSecret = field.type === 'runtimeSecret';

          return (
            <div
              key={field.id}
              className={`cursor-pointer rounded-md border p-2 transition-colors ${
                hasValidationError
                  ? 'border-destructive bg-destructive/5 hover:border-destructive/70 hover:bg-destructive/10'
                  : isSelected
                    ? 'border-primary bg-primary/5 hover:border-primary/70 hover:bg-primary/10'
                    : 'hover:border-primary/50 hover:bg-primary/2'
              }`}
              onClick={() => onSelectField(index)}
            >
              <FieldHeader field={field} onDeleteField={onDeleteField} index={index} />

              {/* Custom rendering for runtime secret fields */}
              {isRuntimeSecret ? (
                <RuntimeSecretFieldDisplay />
              ) : (
                // Standard rendering for parameter-based fields
                <ParameterFieldDisplay field={field} />
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
