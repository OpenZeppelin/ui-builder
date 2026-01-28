/**
 * Tests for EVM adapter wallet connection functionality
 */
import type { GetAccountReturnType } from '@wagmi/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockEvmNetworkConfig } from './mocks/mock-network-configs';

import { EvmAdapter } from '../adapter';

// Mock the createEvmWalletImplementation factory to isolate EvmAdapter logic
vi.mock('../wallet/implementation/wagmi-implementation', () => {
  // --- Mock implementations for WagmiWalletImplementation methods ---
  const mockGetAvailableConnectors = vi.fn().mockResolvedValue([
    { id: 'injected', name: 'Browser Wallet' },
    { id: 'walletConnect', name: 'WalletConnect' },
  ]);

  const mockConnect = vi.fn().mockImplementation(async (_connectorId: string) => ({
    connected: true,
    address: '0x1234567890123456789012345678901234567890',
    chainId: mockEvmNetworkConfig.chainId,
    error: undefined,
  }));

  const mockDisconnect = vi.fn().mockResolvedValue({ disconnected: true, error: undefined });

  const mockSwitchNetwork = vi.fn().mockResolvedValue(undefined);

  // Mock the raw Wagmi status returned by the implementation class
  const mockWagmiStatus: GetAccountReturnType = {
    address: undefined,
    addresses: undefined,
    chain: undefined,
    chainId: undefined,
    connector: undefined,
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
    isReconnecting: false,
    status: 'disconnected',
  };

  const mockGetWalletConnectionStatus = vi.fn().mockReturnValue(mockWagmiStatus);

  const mockOnWalletConnectionChange = vi.fn().mockImplementation((_callback) => {
    // Return a dummy unsubscribe function
    return () => {};
  });
  // --- End Mock Implementations ---

  return {
    createEvmWalletImplementation: vi.fn().mockImplementation(() => ({
      // Expose mocks
      getAvailableConnectors: mockGetAvailableConnectors,
      connect: mockConnect,
      disconnect: mockDisconnect,
      getWalletConnectionStatus: mockGetWalletConnectionStatus,
      onWalletConnectionChange: mockOnWalletConnectionChange,
      switchNetwork: mockSwitchNetwork,
    })),
  };
});

describe('EvmAdapter Wallet Connection', () => {
  let adapter: EvmAdapter;

  beforeEach(() => {
    // Instantiate adapter WITH shared mock config
    adapter = new EvmAdapter(mockEvmNetworkConfig);
    // Optionally clear mock history if needed between tests
    // vi.clearAllMocks();
  });

  it('should support wallet connection', () => {
    expect(adapter.supportsWalletConnection()).toBe(true);
  });

  it('should get available connectors', async () => {
    const connectors = await adapter.getAvailableConnectors();
    expect(connectors).toBeInstanceOf(Array);
    expect(connectors.length).toBeGreaterThan(0);
    expect(connectors[0]).toHaveProperty('id');
    expect(connectors[0]).toHaveProperty('name');
  });

  it('should connect wallet with a connector ID', async () => {
    const connectorId = 'injected'; // Example connector ID
    const result = await adapter.connectWallet(connectorId);
    expect(result.connected).toBe(true);
    expect(result.address).toBe('0x1234567890123456789012345678901234567890');
    expect(result.error).toBeUndefined();
  });

  it('should disconnect wallet', async () => {
    const result = await adapter.disconnectWallet();
    expect(result.disconnected).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should get wallet connection status', () => {
    const status = adapter.getWalletConnectionStatus();
    expect(status).toHaveProperty('isConnected');
    expect(status.isConnected).toBe(false);
  });

  it('should subscribe to wallet connection changes', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.onWalletConnectionChange(callback);

    expect(typeof unsubscribe).toBe('function');
  });
});
