import type { ContractAdapter, FormFieldType } from '@openzeppelin/ui-types';

import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { FieldEditor } from './FieldEditor';
import { FieldSelectorList } from './FieldSelectorList';
import { MobileFieldSelector } from './MobileFieldSelector';

interface ResponsiveFieldsLayoutProps {
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
   * Chain-specific adapter for type validation and mapping
   */
  adapter: ContractAdapter;

  /**
   * Callback fired when field properties are updated
   */
  onUpdateField: (index: number, updates: Partial<FormFieldType>) => void;

  /**
   * Callback fired when field validation status changes
   */
  onFieldValidationChange?: (fieldId: string, hasError: boolean) => void;

  /**
   * Map of field IDs to their validation error status
   */
  fieldValidationErrors?: Map<string, boolean>;

  /**
   * Optional callback when a field should be deleted (used for runtime secret fields)
   */
  onDeleteField?: (index: number) => void;
}

/**
 * Responsive layout component that adapts the field editing interface for different screen sizes.
 *
 * On mobile devices (< md breakpoint):
 * - Shows a dropdown selector for choosing fields
 * - Displays the field editor below the selector
 *
 * On desktop devices (>= md breakpoint):
 * - Shows the traditional sidebar layout with field list on the left
 * - Displays the field editor on the right side
 */
export function ResponsiveFieldsLayout({
  fields,
  selectedFieldIndex,
  onSelectField,
  adapter,
  onUpdateField,
  onFieldValidationChange,
  fieldValidationErrors,
  onDeleteField,
}: ResponsiveFieldsLayoutProps) {
  // Show first field if none is selected but fields exist
  const effectiveSelectedIndex = selectedFieldIndex ?? 0;
  const selectedField = fields[effectiveSelectedIndex];

  // Use media query to determine if we're on mobile
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-6">
        {/* Mobile unified field selector/indicator */}
        <MobileFieldSelector
          fields={fields}
          selectedFieldIndex={selectedFieldIndex}
          onSelectField={onSelectField}
          fieldValidationErrors={fieldValidationErrors}
        />

        {/* Mobile field editor content */}
        {selectedField && (
          <div className="bg-card border rounded-lg p-4">
            <FieldEditor
              key={selectedField.id}
              field={selectedField}
              onUpdate={(updates) => onUpdateField(effectiveSelectedIndex, updates)}
              adapter={adapter}
              originalParameterType={selectedField.originalParameterType}
              onFieldValidationChange={onFieldValidationChange}
            />
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout: Sidebar + editor
  return (
    <div className="grid grid-cols-3 gap-4">
      <FieldSelectorList
        fields={fields}
        selectedFieldIndex={selectedFieldIndex}
        onSelectField={onSelectField}
        fieldValidationErrors={fieldValidationErrors}
        onDeleteField={onDeleteField}
      />
      <div className="col-span-2">
        {selectedField && (
          <FieldEditor
            key={selectedField.id}
            field={selectedField}
            onUpdate={(updates) => onUpdateField(effectiveSelectedIndex, updates)}
            adapter={adapter}
            originalParameterType={selectedField.originalParameterType}
            onFieldValidationChange={onFieldValidationChange}
          />
        )}
      </div>
    </div>
  );
}
