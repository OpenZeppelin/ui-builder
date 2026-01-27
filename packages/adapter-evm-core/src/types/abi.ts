import type { Abi } from 'viem';

/**
 * EVM-specific ABI type definitions
 */

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
 * Defines the structure for parameters required to execute a contract write operation via viem.
 */
export interface WriteContractParameters {
  address: `0x${string}`; // Ensure address is a valid hex string type
  abi: Abi;
  functionName: string;
  args: unknown[];
  value?: bigint;
}
