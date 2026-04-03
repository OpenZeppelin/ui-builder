import type { ContractFunction, ContractSchema, NetworkConfig } from '@openzeppelin/ui-types';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

export interface StepFunctionSelectorProps {
  contractSchema: ContractSchema | null;
  onFunctionSelected: (functionId: string | null) => void;
  selectedFunction?: string | null;
  networkConfig?: NetworkConfig | null;
  onToggleContractState?: () => void;
  isWidgetExpanded?: boolean;
  runtime?: BuilderRuntime;
}

export interface FilterControlsProps {
  filterValue: string;
  setFilterValue: (value: string) => void;
}

export interface WritableFunctionRowProps {
  fn: ContractFunction;
  isSelected: boolean;
  onSelect: (functionId: string, modifiesState: boolean) => void;
}

export interface ReadOnlyFunctionCardProps {
  fn: ContractFunction;
}

export interface WritableFunctionsSectionProps {
  functions: ContractFunction[];
  selectedFunction?: string | null;
  onSelectFunction: (functionId: string, modifiesState: boolean) => void;
}

export interface ReadOnlyFunctionsSectionProps {
  functions: ContractFunction[];
}
