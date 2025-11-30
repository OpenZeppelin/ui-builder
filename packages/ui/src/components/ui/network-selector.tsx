import { Check, ChevronDown, Search } from 'lucide-react';
import * as React from 'react';

import type { NetworkType } from '@openzeppelin/ui-builder-types';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from '.';

export interface NetworkSelectorProps<T> {
  networks: T[];
  selectedNetwork: T | null;
  onSelectNetwork: (network: T) => void;
  getNetworkLabel: (network: T) => string;
  getNetworkIcon?: (network: T) => React.ReactNode;
  getNetworkType?: (network: T) => NetworkType | undefined;
  getNetworkId: (network: T) => string;
  groupByEcosystem?: boolean;
  getEcosystem?: (network: T) => string;
  filterNetwork?: (network: T, query: string) => boolean;
  className?: string;
  placeholder?: string;
}

export function NetworkSelector<T>({
  networks,
  selectedNetwork,
  onSelectNetwork,
  getNetworkLabel,
  getNetworkIcon,
  getNetworkType,
  getNetworkId,
  groupByEcosystem = false,
  getEcosystem,
  filterNetwork,
  className,
  placeholder = 'Select Network',
}: NetworkSelectorProps<T>): React.ReactNode {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredNetworks = React.useMemo(() => {
    if (!searchQuery) return networks;
    if (filterNetwork) return networks.filter((n) => filterNetwork(n, searchQuery));
    return networks.filter((n) =>
      getNetworkLabel(n).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [networks, searchQuery, filterNetwork, getNetworkLabel]);

  const groupedNetworks = React.useMemo(() => {
    if (!groupByEcosystem || !getEcosystem) {
      return { All: filteredNetworks };
    }
    return filteredNetworks.reduce(
      (acc, network) => {
        const ecosystem = getEcosystem(network);
        if (!acc[ecosystem]) {
          acc[ecosystem] = [];
        }
        acc[ecosystem].push(network);
        return acc;
      },
      {} as Record<string, T[]>
    );
  }, [filteredNetworks, groupByEcosystem, getEcosystem]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between ${className}`}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedNetwork ? (
              <>
                {getNetworkIcon?.(selectedNetwork)}
                <span className="truncate">{getNetworkLabel(selectedNetwork)}</span>
                {getNetworkType && (
                  <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    {getNetworkType(selectedNetwork)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-[240px] p-0"
        align="start"
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search network..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') {
                e.stopPropagation();
              }
            }}
            className="h-9 w-full border-0 bg-transparent p-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {Object.entries(groupedNetworks).length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No network found.</div>
          ) : (
            Object.entries(groupedNetworks).map(([group, groupNetworks], index) => (
              <React.Fragment key={group}>
                {groupByEcosystem && (
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                    {group}
                  </DropdownMenuLabel>
                )}
                <DropdownMenuGroup>
                  {groupNetworks.map((network) => (
                    <DropdownMenuItem
                      key={getNetworkId(network)}
                      onSelect={() => {
                        onSelectNetwork(network);
                        setOpen(false);
                      }}
                      className="gap-2"
                    >
                      {getNetworkIcon?.(network)}
                      <div className="flex flex-1 items-center gap-2 min-w-0">
                        <span className="truncate">{getNetworkLabel(network)}</span>
                        {getNetworkType && (
                          <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                            {getNetworkType(network)}
                          </span>
                        )}
                      </div>
                      {selectedNetwork &&
                        getNetworkId(selectedNetwork) === getNetworkId(network) && (
                          <Check className="h-4 w-4 opacity-100" />
                        )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                {index < Object.keys(groupedNetworks).length - 1 && <DropdownMenuSeparator />}
              </React.Fragment>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
