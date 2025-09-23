import type { Abi, Chain } from 'viem';

import type { EvmNetworkConfig } from '@openzeppelin/ui-builder-types';

/**
 * EVM-specific type definitions
 */

/**
 * EVM-specific network configuration with properly typed viem chain
 * This extends the base EvmNetworkConfig with the correct Chain type from viem
 */
export interface TypedEvmNetworkConfig extends EvmNetworkConfig {
  /**
   * Viem Chain object for this EVM network.
   * If provided, this will be used directly by Viem clients.
   * If not provided, a fallback chain object will be created.
   */
  viemChain?: Chain;
}

/**
 * Represents an item in an Ethereum ABI
 */
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

/**
 * EVM-specific parameter types
 */
export enum EVMParameterType {
  ADDRESS = 'address',
  UINT256 = 'uint256',
  UINT8 = 'uint8',
  BOOL = 'bool',
  BYTES = 'bytes',
  BYTES32 = 'bytes32',
  STRING = 'string',
}

/**
 * EVM-specific chain types
 */
export enum EVMChainType {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  BSC = 'bsc',
  AVALANCHE = 'avalanche',
}
// Import Viem's Abi type

/**
 * Defines the structure for parameters required to execute a contract write operation via viem.
 */
export interface WriteContractParameters {
  address: `0x${string}`; // Ensure address is a valid hex string type
  abi: Abi;
  functionName: string;
  args: unknown[];
  value?: bigint;
  // Add other potential viem parameters if needed (e.g., gas)
}

// Add other adapter-specific internal types here if necessary
