import CodeEditor from '@uiw/react-textarea-code-editor';
import CodeEditorNoHighlight from '@uiw/react-textarea-code-editor/nohighlight';
import React from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { ErrorMessage } from './utils';

/**
 * CodeEditorField component properties
 */
export interface CodeEditorFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends React.ComponentPropsWithoutRef<'div'> {
  /**
   * Unique identifier for the field
   */
  id: string;

  /**
   * Field name for form control
   */
  name: Path<TFieldValues>;

  /**
   * React Hook Form control object
   */
  control: Control<TFieldValues>;

  /**
   * Field label
   */
  label?: string;

  /**
   * Helper text displayed below the field
   */
  helperText?: string;

  /**
   * Placeholder text when empty
   */
  placeholder?: string;

  /**
   * Programming language for syntax highlighting
   */
  language?: string;

  /**
   * Editor theme
   */
  theme?: string;

  /**
   * Editor height
   */
  height?: string;

  /**
   * Editor maximum height (with scrollbar for overflow)
   */
  maxHeight?: string;

  /**
   * Content size threshold for disabling syntax highlighting (default: 5000 chars)
   */
  performanceThreshold?: number;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Whether the field is disabled
   */
  disabled?: boolean;

  /**
   * Whether the field is read-only
   */
  readOnly?: boolean;

  /**
   * Custom validation function for code values
   */
  validateCode?: (value: string) => boolean | string;
}

/**
 * CodeEditorField provides syntax-highlighted code editing with form integration.
 *
 * Features:
 * - Syntax highlighting via @uiw/react-textarea-code-editor
 * - React Hook Form integration with Controller
 * - Configurable language support (JSON, TypeScript, etc.)
 * - Performance optimizations with smart highlighting
 * - Constrained height with automatic scrolling
 * - Design system styling integration
 *
 * @example
 * ```tsx
 * <CodeEditorField
 *   id="contractAbi"
 *   name="contractSchema"
 *   control={control}
 *   label="Contract ABI"
 *   language="json"
 *   placeholder="Paste your ABI JSON here..."
 * />
 * ```
 */
export function CodeEditorField<TFieldValues extends FieldValues = FieldValues>({
  id,
  name,
  control,
  label,
  helperText,
  placeholder = '',
  language = 'json',
  theme = 'light',
  height = '200px',
  maxHeight = '400px',
  performanceThreshold = 5000,
  required = false,
  disabled = false,
  readOnly = false,
  validateCode,
  className,
  ...props
}: CodeEditorFieldProps<TFieldValues>): React.ReactElement {
  // Convert height strings to numbers for native props
  const minHeightNum = parseInt(height.replace('px', ''), 10) || 200;
  const maxHeightNum = parseInt(maxHeight.replace('px', ''), 10) || 400;

  return (
    <div className={className} {...props}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <Controller
        name={name}
        control={control}
        rules={{
          required: required ? 'This field is required' : false,
          // Move validation to onBlur to avoid expensive operations on every keystroke
          validate: {
            validCode: (value: string) => {
              if (!validateCode || !value) return true;

              const validation = validateCode(value);
              if (typeof validation === 'string') {
                return validation;
              }
              if (validation === false) {
                return 'Invalid code format';
              }
              return true;
            },
          },
        }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
          // Check if content is too large for syntax highlighting
          const contentSize = (value || '').length;
          const shouldDisableHighlighting = contentSize > performanceThreshold;
          const EditorComponent = shouldDisableHighlighting ? CodeEditorNoHighlight : CodeEditor;

          // Update form immediately to prevent controlled component conflicts
          const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
            onChange(event.target.value); // Immediate update for controlled component
          };

          // Simple blur handler
          const handleBlur = (): void => {
            onBlur();
          };

          return (
            <div className="space-y-2">
              <div
                className="w-full rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                style={{
                  maxHeight: `${maxHeightNum}px`,
                  overflow: 'auto',
                  overflowX: 'hidden', // Prevent horizontal scrolling and expansion
                  minHeight: `${minHeightNum}px`,
                  resize: 'vertical',
                }}
              >
                <EditorComponent
                  id={id}
                  value={value || ''}
                  language={language}
                  placeholder={placeholder}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  padding={12}
                  minHeight={minHeightNum}
                  data-color-mode={theme as 'light' | 'dark'}
                  disabled={disabled}
                  readOnly={readOnly}
                  data-testid={`${id}-code-editor${shouldDisableHighlighting ? '-no-highlight' : ''}`}
                  className="text-sm placeholder:text-muted-foreground"
                  style={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                    fontSize: '14px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    width: '100%',
                    wordWrap: 'break-word', // Break long words to prevent horizontal overflow
                    whiteSpace: 'pre-wrap', // Preserve formatting while allowing wrapping
                    overflowWrap: 'break-word', // Modern CSS property for word breaking
                  }}
                />
              </div>

              <ErrorMessage error={error} id={`${id}-error`} />

              {helperText && !error && (
                <p className="text-sm text-muted-foreground" id={`${id}-helper`}>
                  {helperText}
                </p>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}

CodeEditorField.displayName = 'CodeEditorField';
