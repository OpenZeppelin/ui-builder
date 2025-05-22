import React, { useEffect, useState } from 'react';

import type { BaseComponentProps } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import { CustomConnectButton } from '../components';

/**
 * Creates a lazy-loaded RainbowKit ConnectButton component.
 *
 * @returns A React component that dynamically imports the RainbowKit ConnectButton
 */
export const RainbowKitConnectButton: React.FC<BaseComponentProps> = (props) => {
  // Use any for dynamic component to avoid TypeScript errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Component, setComponent] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Using dynamic import with a module function to handle typing better
    const loadComponent = async () => {
      try {
        const rainbowKit = await import('@rainbow-me/rainbowkit');
        if (isMounted) {
          setComponent(() => rainbowKit.ConnectButton);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
          logger.error('RainbowKitConnectButton', 'Failed to load RainbowKit ConnectButton:', err);
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    logger.warn(
      'RainbowKitConnectButton',
      'Error loading RainbowKit ConnectButton. Displaying fallback button.'
    );
    return <CustomConnectButton {...props} />;
  }

  if (isLoading || !Component) {
    // Render a placeholder while loading
    return <div className={props.className}>Loading wallet connect...</div>;
  }

  return <Component {...props} />;
};
