import { describe, expect, it, vi } from 'vitest';

import {
  disconnectStellarWallet,
  getStellarWalletConnectionStatus,
  supportsStellarWalletConnection,
} from '../connection';

// Mock the stellar-wallets-kit to avoid CommonJS import issues
vi.mock('@creit.tech/stellar-wallets-kit', () => ({
  StellarWalletsKit: vi.fn(() => ({
    getSupportedWallets: vi.fn().mockResolvedValue([]),
    setWallet: vi.fn(),
    getAddress: vi.fn(),
    signTransaction: vi.fn(),
  })),
  WalletNetwork: {
    PUBLIC: 'PUBLIC',
    TESTNET: 'TESTNET',
  },
  allowAllModules: vi.fn(() => ({})),
}));

// Mock the stellarUiKitManager
vi.mock('../stellar-wallets-kit', () => ({
  stellarUiKitManager: {
    getState: vi.fn(() => ({
      isConfigured: true,
      currentFullUiKitConfig: {
        kitName: 'custom',
        kitConfig: {},
      },
      stellarKitProvider: null,
      networkConfig: {
        type: 'testnet',
        horizon: 'https://horizon-testnet.stellar.org',
        passphrase: 'Test SDF Network ; September 2015',
      },
      hasConfigError: false,
      lastConfigError: null,
    })),
  },
}));

describe('Stellar Wallet Connection', () => {
  describe('supportsStellarWalletConnection', () => {
    it('should return true', () => {
      expect(supportsStellarWalletConnection()).toBe(true);
    });
  });

  describe('disconnectStellarWallet', () => {
    it('should disconnect wallet successfully', async () => {
      await disconnectStellarWallet();

      // Since disconnectStellarWallet only clears internal state and doesn't
      // call any methods on the kit, we just verify it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('getStellarWalletConnectionStatus', () => {
    it('should return disconnected status when no address', () => {
      const status = getStellarWalletConnectionStatus();

      expect(status).toHaveProperty('isConnected', false);
      expect(status).toHaveProperty('address');
      expect(status).toHaveProperty('walletId');
      expect(status).toHaveProperty('chainId');
    });
  });
});
