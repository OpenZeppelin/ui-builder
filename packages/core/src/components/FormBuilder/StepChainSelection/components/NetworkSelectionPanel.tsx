import { Search, Settings } from 'lucide-react';

import { useEffect, useState } from 'react';

import { useWalletState } from '@openzeppelin/transaction-form-react-core';
import { Ecosystem, NetworkConfig } from '@openzeppelin/transaction-form-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ExplorerSettingsPanel,
  Input,
  RpcSettingsPanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@openzeppelin/transaction-form-ui';

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
  const [rpcSettingsNetwork, setRpcSettingsNetwork] = useState<NetworkConfig | null>(null);
  const { activeAdapter } = useWalletState();

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

  const handleOpenRpcSettings = (network: NetworkConfig, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent network selection
    setRpcSettingsNetwork(network);
  };

  const handleCloseRpcSettings = () => {
    setRpcSettingsNetwork(null);
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
              onOpenRpcSettings={handleOpenRpcSettings}
            />
          )}

          {testnetNetworks.length > 0 && (
            <NetworkGroup
              title="Testnet Networks"
              networks={testnetNetworks}
              onNetworkSelected={onNetworkSelected}
              selectedNetworkId={selectedNetworkId}
              onOpenRpcSettings={handleOpenRpcSettings}
            />
          )}

          {devnetNetworks.length > 0 && (
            <NetworkGroup
              title="Devnet Networks"
              networks={devnetNetworks}
              onNetworkSelected={onNetworkSelected}
              selectedNetworkId={selectedNetworkId}
              onOpenRpcSettings={handleOpenRpcSettings}
            />
          )}
        </div>
      )}

      {/* RPC Settings Dialog */}
      <Dialog
        open={!!rpcSettingsNetwork}
        onOpenChange={(open) => !open && handleCloseRpcSettings()}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Network Settings</DialogTitle>
            <DialogDescription>Configure settings for {rpcSettingsNetwork?.name}</DialogDescription>
          </DialogHeader>
          {rpcSettingsNetwork && activeAdapter && (
            <Tabs defaultValue="rpc" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rpc">RPC Provider</TabsTrigger>
                <TabsTrigger value="explorer">Explorer</TabsTrigger>
              </TabsList>
              <TabsContent value="rpc">
                <RpcSettingsPanel
                  adapter={activeAdapter}
                  networkId={rpcSettingsNetwork.id}
                  onSettingsChanged={() => {
                    handleCloseRpcSettings();
                    // Components will automatically refresh via the RPC change event system
                  }}
                />
              </TabsContent>
              <TabsContent value="explorer">
                <ExplorerSettingsPanel
                  adapter={activeAdapter}
                  networkId={rpcSettingsNetwork.id}
                  onSettingsChanged={() => {
                    handleCloseRpcSettings();
                    // Components will automatically refresh via the RPC change event system
                  }}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface NetworkGroupProps {
  title: string;
  networks: NetworkConfig[];
  onNetworkSelected: (networkConfigId: string) => void;
  selectedNetworkId?: string | null;
  onOpenRpcSettings: (network: NetworkConfig, event: React.MouseEvent) => void;
}

function NetworkGroup({
  title,
  networks,
  onNetworkSelected,
  selectedNetworkId,
  onOpenRpcSettings,
}: NetworkGroupProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">{title}</h4>
      {/* Horizontally scrollable container for many networks */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-w-max">
          {networks.map((network) => (
            <div key={network.id} className="relative group">
              <NetworkMiniTile
                network={network}
                isSelected={network.id === selectedNetworkId}
                onSelect={() => onNetworkSelected(network.id)}
              />
              {/* RPC Settings button - positioned inside the card bounds */}
              <button
                type="button"
                onClick={(e) => onOpenRpcSettings(network, e)}
                className="absolute top-2 right-2 p-1 rounded bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent/80"
                title="Configure RPC settings"
              >
                <Settings size={14} className="text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
