import type { Control, UseFormReturn } from 'react-hook-form';

import type { ExecutionMethodType, RelayerDetails } from '@openzeppelin/ui-types';
import { FormFieldType, FormValues } from '@openzeppelin/ui-types';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

/**
 * Form values interface for the field editor form
 *
 * While this interface doesn't add any new properties, it provides:
 * 1. A clear, descriptive type name for form values
 * 2. A single place to extend with form-specific properties if needed in the future
 * 3. Type consistency across the form handling components
 */
export interface FieldEditorFormValues extends FormValues, Partial<FormFieldType> {
  // We intentionally don't add any new properties here to maintain a direct mapping
  // to the FormFieldType interface
}

/**
 * Shape of the form data managed by react-hook-form within the execution method UI.
 */
export interface ExecutionMethodFormData {
  executionMethodType: ExecutionMethodType | undefined;
  eoaOption?: 'any' | 'specific';
  specificEoaAddress?: string;
  relayerServiceUrl?: string;
  selectedRelayer?: string;
  selectedRelayerDetails?: RelayerDetails;
  transactionOptions?: Record<string, unknown>;
}

/**
 * Props for UI sub-components handling specific sections.
 */
export interface EoaConfigurationProps {
  control: Control<ExecutionMethodFormData>;
  runtime: BuilderRuntime | null;
  watchedEoaOption: 'any' | 'specific' | undefined;
}

export interface RelayerConfigurationProps {
  control: Control<ExecutionMethodFormData>;
  runtime: BuilderRuntime | null;
  setValue: UseFormReturn<ExecutionMethodFormData>['setValue'];
}

export interface PrimaryMethodSelectorProps {
  control: Control<ExecutionMethodFormData>;
  runtimeAvailable: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
  watchedEoaOption?: 'any' | 'specific' | undefined;
  runtime?: BuilderRuntime | null;
  setValue: UseFormReturn<ExecutionMethodFormData>['setValue'];
  isWidgetExpanded?: boolean;
}
