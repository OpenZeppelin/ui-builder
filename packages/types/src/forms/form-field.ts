import { FunctionParameter } from '../contracts/schema';
import { FieldCondition, FieldTransforms, FieldType, FieldValue } from './fields';
import { FieldValidation } from './validation';

/**
 * Form field definition with validation, display, and transformation options
 */
export interface FormFieldType<T extends FieldType = FieldType> {
  /**
   * Unique identifier for the field
   */
  id: string;

  /**
   * Parameter name used when submitting to the blockchain
   */
  name: string;

  /**
   * Human-readable label shown in the form
   */
  label: string;

  /**
   * Type of form field to render
   */
  type: T;

  /**
   * Placeholder text shown when empty
   */
  placeholder?: string;

  /**
   * Help text displayed below the field
   */
  helperText?: string;

  /**
   * Default value for the field
   */
  defaultValue?: FieldValue<T>;

  /**
   * Validation rules for the field
   */
  validation: FieldValidation;

  /**
   * Options for select, radio, checkbox fields
   */
  options?: { label: string; value: string }[];

  /**
   * Field width for layout
   */
  width?: 'full' | 'half' | 'third';

  /**
   * Transform functions for data conversion between UI and blockchain
   */
  transforms?: FieldTransforms<FieldValue<T>>;

  /**
   * Conditions that determine when this field should be visible
   */
  visibleWhen?: FieldCondition | FieldCondition[];

  /**
   * Original blockchain parameter type
   * Used to determine compatible field types and for data transformation
   */
  originalParameterType?: string;

  /**
   * Whether this field should be hidden from the rendered form UI
   * @default false
   */
  isHidden?: boolean;

  /**
   * Whether this field's value is fixed and not user-editable
   * If true and isHidden is false, the field might be rendered as read-only
   * @default false
   */
  isHardcoded?: boolean;

  /**
   * The fixed value to use if isHardcoded is true
   * The type should ideally correspond to FieldValue<T>, but using any for initial flexibility
   */
  hardcodedValue?: FieldValue<T>;

  /**
   * Whether the field should be displayed as read-only in the UI.
   * Typically used when isHardcoded is true but isHidden is false.
   * @default false
   */
  readOnly?: boolean;

  /**
   * Components/properties for object and array-object field types.
   * Defines the structure of nested objects.
   */
  components?: FunctionParameter[];

  /**
   * Element type for array fields (e.g., 'text', 'number', 'blockchain-address')
   */
  elementType?: FieldType;

  /**
   * Base configuration for array element fields
   */
  elementFieldConfig?: Partial<FormFieldType>;

  /**
   * Configuration specific to code editor fields
   */
  codeEditorProps?: {
    language?: string;
    placeholder?: string;
    theme?: string;
    height?: string;
    maxHeight?: string;
    performanceThreshold?: number;
  };

  /**
   * Enum metadata for enum field types.
   * Contains information about enum variants and their payload types.
   */
  enumMetadata?: {
    name: string;
    variants: Array<{
      name: string;
      type: 'void' | 'tuple' | 'integer';
      payloadTypes?: string[];
      value?: number;
    }>;
    isUnitOnly: boolean;
  };
}
