/**
 * @fileoverview Polkadot ecosystem chain constants for wallet configuration.
 */

import type { Chain } from 'viem';

import { moonbaseAlpha, moonbeam, moonriver } from '../networks';
// NOTE: kusamaHub temporarily disabled - RPC DNS not resolving
import { polkadotHub, polkadotHubTestNet } from '../networks/chains';

/**
 * All Polkadot ecosystem chains for wagmi configuration.
 *
 * Includes Hub networks (P1) followed by parachain networks (P2):
 * - Hub: Polkadot Hub, Polkadot Hub TestNet (Kusama Hub temporarily disabled)
 * - Parachains: Moonbeam, Moonriver, Moonbase Alpha
 */
export const polkadotChains: readonly [Chain, ...Chain[]] = [
  polkadotHub,
  // kusamaHub, // Temporarily disabled - RPC DNS not resolving
  polkadotHubTestNet,
  moonbeam,
  moonriver,
  moonbaseAlpha,
];
