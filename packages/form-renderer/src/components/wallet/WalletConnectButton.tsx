import { Wallet } from 'lucide-react';

import { useState } from 'react';

import { LoadingButton } from '../ui/loading-button';

export interface WalletConnectButtonProps {
  /**
   * Callback function to be called when wallet connection state changes
   */
  onConnectionChange: (isConnected: boolean, address: string | null) => void;
}

/**
 * WalletConnectButton Component
 *
 * Displays a button for connecting/disconnecting a wallet. In this demo implementation,
 * it simulates the connection process without actual blockchain interaction.
 *
 * @param props The component props
 * @returns A React component
 */
export function WalletConnectButton({
  onConnectionChange,
}: WalletConnectButtonProps): React.ReactElement {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  // Demo wallet connection handler
  const handleConnect = async (): Promise<void> => {
    if (isConnected) {
      // Disconnect wallet
      setIsConnecting(true);

      // Simulate disconnect delay
      setTimeout(() => {
        setIsConnected(false);
        setConnectedAddress(null);
        setIsConnecting(false);
        onConnectionChange(false, null);
      }, 500);
      return;
    }

    // Connect wallet
    setIsConnecting(true);

    // Simulate connection delay
    setTimeout(() => {
      // Generate a mock Ethereum address
      const mockAddress =
        '0x' +
        Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      setIsConnected(true);
      setConnectedAddress(mockAddress);
      setIsConnecting(false);
      onConnectionChange(true, mockAddress);
    }, 1000);
  };

  // Format connected address for display
  const formatAddress = (address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <LoadingButton
      type="button"
      variant="outline"
      size="sm"
      onClick={handleConnect}
      disabled={isConnecting}
      loading={isConnecting}
      className="flex items-center gap-2"
    >
      <Wallet className="h-4 w-4" />
      {isConnected
        ? connectedAddress
          ? formatAddress(connectedAddress)
          : 'Connected'
        : 'Connect Wallet'}
    </LoadingButton>
  );
}
