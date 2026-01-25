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

// ============================================================================
// VIEM CHAIN DEFINITIONS
// ============================================================================

export { polkadotHub, kusamaHub, polkadotHubTestNet } from './networks/chains';

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
