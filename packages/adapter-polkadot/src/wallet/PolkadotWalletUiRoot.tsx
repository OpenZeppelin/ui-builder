/**
 * @fileoverview Polkadot-specific WalletUiRoot component.
 *
 * Provides wallet connectivity for Polkadot ecosystem EVM-compatible networks
 * including Hub networks and parachains (Moonbeam, Moonriver).
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Chain } from 'viem';
import { createConfig, http, WagmiProvider } from 'wagmi';
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';

import { polkadotChains } from './chains';

/**
 * Props for the PolkadotWalletUiRoot component.
 */
export interface PolkadotWalletUiRootProps {
  /** Child components to render within the wallet context */
  children: ReactNode;
  /** Optional override for chains to configure (defaults to all Polkadot ecosystem chains) */
  chains?: readonly [Chain, ...Chain[]];
}

// Create a stable QueryClient for react-query
const queryClient = new QueryClient();

/**
 * Polkadot ecosystem wallet UI root component.
 *
 * This component provides wallet connectivity for Polkadot ecosystem
 * EVM-compatible networks. It wraps children with WagmiProvider and
 * QueryClientProvider configured for Polkadot Hub and parachain networks.
 *
 * @example
 * ```tsx
 * import { PolkadotWalletUiRoot } from '@openzeppelin/ui-builder-adapter-polkadot';
 *
 * function App() {
 *   return (
 *     <PolkadotWalletUiRoot>
 *       <YourAppContent />
 *     </PolkadotWalletUiRoot>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using with specific chains only
 * import { PolkadotWalletUiRoot, polkadotHub, moonbeam } from '@openzeppelin/ui-builder-adapter-polkadot';
 *
 * function App() {
 *   return (
 *     <PolkadotWalletUiRoot chains={[polkadotHub, moonbeam]}>
 *       <YourAppContent />
 *     </PolkadotWalletUiRoot>
 *   );
 * }
 * ```
 *
 * @remarks
 * The component pre-configures all Polkadot ecosystem EVM networks by default:
 * - Hub networks: Polkadot Hub, Kusama Hub, Polkadot Hub TestNet
 * - Parachains: Moonbeam, Moonriver, Moonbase Alpha
 *
 * For production apps, you should integrate with RainbowKit or another
 * wallet UI library. This component provides the base wagmi/react-query
 * providers that those libraries require.
 */
export const PolkadotWalletUiRoot: React.FC<PolkadotWalletUiRootProps> = ({
  children,
  chains = polkadotChains,
}) => {
  // Create wagmi config with Polkadot ecosystem chains
  const wagmiConfig = useMemo(() => {
    const transports = Object.fromEntries(chains.map((chain) => [chain.id, http()]));

    return createConfig({
      chains,
      transports,
    });
  }, [chains]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};
