import { ContractAdapter, NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import type { ContractSchema, FormValues } from '@openzeppelin/contracts-ui-builder-types';

import type { ContractDefinitionComparisonResult } from '../../warnings';

export interface StepContractDefinitionProps {
  adapter: ContractAdapter | null;
  networkConfig: NetworkConfig | null;
  existingFormValues?: FormValues | null;
  loadedConfigurationId?: string | null;
  onToggleContractState?: () => void;
  isWidgetExpanded?: boolean;
  // Definition comparison functionality
  definitionComparison?: {
    comparisonResult: ContractDefinitionComparisonResult | null;
    isComparing: boolean;
    dismissWarning: (recordId: string, definitionHash: string) => void;
    compareDefinitions: (
      stored: string,
      fresh: string
    ) => Promise<ContractDefinitionComparisonResult | null>;
  };
}

export interface ContractFormData {
  contractAddress: string;
}

export interface ContractAddressFormProps {
  adapter: ContractAdapter;
  networkConfig: NetworkConfig;
  isLoading: boolean;
  onLoadContract: (schema: ContractSchema) => void;
  onClearContract: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  error: string | null;
  existingContractAddress?: string | null;
}
