/**
 * NameResolverBridge
 *
 * Projects the active runtime's name-resolution capability into NameResolverProvider
 * so every AddressField / DynamicFormField(blockchain-address) in the subtree can
 * resolve ENS names inline. On runtimes without the capability the resolver is empty
 * and fields behave as before (hex-only validation).
 *
 * Mirrors TransactionForm + the basic-react-app NameResolverBridge pattern: pass
 * activeNetworkId / activeNetworkName so coinType chain-scope gating works.
 */
import type { ReactNode } from 'react';

import { NameResolverProvider } from '@openzeppelin/ui-components';
import { useRuntimeNameResolver, useWalletState } from '@openzeppelin/ui-react';

export function NameResolverBridge({ children }: { children: ReactNode }) {
  const resolver = useRuntimeNameResolver();
  const { activeNetworkId, activeNetworkConfig } = useWalletState();

  return (
    <NameResolverProvider
      {...resolver}
      activeNetworkId={activeNetworkId ?? null}
      activeNetworkName={activeNetworkConfig?.name}
    >
      {children}
    </NameResolverProvider>
  );
}
