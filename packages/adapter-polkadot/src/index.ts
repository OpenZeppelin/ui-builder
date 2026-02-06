/**
 * @openzeppelin/ui-builder-adapter-polkadot
 *
 * Polkadot adapter for the UI Builder, supporting EVM-compatible networks
 * in the Polkadot ecosystem (Polkadot Hub, Kusama Hub, Moonbeam, Moonriver).
 *
 * @packageDocumentation
 */

// ============================================================================
// ADAPTER CLASS
// ============================================================================

export { PolkadotAdapter } from './adapter';

// ============================================================================
// TYPES
// ============================================================================

export type {
  PolkadotExecutionType,
  PolkadotNetworkCategory,
  PolkadotRelayChain,
  TypedPolkadotNetworkConfig,
} from './types';

// ============================================================================
// NETWORK CONFIGURATIONS
// ============================================================================

// Network arrays (following EVM adapter pattern)
export { polkadotNetworks, polkadotMainnetNetworks, polkadotTestnetNetworks } from './networks';

// Individual Hub networks (P1 - MVP)
export { kusamaHubMainnet, polkadotHubMainnet, polkadotHubTestnet } from './networks';

// Individual Parachain networks (P2)
export { moonbeamMainnet, moonriverMainnet, moonbaseAlphaTestnet } from './networks';

// ============================================================================
// VIEM CHAIN DEFINITIONS
// ============================================================================

// Custom Hub chain definitions
export { kusamaHub, polkadotHub, polkadotHubTestNet } from './networks/chains';

// Parachain viem chains (re-exported from viem/chains)
export { moonbeam, moonriver, moonbaseAlpha } from './networks';

// ============================================================================
// WALLET COMPONENTS
// ============================================================================

export { PolkadotWalletUiRoot, polkadotChains, type PolkadotWalletUiRootProps } from './wallet';

// ============================================================================
// ADAPTER CONFIGURATION
// ============================================================================

export { polkadotAdapterConfig } from './config';
