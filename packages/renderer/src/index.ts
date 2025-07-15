/**
 * Transaction Renderer
 *
 * A shared app rendering library for blockchain transaction forms
 */

// Export types from FormTypes
export type { RendererConfig } from './types/RendererConfig';

// Export internal components to avoid name conflicts
export { TransactionForm } from './components/TransactionForm';

// Export utilities
export * from './utils';

// Export main components
export * from './components';

// Specifically re-export key components for easier top-level import
export { DynamicFormField } from './components/DynamicFormField';
