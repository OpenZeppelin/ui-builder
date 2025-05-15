import React, { useEffect, useState } from 'react';

import type {
  ContractAdapter,
  EcosystemReactUiProviderProps,
  UiKitConfiguration,
} from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

interface WalletUiContextProviderProps {
  adapter: ContractAdapter | null;
  children: React.ReactNode;
  kitConfig?: UiKitConfiguration;
}

/**
 * Component that sets up the UI context provider from the adapter
 * This enables wallet connection functionality in the application
 */
export const WalletUiContextProvider: React.FC<WalletUiContextProviderProps> = ({
  adapter,
  children,
  kitConfig = { kitName: 'custom' },
}) => {
  const [ContextProvider, setContextProvider] =
    useState<React.ComponentType<EcosystemReactUiProviderProps> | null>(null);

  const [adapterConfigured, setAdapterConfigured] = useState(false);

  useEffect(() => {
    if (!adapter) {
      setContextProvider(null);
      setAdapterConfigured(false);
      return;
    }

    if (!adapterConfigured && typeof adapter.configureUiKit === 'function') {
      logger.debug('WalletUiContextProvider', 'Configuring UI kit', kitConfig);
      adapter.configureUiKit(kitConfig);
      setAdapterConfigured(true);
    }

    if (adapter && typeof adapter.getEcosystemReactUiContextProvider === 'function') {
      const provider = adapter.getEcosystemReactUiContextProvider();
      logger.debug('WalletUiContextProvider', 'Received context provider', {
        hasProvider: !!provider,
      });
      setContextProvider(() => provider || null);
    } else {
      setContextProvider(null);
    }
  }, [adapter, kitConfig, adapterConfigured]);

  if (!adapter || !ContextProvider) {
    return <>{children}</>;
  }

  return <ContextProvider>{children}</ContextProvider>;
};
