import React, { useEffect } from 'react';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { useWalletState } from '../hooks/WalletStateContext';

import { WalletConnectionUI } from './WalletConnectionUI';

/**
 * Component that renders the wallet connection UI.
 * Uses useWalletState to get its data.
 */
export const WalletConnectionHeader: React.FC = () => {
  const { isAdapterLoading, activeAdapter } = useWalletState();

  useEffect(() => {
    logger.debug('WalletConnectionHeader', '[Debug] State from useWalletState:', {
      adapterPresent: !!activeAdapter,
      adapterNetwork: activeAdapter?.networkConfig.id,
      isLoading: isAdapterLoading,
    });
  }, [activeAdapter, isAdapterLoading]);

  if (isAdapterLoading) {
    logger.debug('WalletConnectionHeader', '[Debug] Adapter loading, showing skeleton.');
    return <div className="h-9 w-28 animate-pulse rounded bg-muted"></div>;
  }

  return <WalletConnectionUI />;
};
