/**
 * @fileoverview Wallet module exports for Polkadot adapter.
 *
 * Provides the PolkadotWalletUiRoot component for wallet connectivity
 * in Polkadot ecosystem applications.
 *
 * @remarks
 * This module provides a self-contained wallet provider for Polkadot ecosystem
 * EVM-compatible networks. For advanced wallet UI components (connect buttons,
 * account displays, etc.), integrate with RainbowKit or another wallet UI library.
 */

// ============================================================================
// CHAIN CONSTANTS
// ============================================================================

export { polkadotChains } from './chains';

// ============================================================================
// POLKADOT-SPECIFIC COMPONENTS
// ============================================================================

export { PolkadotWalletUiRoot, type PolkadotWalletUiRootProps } from './PolkadotWalletUiRoot';
