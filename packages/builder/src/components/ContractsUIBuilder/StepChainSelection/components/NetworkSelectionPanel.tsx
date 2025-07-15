import { Search, Settings } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';
import { Ecosystem, NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import {
  Input,
  NetworkSettingsDialog,
  useNetworkErrors,
} from '@openzeppelin/contracts-ui-builder-ui';

import { getEcosystemName } from '../../../../core/ecosystems/registry';
import { networkService } from '../../../../core/networks/service';

import { NetworkMiniTile } from './NetworkMiniTile';

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
  const [defaultTab, setDefaultTab] = useState<'rpc' | 'explorer'>('rpc');
  const { activeAdapter } = useWalletState();
  const { setOpenNetworkSettingsHandler } = useNetworkErrors();

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
        adapter={activeAdapter}
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
      {/* Flex container with natural card widths */}
      <div className="flex flex-wrap gap-3">
        {networks.map((network) => (
          <div key={network.id} className="relative group">
            <NetworkMiniTile
              network={network}
              isSelected={network.id === selectedNetworkId}
              onSelect={() => onNetworkSelected(network.id)}
            />
            {/* Settings button - positioned slightly outside top-right corner */}
            <button
              type="button"
              onClick={(e) => onOpenNetworkSettings(network, e)}
              className="absolute -top-2 -right-2 p-1.5 rounded-md bg-background/95 backdrop-blur-sm 
                         opacity-0 group-hover:opacity-100 transition-all duration-200 
                         hover:bg-muted border border-border
                         shadow-md z-10"
              title="Configure network settings"
            >
              <Settings size={14} className="text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
