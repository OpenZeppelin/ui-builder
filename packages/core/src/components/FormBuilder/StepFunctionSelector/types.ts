import type {
  ContractFunction,
  ContractSchema,
  NetworkConfig,
} from '@openzeppelin/transaction-form-types';

export interface StepFunctionSelectorProps {
  contractSchema: ContractSchema | null;
  selectedFunction: string | null;
  onFunctionSelected: (functionId: string | null) => void;
  networkConfig?: NetworkConfig | null;
  onToggleContractState?: () => void;
  isWidgetExpanded?: boolean;
}

export interface FilterControlsProps {
  filterValue: string;
  setFilterValue: (value: string) => void;
}

export interface WritableFunctionCardProps {
  fn: ContractFunction;
  isSelected: boolean;
  onSelect: (functionId: string, modifiesState: boolean) => void;
}

export interface ReadOnlyFunctionCardProps {
  fn: ContractFunction;
}

export interface WritableFunctionsSectionProps {
  functions: ContractFunction[];
  selectedFunction: string | null;
  onSelectFunction: (functionId: string, modifiesState: boolean) => void;
}

export interface ReadOnlyFunctionsSectionProps {
  functions: ContractFunction[];
}
