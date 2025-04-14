import type { Control } from 'react-hook-form';

import type { ContractAdapter } from '../../../adapters';
import type {
  BuilderFormConfig,
  ExecutionConfig,
  ExecutionMethodType,
} from '../../../core/types/FormTypes';

/**
 * Props for the StepExecutionMethod component.
 */
export interface StepExecutionMethodProps {
  currentConfig?: ExecutionConfig;
  onUpdateConfig: (config: ExecutionConfig | undefined, isValid: boolean) => void;
  adapter: ContractAdapter | null;
  formConfig?: BuilderFormConfig;
}

/**
 * Shape of the form data managed by react-hook-form within the step.
 */
export interface ExecutionMethodFormData {
  executionMethodType: ExecutionMethodType | undefined;
  eoaOption?: 'any' | 'specific';
  specificEoaAddress?: string;
}

/**
 * Props for UI sub-components handling specific sections.
 */
export interface EoaConfigurationProps {
  control: Control<ExecutionMethodFormData>;
  adapter: ContractAdapter | null;
  watchedEoaOption: 'any' | 'specific' | undefined;
}

export interface PrimaryMethodSelectorProps {
  control: Control<ExecutionMethodFormData>;
  adapterAvailable: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
}
