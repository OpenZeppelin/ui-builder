import { ContractAdapter, NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import type { ContractSchema, FormValues } from '@openzeppelin/contracts-ui-builder-types';

export interface StepContractDefinitionProps {
  onContractSchemaLoaded: (schema: ContractSchema | null, formValues?: FormValues) => void;
  adapter: ContractAdapter | null;
  networkConfig: NetworkConfig | null;
  existingContractSchema?: ContractSchema | null;
  existingFormValues?: FormValues | null;
  onToggleContractState?: () => void;
  isWidgetExpanded?: boolean;
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

export interface ContractPreviewProps {
  contractSchema: ContractSchema | null;
}
