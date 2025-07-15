import { Search } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { useAdapterContext } from '@openzeppelin/contracts-ui-builder-react-core';
import {
  ContractAdapter,
  Ecosystem,
  NetworkConfig,
} from '@openzeppelin/contracts-ui-builder-types';
import {
  Input,
  NetworkSettingsDialog,
  useNetworkErrors,
} from '@openzeppelin/contracts-ui-builder-ui';

import { getEcosystemName } from '../../../../core/ecosystems/registry';
import { networkService } from '../../../../core/networks/service';

import { NetworkRow } from './NetworkRow';

interface NetworkSelectionPanelProps {
  ecosystem: Ecosystem;
  onNetworkSelected: (networkConfigId: string) => void;
  selectedNetworkId?: string | null;
}

export function NetworkSelectionPanel({
  ecosystem,
  onNetworkSelected,
  selectedNetworkId,
}: NetworkSelectionPanelProps) {
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsNetwork, setSettingsNetwork] = useState<NetworkConfig | null>(null);
  const [settingsAdapter, setSettingsAdapter] = useState<ContractAdapter | null>(null);
  const [defaultTab, setDefaultTab] = useState<'rpc' | 'explorer'>('rpc');
  const { getAdapterForNetwork } = useAdapterContext();
  const { setOpenNetworkSettingsHandler } = useNetworkErrors();

  // Get adapter for the settings network
  useEffect(() => {
    if (!settingsNetwork) {
      setSettingsAdapter(null);
      return;
    }

    const { adapter } = getAdapterForNetwork(settingsNetwork);
    setSettingsAdapter(adapter);
  }, [settingsNetwork, getAdapterForNetwork]);

  // Create a stable callback for opening network settings
  const openNetworkSettings = useCallback(
    async (networkId: string, tab: 'rpc' | 'explorer' = 'rpc') => {
      try {
        // Find the network by ID
        const allNetworks = await networkService.getNetworksByEcosystem(ecosystem);
        const network = allNetworks.find((n) => n.id === networkId);

        if (network) {
          setSettingsNetwork(network);
          setDefaultTab(tab);
          // The useEffect will handle getting the adapter
        }
      } catch (error) {
        console.error('Failed to open network settings:', error);
      }
    },
    [ecosystem]
  );

  // Register handler for opening network settings from error notifications
  useEffect(() => {
    setOpenNetworkSettingsHandler((networkId: string, defaultTab?: 'rpc' | 'explorer') => {
      void openNetworkSettings(networkId, defaultTab);
    });
  }, [openNetworkSettings, setOpenNetworkSettingsHandler]);

  // Fetch networks for the selected ecosystem
  useEffect(() => {
    async function loadNetworks() {
      setIsLoading(true);
      try {
        const ecosystemNetworks = await networkService.getNetworksByEcosystem(ecosystem);
        setNetworks(ecosystemNetworks);
      } catch (error) {
        console.error(`Failed to load networks for ${ecosystem}:`, error);
        setNetworks([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadNetworks();
  }, [ecosystem]);

  // Filter networks based on search query
  const filteredNetworks = networks.filter(
    (network) =>
      network.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      network.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ('chainId' in network && network.chainId?.toString().includes(searchQuery))
  );

  // Group networks by type (mainnet/testnet/devnet)
  const mainnetNetworks = filteredNetworks.filter((n) => n.type === 'mainnet');
  const testnetNetworks = filteredNetworks.filter((n) => n.type === 'testnet');
  const devnetNetworks = filteredNetworks.filter((n) => n.type === 'devnet');

  const handleOpenNetworkSettings = (network: NetworkConfig, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent network selection
    setSettingsNetwork(network);
  };

  const handleCloseNetworkSettings = () => {
    setSettingsNetwork(null);
    setSettingsAdapter(null);
  };

  return (
    <div className="space-y-4">
      {/* Search filter */}
      <div className="relative">
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search size={16} />
        </div>
        <Input
          type="text"
          placeholder="Search networks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading available networks...</div>
      ) : filteredNetworks.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          {searchQuery
            ? `No networks found matching "${searchQuery}"`
            : `No networks found for ${getEcosystemName(ecosystem)}.`}
        </div>
      ) : (
        <div className="space-y-4">
          {mainnetNetworks.length > 0 && (
            <NetworkGroup
              title="Mainnet Networks"
              networks={mainnetNetworks}
              onNetworkSelected={onNetworkSelected}
              selectedNetworkId={selectedNetworkId}
              onOpenNetworkSettings={handleOpenNetworkSettings}
            />
          )}

          {testnetNetworks.length > 0 && (
            <NetworkGroup
              title="Testnet Networks"
              networks={testnetNetworks}
              onNetworkSelected={onNetworkSelected}
              selectedNetworkId={selectedNetworkId}
              onOpenNetworkSettings={handleOpenNetworkSettings}
            />
          )}

          {devnetNetworks.length > 0 && (
            <NetworkGroup
              title="Devnet Networks"
              networks={devnetNetworks}
              onNetworkSelected={onNetworkSelected}
              selectedNetworkId={selectedNetworkId}
              onOpenNetworkSettings={handleOpenNetworkSettings}
            />
          )}
        </div>
      )}

      {/* Network Settings Dialog */}
      <NetworkSettingsDialog
        isOpen={!!settingsNetwork}
        onOpenChange={(open: boolean) => !open && handleCloseNetworkSettings()}
        networkConfig={settingsNetwork}
        adapter={settingsAdapter}
        defaultTab={defaultTab}
      />
    </div>
  );
}

interface NetworkGroupProps {
  title: string;
  networks: NetworkConfig[];
  onNetworkSelected: (networkConfigId: string) => void;
  selectedNetworkId?: string | null;
  onOpenNetworkSettings: (network: NetworkConfig, event: React.MouseEvent) => void;
}

function NetworkGroup({
  title,
  networks,
  onNetworkSelected,
  selectedNetworkId,
  onOpenNetworkSettings,
}: NetworkGroupProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">{title}</h4>
      {/* Vertical stack container for row-based layout */}
      <div className="space-y-2">
        {networks.map((network) => (
          <div key={network.id} className="relative">
            <NetworkRow
              network={network}
              isSelected={network.id === selectedNetworkId}
              onSelect={() => onNetworkSelected(network.id)}
              onOpenSettings={(e) => onOpenNetworkSettings(network, e)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
