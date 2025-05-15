import React, { useEffect, useState } from 'react';

import type { ContractAdapter } from '@openzeppelin/transaction-form-types';
import { Button } from '@openzeppelin/transaction-form-ui';
import { cn, logger } from '@openzeppelin/transaction-form-utils';

interface WalletConnectionUIProps {
  adapter: ContractAdapter | null;
  className?: string;
}

/**
 * Component that displays wallet connection UI components
 * provided by the active adapter.
 */
export const WalletConnectionUI: React.FC<WalletConnectionUIProps> = ({ adapter, className }) => {
  const [isError, setIsError] = useState(false);

  // Setup error handling with useEffect
  useEffect(() => {
    const handleError = () => {
      setIsError(true);
    };
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Get wallet components from adapter if available
  if (!adapter || typeof adapter.getEcosystemWalletComponents !== 'function') {
    return null;
  }

  let walletComponents;
  try {
    walletComponents = adapter.getEcosystemWalletComponents();
    if (!walletComponents) {
      return null;
    }
  } catch (error) {
    logger.error('WalletConnectionUI', 'Error getting wallet components:', error);
    setIsError(true);
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <Button variant="destructive" size="sm" onClick={() => window.location.reload()}>
          Wallet Error - Retry
        </Button>
      </div>
    );
  }

  // Log available components for debugging
  logger.debug('WalletConnectionUI', 'Rendering wallet components:', {
    hasConnectButton: !!walletComponents.ConnectButton,
    hasAccountDisplay: !!walletComponents.AccountDisplay,
    hasNetworkSwitcher: !!walletComponents.NetworkSwitcher,
  });

  const { ConnectButton, AccountDisplay, NetworkSwitcher } = walletComponents;

  // If there was an error, show an error button
  if (isError) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <Button variant="destructive" size="sm" onClick={() => window.location.reload()}>
          Wallet Error - Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Display account info if available */}
      {AccountDisplay && <AccountDisplay />}

      {/* Display network switcher if available */}
      {NetworkSwitcher && <NetworkSwitcher />}

      {/* Display connect button if available */}
      {ConnectButton && <ConnectButton />}
    </div>
  );
};
