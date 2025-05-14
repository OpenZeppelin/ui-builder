import {
  useAccount,
  useChainId,
  useChains,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';

import React from 'react';

import type { BaseComponentProps } from '@openzeppelin/transaction-form-types';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@openzeppelin/transaction-form-ui';
import { cn } from '@openzeppelin/transaction-form-utils';

// Helper function to format addresses
const shortenAddress = (address: string | undefined) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * A button that allows users to connect their wallet.
 * Uses the direct wagmi hooks to handle wallet connection.
 */
export const CustomConnectButton: React.FC<BaseComponentProps> = ({ className }) => {
  const { isConnected } = useAccount();
  const { connect, connectors, error: connectError, isPending } = useConnect();

  const handleConnect = async () => {
    // Use the first available connector (typically injected, like MetaMask)
    const connector = connectors[0];
    if (connector) {
      try {
        await connect({ connector });
      } catch (err) {
        console.error('Connection error:', err);
      }
    }
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <Button
        onClick={handleConnect}
        disabled={isPending || isConnected || !connectors.length}
        variant="default"
        size="default"
      >
        {isPending ? 'Connecting...' : isConnected ? 'Connected' : 'Connect Wallet'}
      </Button>

      {connectError && (
        <p className="text-sm text-red-500 mt-1">
          {connectError.message || 'Error connecting wallet'}
        </p>
      )}
    </div>
  );
};

/**
 * A component that displays the connected account address and chain ID.
 * Also includes a disconnect button.
 */
export const CustomAccountDisplay: React.FC<BaseComponentProps> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-4 p-2 rounded-md border', className)}>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{shortenAddress(address)}</span>
        <span className="text-xs text-muted-foreground">Chain ID: {chainId}</span>
      </div>
      <Button onClick={() => disconnect()} variant="outline" size="sm">
        Disconnect
      </Button>
    </div>
  );
};

/**
 * A component that displays the current network and allows switching to other networks.
 * Uses the chainId and switchChain hooks from wagmi.
 */
export const CustomNetworkSwitcher: React.FC<BaseComponentProps> = ({ className }) => {
  const currentChainId = useChainId();
  const chains = useChains();
  const { switchChain, isPending, error } = useSwitchChain();
  const { isConnected } = useAccount();

  if (!isConnected) {
    return null;
  }

  // Find current chain info
  const currentChain = chains.find((chain) => chain.id === currentChainId);

  const handleNetworkChange = (chainId: number) => {
    if (chainId !== currentChainId) {
      switchChain({ chainId });
    }
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="text-sm font-medium mb-1">Network</div>
      <Select
        value={currentChainId?.toString()}
        onValueChange={(value) => handleNetworkChange(Number(value))}
        disabled={isPending || !chains.length}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={currentChain?.name || 'Select Network'} />
        </SelectTrigger>
        <SelectContent>
          {chains.map((chain) => (
            <SelectItem key={chain.id} value={chain.id.toString()}>
              {chain.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isPending && <p className="text-xs text-muted-foreground mt-1">Switching network...</p>}

      {error && (
        <p className="text-xs text-red-500 mt-1">{error.message || 'Error switching network'}</p>
      )}
    </div>
  );
};
