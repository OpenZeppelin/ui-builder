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

// Hub networks (P1 - MVP)
export {
  polkadotHubMainnet,
  kusamaHubMainnet,
  polkadotHubTestnet,
  mainnetNetworks,
  testnetNetworks,
  networks,
} from './networks';

// Parachain networks (P2)
export { moonbeamMainnet, moonriverMainnet, moonbaseAlphaTestnet } from './networks';

// ============================================================================
// VIEM CHAIN DEFINITIONS
// ============================================================================

// Custom Hub chain definitions
export { polkadotHub, kusamaHub, polkadotHubTestNet } from './networks/chains';

// Parachain viem chains (re-exported from viem/chains)
export { moonbeam, moonriver, moonbaseAlpha } from './networks';

// ============================================================================
// WALLET COMPONENTS
// ============================================================================

// Wallet exports will be added in Phase 5 (User Story 3)
// export { PolkadotWalletUiRoot, ConnectButton, AccountDisplay, NetworkSwitcher } from './wallet';

// ============================================================================
// ECOSYSTEM REGISTRATION
// ============================================================================

// Ecosystem registration will be added in Phase 6 (User Story 4)
// export { registerPolkadotEcosystem } from './ecosystem';

// ============================================================================
// UTILITIES
// ============================================================================

// Utility exports will be added in Phase 8 (Utilities & Polish)
// export { getNetworksByCategory, getNetworksByRelayChain, isHubNetwork, isParachainNetwork } from './utils';
