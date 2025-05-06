import { Ecosystem } from '@openzeppelin/transaction-form-types';
import type { ContractSchema } from '@openzeppelin/transaction-form-types';

export interface StepContractDefinitionProps {
  onContractSchemaLoaded: (schema: ContractSchema) => void;
  selectedEcosystem: Ecosystem;
  existingContractSchema?: ContractSchema | null;
}

export interface ContractFormData {
  contractAddress: string;
}

export interface ContractAddressFormProps {
  selectedEcosystem: Ecosystem;
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
