import type { ChainType, ContractSchema } from '../../../core/types/ContractSchema';

export interface StepContractDefinitionProps {
  onContractSchemaLoaded: (schema: ContractSchema) => void;
  selectedChain: ChainType;
}

export interface ContractFormData {
  contractAddress: string;
}

export interface ContractAddressFormProps {
  selectedChain: ChainType;
  isLoading: boolean;
  onLoadContract: (schema: ContractSchema) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  error: string | null;
}

export interface ContractPreviewProps {
  contractSchema: ContractSchema | null;
}
