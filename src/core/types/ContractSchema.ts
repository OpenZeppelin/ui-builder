export type ChainType = 'evm' | 'midnight' | 'stellar' | 'solana';

export interface ChainDefinition {
  id: ChainType;
  name: string;
  description: string;
  icon?: React.ReactNode;
}

export interface FunctionParameter {
  name: string;
  type: string;
  displayName?: string;
  description?: string;
  components?: FunctionParameter[]; // For complex types
}

export interface ContractFunction {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  inputs: FunctionParameter[];
  outputs?: FunctionParameter[];
  stateMutability?: string;
  type: string;
  modifiesState: boolean; // Indicates if the function modifies blockchain state (writable)
}

export interface ContractSchema {
  name?: string;
  chainType: ChainType;
  functions: ContractFunction[];
  events?: { id: string; name: string; inputs: FunctionParameter[] }[]; // More specific type
  // Other chain-agnostic schema properties
}
