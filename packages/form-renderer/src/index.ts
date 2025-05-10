/**
 * Transaction Form Renderer
 *
 * A shared form rendering library for blockchain transaction forms
 */

// Export types from FormTypes
export type { FormRendererConfig } from './types/FormRendererConfig';

// Export components selectively to avoid name conflicts
export * from './components/fields';
export * from './components/fields/SelectField';
export { TransactionForm } from './components/TransactionForm';

// Export UI components
export * from './components/ui/button';
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
export * from './components/ui/loading-button';
export * from './components/ui/progress';

// Export specific fields if needed
export type { SelectOption } from './components/fields/SelectField';
export * from './components/fields/SelectField';
export * from './components/fields/SelectGroupedField';

// Export utilities
export * from './utils';

// Export main components
export * from './components';

// Specifically re-export key components for easier top-level import
export { DynamicFormField } from './components/DynamicFormField';
