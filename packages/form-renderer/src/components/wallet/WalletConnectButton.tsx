import { Wallet } from 'lucide-react';

import { Button, LoadingButton } from '@openzeppelin/transaction-form-ui';
import { logger } from '@openzeppelin/transaction-form-utils';

import { useWalletConnection } from './useWalletConnection';
import { formatAddress } from './utils';

export interface WalletConnectButtonProps {
  /**
   * Additional CSS class name for the button
   */
  className?: string;
}

/**
 * WalletConnectButton Component
 *
 * Displays a button for connecting/disconnecting a wallet using the adapter interface.
 * The component must be used within a WalletConnectionProvider.
 *
 * @param props The component props
 * @returns A React component
 */
export function WalletConnectButton({
  className,
}: WalletConnectButtonProps = {}): React.ReactElement {
  const { isConnected, address, isConnecting, connect, disconnect, isSupported, error } =
    useWalletConnection();

  const handleConnectClick = (): void => {
    connect().catch((err) =>
      logger.error('WalletConnectButton', 'Error in connect button click handler:', err)
    );
  };

  const handleDisconnectClick = (): void => {
    disconnect().catch((err) => console.error('Error in disconnect button click handler:', err));
  };

  // If wallet connection is not supported by the adapter, don't render anything
  if (!isSupported) {
    return <></>;
  }

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 ${className || ''}`}
        onClick={handleDisconnectClick}
        title="Click to disconnect wallet"
      >
        <Wallet className="h-4 w-4" />
        {formatAddress(address)}
      </Button>
    );
  }

  return (
    <LoadingButton
      type="button"
      variant="outline"
      size="sm"
      onClick={handleConnectClick}
      disabled={isConnecting}
      loading={isConnecting}
      className={`flex items-center gap-2 ${className || ''}`}
      title={error}
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </LoadingButton>
  );
}
