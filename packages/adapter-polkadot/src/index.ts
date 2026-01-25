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

// Network exports will be added in Phase 3 (User Story 1) and Phase 4 (User Story 2)
// export { polkadotHubMainnet, kusamaHubMainnet, ... } from './networks';
// export { polkadotHubTestnet, moonbaseAlphaTestnet, ... } from './networks';
// export { mainnetNetworks, testnetNetworks, networks } from './networks';

// ============================================================================
// VIEM CHAIN DEFINITIONS
// ============================================================================

// Chain exports will be added in Phase 3 (User Story 1)
// export { polkadotHub, kusamaHub, polkadotHubTestNet } from './networks/chains';

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
