import type { Ecosystem } from '@openzeppelin/contracts-ui-builder-types';

/**
 * Configuration for ecosystem feature flags
 */
export interface EcosystemFeatureConfig {
  /** Whether the ecosystem is enabled and functional */
  enabled: boolean;
  /** Whether to show the ecosystem in the UI (even if disabled) */
  showInUI: boolean;
  /** Label to display when the ecosystem is disabled */
  disabledLabel?: string;
  /** Description to show when the ecosystem is disabled */
  disabledDescription?: string;
}

/**
 * Interface for ecosystem-specific data in the registry
 */
export interface EcosystemInfo {
  /** Display name (e.g., 'Ethereum (EVM)') */
  name: string;

  /** Detailed description of the blockchain */
  description: string;

  /** Explorer/verification platform guidance */
  explorerGuidance: string;

  /** Address format example (if applicable) */
  addressExample?: string;

  /** Icon path for the ecosystem (if available) */
  iconPath?: string;

  /** Network icon name for @web3icons/react NetworkIcon component */
  networkIconName?: string;

  /** Background color class for UI elements */
  bgColorClass?: string;

  /** Text color class for UI elements */
  textColorClass?: string;

  /** Default feature flag configuration */
  defaultFeatureConfig: EcosystemFeatureConfig;
}

/**
 * Ordered list of ecosystems for consistent display across the application
 * This defines the order in which ecosystems appear in the UI
 */
export const ECOSYSTEM_ORDER: Ecosystem[] = ['evm', 'midnight', 'stellar', 'solana'] as const;

/**
 * Central registry of blockchain ecosystem information
 */
export const ECOSYSTEM_REGISTRY: Record<Ecosystem, EcosystemInfo> = {
  evm: {
    name: 'Ethereum (EVM)',
    description:
      'Ethereum is a decentralized, open-source blockchain with smart contract functionality. It supports the Ethereum Virtual Machine (EVM) and uses the native cryptocurrency Ether (ETH).',
    explorerGuidance: 'Etherscan verified contracts',
    addressExample: '0x...',
    networkIconName: 'ethereum',
    bgColorClass: 'bg-blue-100',
    textColorClass: 'text-blue-900',
    defaultFeatureConfig: {
      enabled: true,
      showInUI: true,
    },
  },
  midnight: {
    name: 'Midnight',
    description:
      'Midnight is a data protection blockchain that enables programmable privacy. It allows developers to build applications that shield sensitive data, including wallet addresses and transaction information, while leveraging zero-knowledge proofs for selective disclosure of data.',
    explorerGuidance: 'contract IDs on Midnight Explorer',
    bgColorClass: 'bg-indigo-100',
    textColorClass: 'text-indigo-900',
    // Note: midnight uses a custom SVG, so no networkIconName
    defaultFeatureConfig: {
      enabled: false,
      showInUI: true,
      disabledLabel: 'Coming Soon',
    },
  },
  stellar: {
    name: 'Stellar',
    description:
      'Stellar is a fast, energy-efficient blockchain network designed for real-world financial applications. It enables near-instant global payments at low cost, connects digital assets to traditional finance, and supports smart contracts through Soroban. Its anchor network spans over 180 countries and supports 20+ digital assets.',
    explorerGuidance: 'contract IDs on Stellar Expert',
    networkIconName: 'stellar',
    bgColorClass: 'bg-sky-100',
    textColorClass: 'text-sky-900',
    defaultFeatureConfig: {
      enabled: true,
      showInUI: true,
    },
  },
  solana: {
    name: 'Solana',
    description:
      'Solana is a high-performance blockchain supporting smart contracts. It offers fast transaction times and low fees using a Proof of History consensus mechanism.',
    explorerGuidance: 'program IDs on Solana Explorer',
    networkIconName: 'solana',
    bgColorClass: 'bg-purple-100',
    textColorClass: 'text-purple-900',
    defaultFeatureConfig: {
      enabled: false,
      showInUI: false,
      disabledLabel: 'Coming Soon',
    },
  },
};

/**
 * Get the human-readable name for an ecosystem
 */
export function getEcosystemName(ecosystem: Ecosystem): string {
  return ECOSYSTEM_REGISTRY[ecosystem]?.name || ecosystem;
}

/**
 * Get the description for an ecosystem
 */
export function getEcosystemDescription(ecosystem: Ecosystem): string {
  return ECOSYSTEM_REGISTRY[ecosystem]?.description || '';
}

/**
 * Get explorer guidance text for an ecosystem
 */
export function getEcosystemExplorerGuidance(ecosystem: Ecosystem): string {
  return ECOSYSTEM_REGISTRY[ecosystem]?.explorerGuidance || '';
}

/**
 * Get address example for an ecosystem (if available)
 */
export function getEcosystemAddressExample(ecosystem: Ecosystem): string | undefined {
  return ECOSYSTEM_REGISTRY[ecosystem]?.addressExample;
}

/**
 * Get the network icon name for an ecosystem (for @web3icons/react)
 */
export function getEcosystemNetworkIconName(ecosystem: Ecosystem): string | undefined {
  return ECOSYSTEM_REGISTRY[ecosystem]?.networkIconName;
}

/**
 * Get the default feature configuration for an ecosystem
 */
export function getEcosystemDefaultFeatureConfig(ecosystem: Ecosystem): EcosystemFeatureConfig {
  return (
    ECOSYSTEM_REGISTRY[ecosystem]?.defaultFeatureConfig || {
      enabled: false,
      showInUI: true,
    }
  );
}

/**
 * Get all available ecosystems in their defined order
 */
export function getAvailableEcosystems(): Ecosystem[] {
  return [...ECOSYSTEM_ORDER];
}

/**
 * Get UI styling classes for a specific ecosystem
 */
export function getEcosystemStyling(ecosystem: Ecosystem): { bg: string; text: string } {
  const info = ECOSYSTEM_REGISTRY[ecosystem];
  return {
    bg: info?.bgColorClass || 'bg-gray-100',
    text: info?.textColorClass || 'text-gray-900',
  };
}
