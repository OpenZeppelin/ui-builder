/**
 * @fileoverview Polkadot ecosystem chain constants for wallet configuration.
 */

import type { Chain } from 'viem';

import { moonbaseAlpha, moonbeam, moonriver } from '../networks';
import { kusamaHub, polkadotHub, polkadotHubTestNet } from '../networks/chains';

/**
 * All Polkadot ecosystem chains for wagmi configuration.
 *
 * Includes Hub networks (P1) followed by parachain networks (P2):
 * - Hub: Polkadot Hub, Kusama Hub, Polkadot Hub TestNet
 * - Parachains: Moonbeam, Moonriver, Moonbase Alpha
 */
export const polkadotChains: readonly [Chain, ...Chain[]] = [
  polkadotHub,
  kusamaHub,
  polkadotHubTestNet,
  moonbeam,
  moonriver,
  moonbaseAlpha,
];
