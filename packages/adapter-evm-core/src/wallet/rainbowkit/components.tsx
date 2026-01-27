import { Loader2 } from 'lucide-react';
import React, { useContext, useEffect, useRef, useState } from 'react';

import { Button } from '@openzeppelin/ui-components';
import type { BaseComponentProps } from '@openzeppelin/ui-types';
import { cn, getWalletButtonSizeProps, logger } from '@openzeppelin/ui-utils';

import { CustomConnectButton } from '../components';
import { WagmiProviderInitializedContext } from '../context';
import type { UiKitManager } from '../uiKitManager';
import { extractRainbowKitCustomizations } from './types';

const MIN_COMPONENT_LOADING_DISPLAY_MS = 1000; // 1 second artificial delay

/**
 * Props for the RainbowKitConnectButton component created by the factory.
 */
export type RainbowKitConnectButtonProps = BaseComponentProps;

/**
 * Creates a RainbowKitConnectButton component that uses the provided UI kit manager.
 * This factory pattern allows adapters to inject their specific UI kit manager instance.
 *
 * @param uiKitManager - The UI kit manager instance to use for state management
 * @returns A React component that renders the RainbowKit ConnectButton
 *
 * @example
 * ```typescript
 * // In adapter-evm:
 * import { createRainbowKitConnectButton } from '@openzeppelin/ui-builder-adapter-evm-core';
 * import { evmUiKitManager } from './evmUiKitManager';
 *
 * export const RainbowKitConnectButton = createRainbowKitConnectButton(evmUiKitManager);
 *
 * // In adapter-polkadot:
 * import { createRainbowKitConnectButton } from '@openzeppelin/ui-builder-adapter-evm-core';
 * import { polkadotUiKitManager } from './polkadotUiKitManager';
 *
 * export const RainbowKitConnectButton = createRainbowKitConnectButton(polkadotUiKitManager);
 * ```
 */
export function createRainbowKitConnectButton(
  uiKitManager: UiKitManager
): React.FC<RainbowKitConnectButtonProps> {
  const RainbowKitConnectButtonComponent: React.FC<RainbowKitConnectButtonProps> = (props) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoadingComponent, setIsLoadingComponent] = useState(true);
    const [showComponentLoadingOverride, setShowComponentLoadingOverride] = useState(false);
    const componentLoadingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [managerState, setManagerState] = useState(uiKitManager.getState());

    const isWagmiProviderReady = useContext(WagmiProviderInitializedContext);

    // Subscribe to UI kit manager state changes
    useEffect(() => {
      const unsubscribe = uiKitManager.subscribe(() => {
        setManagerState(uiKitManager.getState());
      });
      return unsubscribe;
    }, []);

    useEffect(() => {
      let isMounted = true;
      setIsLoadingComponent(true);
      setShowComponentLoadingOverride(true); // Start showing override immediately

      if (componentLoadingTimerRef.current) {
        clearTimeout(componentLoadingTimerRef.current);
      }
      componentLoadingTimerRef.current = setTimeout(() => {
        if (isMounted) {
          setShowComponentLoadingOverride(false);
        }
        componentLoadingTimerRef.current = null;
      }, MIN_COMPONENT_LOADING_DISPLAY_MS);

      const loadComponent = async () => {
        try {
          const rainbowKit = await import('@rainbow-me/rainbowkit');
          if (isMounted) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setComponent(() => rainbowKit.ConnectButton as React.ComponentType<any>);
            // Actual component loading is done, but override might still be active
            setIsLoadingComponent(false);
          }
        } catch (err) {
          if (isMounted) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setIsLoadingComponent(false); // Finished loading (with an error)
            logger.error(
              'RainbowKitConnectButton',
              'Failed to load RainbowKit ConnectButton:',
              err
            );
          }
        }
      };

      loadComponent();

      return () => {
        isMounted = false;
        if (componentLoadingTimerRef.current) {
          clearTimeout(componentLoadingTimerRef.current);
        }
      };
    }, []); // Effect for dynamic import runs once

    const sizeProps = getWalletButtonSizeProps(props.size);

    const renderLoadingPlaceholder = (message: string) => (
      <Button
        disabled={true}
        variant={props.variant || 'outline'}
        size={sizeProps.size}
        className={cn(sizeProps.className, props.fullWidth && 'w-full', props.className)}
      >
        <Loader2 className={cn(sizeProps.iconSize, 'animate-spin mr-1.5')} />
        {message}
      </Button>
    );

    if (error) {
      logger.warn(
        'RainbowKitConnectButton',
        'Error loading RainbowKit ConnectButton. Displaying fallback CustomConnectButton.'
      );
      return <CustomConnectButton {...props} />;
    }

    // Show "Loading Wallet..." if component is still factually loading OR if the override is active
    if (isLoadingComponent || showComponentLoadingOverride) {
      return renderLoadingPlaceholder('Loading Wallet...');
    }
    // At this point, component import has finished (successfully or not handled by error state)
    // AND the minimum display time for "Loading Wallet..." has passed.

    // Now check if the provider context is ready
    if (!isWagmiProviderReady) {
      // No separate delay for this message; it appears if context isn't ready after component load delay.
      return renderLoadingPlaceholder('Initializing Provider...');
    }

    // Component should be non-null here if no error and not isLoadingComponent
    if (!Component) {
      // This case should ideally not be hit if logic is correct, but as a safeguard:
      logger.warn(
        'RainbowKitConnectButton',
        'Component is null after loading phase, falling back.'
      );
      return <CustomConnectButton {...props} />;
    }

    // Extract custom configuration from the manager state
    const kitConfig = managerState.currentFullUiKitConfig?.kitConfig;
    const customizations = extractRainbowKitCustomizations(kitConfig);
    const connectButtonConfig = customizations?.connectButton;

    // Merge props: base props + custom configuration + any overrides from props
    // This allows the config to set defaults while still allowing prop overrides
    const finalProps = {
      ...connectButtonConfig, // Apply custom configuration from config
      ...props, // Allow props to override configuration
    };

    logger.debug('RainbowKitConnectButton', 'Rendering with configuration:', {
      configFromFile: connectButtonConfig,
      finalProps: finalProps,
    });

    return <Component {...finalProps} />;
  };

  // Set display name for debugging
  RainbowKitConnectButtonComponent.displayName = 'RainbowKitConnectButton';

  return RainbowKitConnectButtonComponent;
}
