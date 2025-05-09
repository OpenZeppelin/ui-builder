import { ContractAdapter, NetworkConfig } from '@openzeppelin/transaction-form-types';
import type { ContractSchema } from '@openzeppelin/transaction-form-types';

export interface StepContractDefinitionProps {
  onContractSchemaLoaded: (schema: ContractSchema | null) => void;
  adapter: ContractAdapter | null;
  networkConfig: NetworkConfig | null;
  existingContractSchema?: ContractSchema | null;
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
