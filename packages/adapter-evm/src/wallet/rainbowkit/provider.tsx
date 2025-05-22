import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Config as WagmiConfig } from '@wagmi/core';
import { WagmiProvider } from 'wagmi';

import React, { useEffect, useMemo, useState } from 'react';

import type {
  EcosystemReactUiProviderProps,
  UiKitConfiguration,
} from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { WagmiProviderInitializedContext } from '../context/wagmi-context';
import { EvmBasicUiContextProvider } from '../provider';
import { getEvmWalletImplementation } from '../utils/walletImplementationManager';

import { type RainbowKitImports, getRainbowKitConfig, tryImportRainbowKit } from './utils';

// Create a single QueryClient instance to be reused for RainbowKit
const queryClient = new QueryClient();

/**
 * Creates a RainbowKit UI context provider that uses dynamic imports to load RainbowKit
 * and its specific wagmi configuration.
 *
 * @param uiKitConfiguration The UI kit configuration containing RainbowKit options
 * @returns A React component that provides the RainbowKit context, or falls back to basic context.
 */
export function createRainbowKitUIProvider(
  uiKitConfiguration: UiKitConfiguration
): React.FC<EcosystemReactUiProviderProps> {
  // Extract the RainbowKit-specific configuration early to decide if we proceed
  const currentRainbowKitConfig = getRainbowKitConfig(uiKitConfiguration);

  if (!currentRainbowKitConfig) {
    logger.warn(
      'rainbowkit/provider',
      'Not a valid RainbowKit configuration object. Using fallback EvmBasicUiContextProvider.'
    );
    return EvmBasicUiContextProvider;
  }

  const RainbowKitWrapperComponent: React.FC<EcosystemReactUiProviderProps> = ({ children }) => {
    const [wagmiConfigForRainbowKit, setWagmiConfigForRainbowKit] = useState<WagmiConfig | null>(
      null
    );
    const [rainbowKitModules, setRainbowKitModules] = useState<RainbowKitImports | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      let isMounted = true;
      async function loadModulesAndConfig() {
        try {
          setIsLoading(true);
          const modules = await tryImportRainbowKit();
          if (!modules) {
            throw new Error('Failed to dynamically import RainbowKit modules.');
          }

          const config = await getEvmWalletImplementation().getConfigForRainbowKit();
          if (!config) {
            throw new Error('Failed to retrieve Wagmi configuration for RainbowKit.');
          }

          if (isMounted) {
            setRainbowKitModules(modules);
            setWagmiConfigForRainbowKit(config);
            setError(null);
          }
        } catch (err) {
          if (isMounted) {
            setError(err instanceof Error ? err : new Error(String(err)));
            logger.error('RainbowKitProviderWrapper', 'Error loading RainbowKit essentials:', err);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }

      loadModulesAndConfig();

      return () => {
        isMounted = false;
      };
    }, []); // Empty dependency array ensures this runs once on mount

    // Memoize derived RainbowKitProvider props to prevent unnecessary re-renders
    const rainbowKitProviderProps = useMemo(() => {
      if (!rainbowKitModules || !currentRainbowKitConfig) return {};

      const { darkTheme, lightTheme } = rainbowKitModules;
      let theme;
      if (currentRainbowKitConfig.themeOptions) {
        // The theme functions from RainbowKit are typed with specific options.
        // Since we dynamically import them (typed as `any` in RainbowKitImports)
        // and themeOptions is Record<string, unknown>, a cast to `any` is a pragmatic
        // approach here to bridge the types for these dynamically resolved functions.
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if (currentRainbowKitConfig.themeName === 'light' && lightTheme) {
          theme = lightTheme(currentRainbowKitConfig.themeOptions as any);
        } else if (currentRainbowKitConfig.themeName === 'dark' && darkTheme) {
          theme = darkTheme(currentRainbowKitConfig.themeOptions as any);
        } else if (darkTheme) {
          // Default to dark if options provided but no name
          theme = darkTheme(currentRainbowKitConfig.themeOptions as any);
        }
        /* eslint-enable @typescript-eslint/no-explicit-any */
      }

      return {
        theme,
        initialChain: currentRainbowKitConfig.initialChain,
        modalSize: currentRainbowKitConfig.modalSize,
        // appInfo could be added here if needed, e.g. appInfo={{ appName: currentRainbowKitConfig.appName }}
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rainbowKitModules, currentRainbowKitConfig]);

    if (isLoading) {
      logger.debug('RainbowKitProviderWrapper', 'Loading RainbowKit config and modules...');
      return (
        <WagmiProviderInitializedContext.Provider value={false}>
          {children}
        </WagmiProviderInitializedContext.Provider>
      );
    }

    if (error || !wagmiConfigForRainbowKit || !rainbowKitModules?.RainbowKitProvider) {
      logger.warn(
        'RainbowKitProviderWrapper',
        'Failed to load RainbowKit dependencies or config. Falling back to EvmBasicUiContextProvider.',
        error
      );
      return <EvmBasicUiContextProvider>{children}</EvmBasicUiContextProvider>;
    }

    const { RainbowKitProvider } = rainbowKitModules;

    logger.info(
      'RainbowKitProviderWrapper',
      'Rendering with RainbowKitProvider and its specific Wagmi config.'
    );
    return (
      <WagmiProvider config={wagmiConfigForRainbowKit} reconnectOnMount={true}>
        <QueryClientProvider client={queryClient}>
          <WagmiProviderInitializedContext.Provider value={true}>
            <RainbowKitProvider {...rainbowKitProviderProps}>{children}</RainbowKitProvider>
          </WagmiProviderInitializedContext.Provider>
        </QueryClientProvider>
      </WagmiProvider>
    );
  };

  return RainbowKitWrapperComponent;
}
