import { Loader2 } from 'lucide-react';
import React, { useContext, useEffect, useRef, useState } from 'react';

import { Button } from '@openzeppelin/ui-components';
import type { BaseComponentProps } from '@openzeppelin/ui-types';
import { cn, logger } from '@openzeppelin/ui-utils';

import { CustomConnectButton } from '../components';
import { WagmiProviderInitializedContext } from '../context/wagmi-context';
import { evmUiKitManager } from '../evmUiKitManager';
import { extractRainbowKitCustomizations } from './types';

const MIN_COMPONENT_LOADING_DISPLAY_MS = 1000; // 1 second artificial delay

/**
 * Creates a lazy-loaded RainbowKit ConnectButton component.
 *
 * @returns A React component that dynamically imports the RainbowKit ConnectButton
 */
export const RainbowKitConnectButton: React.FC<BaseComponentProps> = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoadingComponent, setIsLoadingComponent] = useState(true);
  const [showComponentLoadingOverride, setShowComponentLoadingOverride] = useState(false);
  const componentLoadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [managerState, setManagerState] = useState(evmUiKitManager.getState());

  const isWagmiProviderReady = useContext(WagmiProviderInitializedContext);

  // Subscribe to UI kit manager state changes
  useEffect(() => {
    const unsubscribe = evmUiKitManager.subscribe(() => {
      setManagerState(evmUiKitManager.getState());
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
          logger.error('RainbowKitConnectButton', 'Failed to load RainbowKit ConnectButton:', err);
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

  const renderLoadingPlaceholder = (message: string) => (
    <Button
      disabled={true}
      variant="outline"
      size="sm"
      className={cn('h-8 px-2 text-xs', props.className)}
    >
      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
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
    logger.warn('RainbowKitConnectButton', 'Component is null after loading phase, falling back.');
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
