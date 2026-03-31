import { NetworkConfig } from '@openzeppelin/ui-types';
import type { ContractSchema, FormValues } from '@openzeppelin/ui-types';

import type { BuilderAdapter } from '@/core/runtimeAdapter';

import type { ContractDefinitionComparisonResult } from '../../warnings';

export interface StepContractDefinitionProps {
  adapter: BuilderAdapter | null;
  networkConfig: NetworkConfig | null;
  existingFormValues?: FormValues | null;
  loadedConfigurationId?: string | null;
  onToggleContractState?: () => void;
  isWidgetExpanded?: boolean;
  // Definition comparison functionality
  definitionComparison?: {
    comparisonResult: ContractDefinitionComparisonResult;
  } | null;
  // Loading state from the centralized contract definition service
  isLoadingFromService?: boolean;
}

export interface ContractFormData {
  contractAddress: string;
}

export interface ContractAddressFormProps {
  adapter: BuilderAdapter;
  networkConfig: NetworkConfig;
  isLoading: boolean;
  onLoadContract: (schema: ContractSchema) => void;
  onClearContract: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  error: string | null;
  existingContractAddress?: string | null;
}
