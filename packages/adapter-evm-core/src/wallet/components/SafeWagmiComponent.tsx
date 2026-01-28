import React, { useEffect, useState } from 'react';

import { logger } from '@openzeppelin/ui-utils';

import { useIsWagmiProviderInitialized } from '../hooks/useIsWagmiProviderInitialized';

/**
 * A wrapper component that safely renders children that use wagmi hooks.
 * It handles errors and provider initialization state to prevent crashes.
 */
export const SafeWagmiComponent = ({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const isProviderInitialized = useIsWagmiProviderInitialized();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state if provider initializes
    if (isProviderInitialized) {
      setHasError(false);
    }
  }, [isProviderInitialized]);

  // Setup global error handler for wagmi errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Only handle wagmi-related errors
      if (
        event.error?.message?.includes('useConfig') ||
        event.error?.message?.includes('WagmiProvider')
      ) {
        logger.debug(
          'SafeWagmiComponent',
          'Caught wagmi error via window error event:',
          event.error
        );
        setHasError(true);
        event.preventDefault(); // Prevent the error from propagating
      }
    };

    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // If provider isn't ready yet or we had an error, show fallback
  if (!isProviderInitialized || hasError) {
    return <>{fallback}</>;
  }

  try {
    return <>{children}</>;
  } catch (error) {
    // Only catch render errors related to wagmi hooks
    if (
      error instanceof Error &&
      (error.message.includes('useConfig') || error.message.includes('WagmiProvider'))
    ) {
      logger.debug('SafeWagmiComponent', 'Caught wagmi error:', error);
      setHasError(true);
      return <>{fallback}</>;
    }
    // Re-throw other errors
    throw error;
  }
};
