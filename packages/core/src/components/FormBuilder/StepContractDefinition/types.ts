import type { ChainType, ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

export interface StepContractDefinitionProps {
  onContractSchemaLoaded: (schema: ContractSchema) => void;
  selectedChain: ChainType;
  existingContractSchema?: ContractSchema | null;
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
  existingContractAddress?: string | null;
}

export interface ContractPreviewProps {
  contractSchema: ContractSchema | null;
}
