import React, { useEffect, useMemo } from 'react';

import { logger } from '@openzeppelin/transaction-form-utils';

import SharedAdapterContext from '../context/SharedAdapterContext';
import { WalletUiContextProvider } from '../context/WalletUiContextProvider';
import { useCurrentAdapter } from '../hooks/useCurrentAdapter';
import { useSharedAdapter } from '../hooks/useSharedAdapter';

import { WalletConnectionUI } from './WalletConnectionUI';

interface WalletIntegrationProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that sets up wallet integration for the app
 * It provides both the context provider and UI components
 *
 * This component now relies on the AdapterProvider (which should be higher in the tree)
 * for adapter instance management, and simply provides the shared adapter context
 * for its child components.
 */
export const WalletIntegration: React.FC<WalletIntegrationProps> = ({ children }) => {
  // Get the adapter from the AdapterProvider through useCurrentAdapter
  const adapterState = useCurrentAdapter();

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => adapterState, [adapterState]);

  // Log adapter initialization
  useEffect(() => {
    if (adapterState.adapter) {
      logger.info('WalletIntegration', 'Adapter received from context:', {
        type: adapterState.adapter.constructor.name,
        networkId: adapterState.adapter.networkConfig.id,
        loading: adapterState.loading,
        objectId: Object.prototype.toString.call(adapterState.adapter),
      });
    } else if (adapterState.loading) {
      logger.info('WalletIntegration', 'Waiting for adapter from context...');
    } else {
      logger.warn('WalletIntegration', 'No adapter available and not loading');
    }
  }, [adapterState.adapter, adapterState.loading]);

  return (
    <SharedAdapterContext.Provider value={contextValue}>
      <WalletUiContextProvider adapter={adapterState.adapter}>{children}</WalletUiContextProvider>
    </SharedAdapterContext.Provider>
  );
};

/**
 * Component that renders the wallet connection UI
 * Can be used in the header or other parts of the app
 */
export const WalletConnectionHeader: React.FC = () => {
  // Get adapter from shared context instead of calling useCurrentAdapter again
  const { adapter, loading } = useSharedAdapter();

  // Debug log when adapter changes
  useEffect(() => {
    logger.debug('WalletConnectionHeader', 'Adapter state from SharedAdapterContext:', {
      hasAdapter: !!adapter,
      adapterType: adapter ? adapter.constructor.name : null,
      loading,
      objectId: adapter ? Object.prototype.toString.call(adapter) : null,
    });
  }, [adapter, loading]);

  if (loading) {
    return <div className="h-9 w-28 animate-pulse rounded bg-muted"></div>;
  }

  return <WalletConnectionUI adapter={adapter} />;
};
