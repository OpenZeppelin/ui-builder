import { Loader2 } from 'lucide-react';
import type { Chain } from 'viem';
import React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@openzeppelin/ui-components';
import {
  useDerivedAccountStatus,
  useDerivedChainInfo,
  useDerivedSwitchChainStatus,
} from '@openzeppelin/ui-react';
import type { BaseComponentProps } from '@openzeppelin/ui-types';
import {
  cn,
  getWalletNetworkSwitcherSizeProps,
  getWalletNetworkSwitcherVariantClassName,
} from '@openzeppelin/ui-utils';

import { SafeWagmiComponent } from '../SafeWagmiComponent';

/**
 * A component that displays the current network and allows switching to other networks.
 * Uses the chainId and switchChain hooks.
 */
export const CustomNetworkSwitcher: React.FC<BaseComponentProps> = ({
  className,
  size,
  variant,
  fullWidth,
}) => {
  // Use the SafeWagmiComponent with null fallback
  return (
    <SafeWagmiComponent fallback={null}>
      <NetworkSwitcherContent
        className={className}
        size={size}
        variant={variant}
        fullWidth={fullWidth}
      />
    </SafeWagmiComponent>
  );
};

// Inner component that uses wagmi hooks
const NetworkSwitcherContent: React.FC<BaseComponentProps> = ({
  className,
  size,
  variant,
  fullWidth,
}) => {
  const { isConnected } = useDerivedAccountStatus();
  const { currentChainId, availableChains: unknownChains } = useDerivedChainInfo();
  const { switchChain, isSwitching: isPending, error } = useDerivedSwitchChainStatus();

  const sizeProps = getWalletNetworkSwitcherSizeProps(size);
  const variantClassName = getWalletNetworkSwitcherVariantClassName(variant);

  // Cast to Chain[] for use within this component
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
    <div className={cn('flex items-center', fullWidth && 'w-full', className)}>
      <Select
        value={currentChainId?.toString() ?? ''}
        onValueChange={(value: string) => handleNetworkChange(Number(value))}
        disabled={isPending || typedAvailableChains.length === 0}
      >
        <SelectTrigger
          className={cn(
            sizeProps.triggerClassName,
            variantClassName,
            fullWidth && 'w-full max-w-none'
          )}
        >
          <SelectValue placeholder="Network">{currentChainName}</SelectValue>
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={5}
          align="start"
          className="w-auto min-w-[160px] max-h-[300px]"
        >
          {typedAvailableChains.map((chain) => (
            <SelectItem
              key={chain.id}
              value={chain.id.toString()}
              className={sizeProps.itemClassName}
            >
              {chain.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isPending && (
        <span className="text-muted-foreground ml-2">
          <Loader2 className={cn(sizeProps.loaderSize, 'animate-spin')} />
        </span>
      )}

      {error && <span className="text-xs text-red-500 ml-2">!</span>}
    </div>
  );
};
