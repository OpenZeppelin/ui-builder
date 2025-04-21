import type { Control } from 'react-hook-form';

import type { ContractAdapter } from '../../../adapters';
import type { ExecutionMethodType } from '../../../core/types/FormTypes';

/**
 * Shape of the form data managed by react-hook-form within the execution method UI.
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
