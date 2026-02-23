/**
 * AliasLabelBridge
 *
 * Bridges alias storage and the AddressLabelProvider + AddressSuggestionProvider
 * from ui-components. Reads the current network from WalletState and creates
 * reactive resolvers backed by the app's Dexie database.
 *
 * - All `AddressDisplay` instances in the subtree automatically resolve aliases.
 * - All `AddressField` instances in the subtree automatically show alias suggestions.
 * - Clicking the pencil icon on any AddressDisplay opens the AliasEditPopover.
 */
import { useCallback } from 'react';
import type { ReactNode } from 'react';

import { AddressLabelProvider, AddressSuggestionProvider } from '@openzeppelin/ui-components';
import { useWalletState } from '@openzeppelin/ui-react';
import { AliasEditPopover, useAliasEditState } from '@openzeppelin/ui-renderer';
import {
  useAliasEditCallbacks,
  useAliasLabelResolver,
  useAliasSuggestionResolver,
} from '@openzeppelin/ui-storage';

import { db } from '../storage/database';

export function AliasLabelBridge({ children }: { children: ReactNode }) {
  const { activeNetworkConfig } = useWalletState();

  const labelResolver = useAliasLabelResolver(db, {
    networkId: activeNetworkConfig?.id,
  });

  const suggestionResolver = useAliasSuggestionResolver(db);
  const editCallbacks = useAliasEditCallbacks(db);

  const { editing, onEditLabel, handleClose, lastClickRef } = useAliasEditState(
    activeNetworkConfig?.id
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      lastClickRef.current = { x: e.clientX, y: e.clientY };
    },
    [lastClickRef]
  );

  return (
    <div onPointerDown={handlePointerDown}>
      <AddressLabelProvider resolveLabel={labelResolver.resolveLabel} onEditLabel={onEditLabel}>
        <AddressSuggestionProvider resolveSuggestions={suggestionResolver.resolveSuggestions}>
          {children}
        </AddressSuggestionProvider>
      </AddressLabelProvider>

      {editing && (
        <AliasEditPopover
          address={editing.address}
          networkId={editing.networkId}
          anchorRect={editing.anchorRect}
          onClose={handleClose}
          {...editCallbacks}
        />
      )}
    </div>
  );
}
