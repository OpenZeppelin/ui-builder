/**
 * EVM-specific type definitions
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
