// Import core types from the types package
import type {
  // Import the canonical interface
  Connector,
  // Also import Connector type if needed directly
  ContractAdapter,
} from '@openzeppelin/transaction-form-types/adapters';
import type {
  ChainDefinition,
  ChainType,
  ContractFunction,
  ContractSchema,
  FunctionParameter,
} from '@openzeppelin/transaction-form-types/contracts';

import type {
  ExecutionConfig,
  ExecutionMethodDetail,
  ExecutionMethodType,
} from '../core/types/FormTypes';

import EvmAdapter from './evm/adapter';
import MidnightAdapter from './midnight/adapter';
import SolanaAdapter from './solana/adapter';
import StellarAdapter from './stellar/adapter';

// Re-export necessary types
export type {
  ChainDefinition,
  ChainType,
  ContractFunction,
  ContractSchema,
  ExecutionConfig,
  ExecutionMethodDetail,
  ExecutionMethodType,
  FunctionParameter,
  ContractAdapter, // Re-export the imported interface
  Connector, // Re-export the imported type
};

// Singleton instances of adapters
const adapters: Record<ChainType, ContractAdapter> = {
  evm: new EvmAdapter(),
  midnight: new MidnightAdapter(),
  stellar: new StellarAdapter(),
  solana: new SolanaAdapter(),
};

/**
 * Get the appropriate adapter for a given chain type
 */
export function getContractAdapter(chainType: ChainType): ContractAdapter {
  const adapter = adapters[chainType];
  if (!adapter) {
    throw new Error(`No adapter available for chain type: ${chainType}`);
  }
  return adapter;
}
