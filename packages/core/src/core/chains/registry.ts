import type { ChainType } from '../types/ContractSchema';

/**
 * Interface for chain-specific data in the registry
 */
export interface ChainInfo {
  /** Display name (e.g., 'Ethereum (EVM)') */
  name: string;

  /** Detailed description of the blockchain */
  description: string;

  /** Explorer/verification platform guidance */
  explorerGuidance: string;

  /** Address format example (if applicable) */
  addressExample?: string;

  /** Icon path for the chain (if available) */
  iconPath?: string;

  /** Background color class for UI elements */
  bgColorClass?: string;

  /** Text color class for UI elements */
  textColorClass?: string;
}

/**
 * Central registry of blockchain information
 */
export const CHAIN_REGISTRY: Record<ChainType, ChainInfo> = {
  evm: {
    name: 'Ethereum (EVM)',
    description:
      'Ethereum is a decentralized, open-source blockchain with smart contract functionality. It supports the Ethereum Virtual Machine (EVM) and uses the native cryptocurrency Ether (ETH).',
    explorerGuidance: 'Etherscan verified contracts',
    addressExample: '0x...',
    bgColorClass: 'bg-blue-100',
    textColorClass: 'text-blue-900',
  },
  midnight: {
    name: 'Midnight',
    description:
      'Midnight is a data protection blockchain that enables programmable privacy. It allows developers to build applications that shield sensitive data, including wallet addresses and transaction information, while leveraging zero-knowledge proofs for selective disclosure of data.',
    explorerGuidance: 'contract IDs on Midnight Explorer',
    bgColorClass: 'bg-indigo-100',
    textColorClass: 'text-indigo-900',
  },
  stellar: {
    name: 'Stellar',
    description:
      'Stellar is a fast, energy-efficient blockchain network designed for real-world financial applications. It enables near-instant global payments at low cost, connects digital assets to traditional finance, and supports smart contracts through Soroban. Its anchor network spans over 180 countries and supports 20+ digital assets.',
    explorerGuidance: 'contract IDs on Stellar Expert',
    bgColorClass: 'bg-sky-100',
    textColorClass: 'text-sky-900',
  },
  solana: {
    name: 'Solana',
    description:
      'Solana is a high-performance blockchain supporting smart contracts. It offers fast transaction times and low fees using a Proof of History consensus mechanism.',
    explorerGuidance: 'program IDs on Solana Explorer',
    bgColorClass: 'bg-purple-100',
    textColorClass: 'text-purple-900',
  },
};

/**
 * Get the human-readable name for a chain type
 */
export function getChainName(chainType: ChainType): string {
  return CHAIN_REGISTRY[chainType]?.name || chainType;
}

/**
 * Get the description for a chain type
 */
export function getChainDescription(chainType: ChainType): string {
  return CHAIN_REGISTRY[chainType]?.description || '';
}

/**
 * Get explorer guidance text for a chain type
 */
export function getChainExplorerGuidance(chainType: ChainType): string {
  return CHAIN_REGISTRY[chainType]?.explorerGuidance || '';
}

/**
 * Get address example for a chain type (if available)
 */
export function getChainAddressExample(chainType: ChainType): string | undefined {
  return CHAIN_REGISTRY[chainType]?.addressExample;
}

/**
 * Get all available chain types
 */
export function getAvailableChains(): ChainType[] {
  return Object.keys(CHAIN_REGISTRY) as ChainType[];
}

/**
 * Get UI styling classes for a specific chain
 */
export function getChainStyling(chainType: ChainType): { bg: string; text: string } {
  const info = CHAIN_REGISTRY[chainType];
  return {
    bg: info?.bgColorClass || 'bg-gray-100',
    text: info?.textColorClass || 'text-gray-900',
  };
}
