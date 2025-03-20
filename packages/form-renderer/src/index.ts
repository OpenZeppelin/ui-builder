/**
 * Transaction Form Renderer
 *
 * A shared form rendering library for blockchain transaction forms
 */

// Export types from FormTypes
export type {
  CommonFormProperties,
  ContractAdapter,
  FieldCondition,
  FieldTransforms,
  FieldType,
  FieldValidation,
  FieldValue,
  FormError,
  // Export FormField type but rename it to avoid conflict with UI component
  FormField as FormFieldType,
  FormLayout,
  FormValues,
  RenderFormSchema,
  SubmitButtonConfig,
  TransactionFormProps,
} from './types/FormTypes';

// Export components selectively to avoid name conflicts
export * from './components/fields';
export { TransactionForm } from './components/TransactionForm';

// Export UI components
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './components/ui/form';
export * from './components/ui/input';
export * from './components/ui/label';

// Export hooks (will be implemented later)
// export * from './hooks';

// Export utilities
export * from './utils';
