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
}

export interface ContractSchema {
  name?: string;
  chainType: ChainType;
  functions: ContractFunction[];
  events?: { id: string; name: string; inputs: FunctionParameter[] }[]; // More specific type
  // Other chain-agnostic schema properties
}

// Legacy type compatibility (until full refactoring)
export type AbiItem = {
  type: string;
  name?: string;
  inputs?: Array<{
    name: string;
    type: string;
    internalType?: string;
    indexed?: boolean;
    components?: Array<{
      name: string;
      type: string;
      internalType?: string;
      indexed?: boolean;
    }>;
  }>;
  stateMutability?: string;
  anonymous?: boolean;
  outputs?: Array<{
    name: string;
    type: string;
    internalType?: string;
    components?: Array<{
      name: string;
      type: string;
      internalType?: string;
    }>;
  }>;
};
