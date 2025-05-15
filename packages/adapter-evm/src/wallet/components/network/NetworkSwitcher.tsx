import { useAccount, useChainId, useChains, useSwitchChain } from 'wagmi';

import React from 'react';

import type { BaseComponentProps } from '@openzeppelin/transaction-form-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@openzeppelin/transaction-form-ui';
import { cn } from '@openzeppelin/transaction-form-utils';

import { SafeWagmiComponent } from '../../utils/SafeWagmiComponent';

/**
 * A component that displays the current network and allows switching to other networks.
 * Uses the chainId and switchChain hooks from wagmi.
 */
export const CustomNetworkSwitcher: React.FC<BaseComponentProps> = ({ className }) => {
  // Use the SafeWagmiComponent with null fallback
  return (
    <SafeWagmiComponent fallback={null}>
      <NetworkSwitcherContent className={className} />
    </SafeWagmiComponent>
  );
};

// Inner component that uses wagmi hooks
const NetworkSwitcherContent: React.FC<{ className?: string }> = ({ className }) => {
  const currentChainId = useChainId();
  const chains = useChains();
  const { switchChain, isPending, error } = useSwitchChain();
  const { isConnected } = useAccount();

  if (!isConnected || chains.length === 0) {
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
        onValueChange={(value: string) => handleNetworkChange(Number(value))}
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
