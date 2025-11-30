import React from 'react';

import type { NetworkConfig } from '@openzeppelin/ui-builder-types';
import { cn } from '@openzeppelin/ui-builder-utils';

import { MidnightIcon } from '../icons/MidnightIcon';

export interface NetworkIconProps {
  network: Pick<NetworkConfig, 'ecosystem' | 'iconComponent'>;
  className?: string;
  size?: number;
  variant?: 'mono' | 'branded';
}

export function NetworkIcon({
  network,
  className,
  size = 16,
  variant = 'branded',
}: NetworkIconProps): React.ReactElement {
  if (network.ecosystem === 'midnight') {
    return <MidnightIcon size={size} className={cn('shrink-0', className)} />;
  }

  if (network.iconComponent) {
    return (
      <network.iconComponent size={size} variant={variant} className={cn('shrink-0', className)} />
    );
  }

  return (
    <div
      className={cn('bg-muted shrink-0 rounded-full', className)}
      style={{ width: size, height: size }}
    />
  );
}
