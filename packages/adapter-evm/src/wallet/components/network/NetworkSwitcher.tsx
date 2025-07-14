import { Loader2 } from 'lucide-react';
import type { Chain } from 'viem';

import React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@openzeppelin/contracts-ui-builder-ui';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';
import {
  useDerivedAccountStatus,
  useDerivedChainInfo,
  useDerivedSwitchChainStatus,
} from '@openzeppelin/transaction-form-react-core';
import type { BaseComponentProps } from '@openzeppelin/contracts-ui-builder-types';

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
  const { isConnected } = useDerivedAccountStatus();
  const { currentChainId, availableChains: unknownChains } = useDerivedChainInfo();
  const { switchChain, isSwitching: isPending, error } = useDerivedSwitchChainStatus();

  // Cast to Chain[] for use within this EVM-specific component
  const typedAvailableChains = unknownChains as Chain[];

  if (!isConnected || !switchChain || typedAvailableChains.length === 0) {
    return null;
  }

  const handleNetworkChange = (chainId: number) => {
    if (chainId !== currentChainId) {
      switchChain({ chainId });
    }
  };

  const currentChain = typedAvailableChains.find((chain) => chain.id === currentChainId);
  const currentChainName = currentChain?.name || 'Network';

  return (
    <div className={cn('flex items-center', className)}>
      <Select
        value={currentChainId?.toString() ?? ''}
        onValueChange={(value: string) => handleNetworkChange(Number(value))}
        disabled={isPending || typedAvailableChains.length === 0}
      >
        <SelectTrigger className="h-8 text-xs px-2 min-w-[90px] max-w-[120px]">
          <SelectValue placeholder="Network">{currentChainName}</SelectValue>
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={5}
          align="start"
          className="w-auto min-w-[160px] max-h-[300px]"
        >
          {typedAvailableChains.map((chain) => (
            <SelectItem key={chain.id} value={chain.id.toString()} className="text-xs py-1.5">
              {chain.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isPending && (
        <span className="text-xs text-muted-foreground ml-2">
          <Loader2 className="h-3 w-3 animate-spin" />
        </span>
      )}

      {error && <span className="text-xs text-red-500 ml-2">!</span>}
    </div>
  );
};
