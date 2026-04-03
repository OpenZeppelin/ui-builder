import { toast } from 'sonner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@openzeppelin/ui-components';
import { AddressBookWidget } from '@openzeppelin/ui-renderer';
import { useAddressBookWidgetProps } from '@openzeppelin/ui-storage';
import type { NetworkConfig } from '@openzeppelin/ui-types';

import { getEcosystemMetadata, getRuntime } from '../../core/ecosystemManager';
import { useAllNetworks } from '../../hooks/useAllNetworks';
import { useBuilderAnalytics } from '../../hooks/useBuilderAnalytics';
import { useBuilderWalletState } from '../../hooks/useBuilderWalletState';
import { db } from '../../storage/database';

const ECOSYSTEM_ADDRESS_PATH: Record<string, string> = {
  evm: 'address',
  polkadot: 'address',
  stellar: 'account',
};

interface AddressBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddressBookDialog({ open, onOpenChange }: AddressBookDialogProps) {
  const { activeRuntime, activeNetworkConfig } = useBuilderWalletState();
  const { networks } = useAllNetworks();
  const [filterNetworkIds, setFilterNetworkIds] = useState<string[]>([]);
  const { trackAddressBookOpened } = useBuilderAnalytics();
  const wasAddressBookOpenRef = useRef(false);

  useEffect(() => {
    const wasOpen = wasAddressBookOpenRef.current;
    wasAddressBookOpenRef.current = open;

    if (!open || wasOpen) {
      return;
    }

    const networkId = activeNetworkConfig?.id ?? activeRuntime?.networkConfig.id ?? 'unknown';
    const ecosystem =
      activeRuntime?.networkConfig.ecosystem ?? activeNetworkConfig?.ecosystem ?? 'unknown';
    trackAddressBookOpened(networkId, ecosystem);
  }, [open, activeNetworkConfig, activeRuntime, trackAddressBookOpened]);

  const widgetProps = useAddressBookWidgetProps(db, {
    networkId: activeNetworkConfig?.id,
    filterNetworkIds,
    onError: (title, err) => toast.error(`${title}: ${err instanceof Error ? err.message : err}`),
  });

  const resolveNetwork = useCallback(
    (networkId: string) => networks.find((n) => n.id === networkId),
    [networks]
  );

  const resolveExplorerUrl = useCallback(
    (address: string, networkId?: string) => {
      if (!networkId) return undefined;

      if (activeRuntime && activeNetworkConfig?.id === networkId) {
        return activeRuntime.explorer.getExplorerUrl(address) ?? undefined;
      }

      const net = networks.find((n) => n.id === networkId);
      if (!net?.explorerUrl) return undefined;
      const segment = ECOSYSTEM_ADDRESS_PATH[net.ecosystem] ?? 'address';
      try {
        const url = new URL(net.explorerUrl);
        const basePath = url.pathname.replace(/\/+$/, '');
        url.pathname = `${basePath}/${segment}/${address}`;
        return url.toString();
      } catch {
        const baseUrl = net.explorerUrl.replace(/\/+$/, '');
        return `${baseUrl}/${segment}/${address}`;
      }
    },
    [activeRuntime, networks, activeNetworkConfig]
  );

  const addressPlaceholder = useMemo(
    () =>
      activeRuntime
        ? (getEcosystemMetadata(activeRuntime.networkConfig.ecosystem)?.addressExample ?? '0x...')
        : '0x...',
    [activeRuntime]
  );

  const resolveAddressing = useCallback(
    async (network: NetworkConfig) => (await getRuntime(network)).addressing,
    []
  );

  const resolveAddressPlaceholder = useCallback(
    (network: NetworkConfig) => getEcosystemMetadata(network.ecosystem)?.addressExample ?? '0x...',
    []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Address Book</DialogTitle>
          <DialogDescription>
            Manage address aliases across all networks. Aliases are stored locally and appear
            automatically wherever addresses are displayed.
          </DialogDescription>
        </DialogHeader>
        <AddressBookWidget
          {...widgetProps}
          title="Saved Addresses"
          resolveNetwork={resolveNetwork}
          resolveExplorerUrl={resolveExplorerUrl}
          addressing={activeRuntime?.addressing}
          resolveAddressing={resolveAddressing}
          addressPlaceholder={addressPlaceholder}
          resolveAddressPlaceholder={resolveAddressPlaceholder}
          networks={networks}
          currentNetworkId={activeNetworkConfig?.id}
          filterNetworkIds={filterNetworkIds}
          onFilterNetworkIdsChange={setFilterNetworkIds}
        />
      </DialogContent>
    </Dialog>
  );
}
