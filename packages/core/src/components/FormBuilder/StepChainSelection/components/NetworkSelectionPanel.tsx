import { Search } from 'lucide-react';

import { useEffect, useState } from 'react';

import { Input } from '@openzeppelin/transaction-form-renderer';
import { Ecosystem, NetworkConfig } from '@openzeppelin/transaction-form-types';

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

  // Group networks by type (mainnet/testnet)
  const mainnetNetworks = filteredNetworks.filter((n) => n.type === 'mainnet');
  const testnetNetworks = filteredNetworks.filter((n) => n.type === 'testnet');

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
            />
          )}

          {testnetNetworks.length > 0 && (
            <NetworkGroup
              title="Testnet Networks"
              networks={testnetNetworks}
              onNetworkSelected={onNetworkSelected}
              selectedNetworkId={selectedNetworkId}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface NetworkGroupProps {
  title: string;
  networks: NetworkConfig[];
  onNetworkSelected: (networkConfigId: string) => void;
  selectedNetworkId?: string | null;
}

function NetworkGroup({
  title,
  networks,
  onNetworkSelected,
  selectedNetworkId,
}: NetworkGroupProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">{title}</h4>
      {/* Horizontally scrollable container for many networks */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-w-max">
          {networks.map((network) => (
            <NetworkMiniTile
              key={network.id}
              network={network}
              isSelected={network.id === selectedNetworkId}
              onSelect={() => onNetworkSelected(network.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
