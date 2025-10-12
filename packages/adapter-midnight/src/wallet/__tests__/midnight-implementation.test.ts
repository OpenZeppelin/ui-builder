import {
  type DAppConnectorAPI,
  type DAppConnectorWalletAPI,
} from '@midnight-ntwrk/dapp-connector-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LaceWalletImplementation } from '../implementation/lace-implementation';

const mockApi: DAppConnectorWalletAPI = {
  state: vi.fn().mockResolvedValue({ address: 'test-address' }),
  balanceAndProveTransaction: vi.fn(),
  submitTransaction: vi.fn(),
  balanceTransaction: vi.fn(),
  proveTransaction: vi.fn(),
};

const mockLace: DAppConnectorAPI = {
  enable: vi.fn().mockResolvedValue(mockApi),
  isEnabled: vi.fn().mockResolvedValue(true),
  name: 'Lace',
  apiVersion: '1.0.0',
  serviceUriConfig: vi.fn(),
};

// Store original window if it exists
const originalWindow = global.window;

describe('Midnight Wallet Implementation', () => {
  let impl: LaceWalletImplementation;
  beforeEach(() => {
    // @ts-expect-error - We are intentionally overwriting the global window for tests
    global.window = {
      midnight: {
        mnLace: mockLace,
      },
    };
    vi.clearAllMocks();
    impl = new LaceWalletImplementation();
  });

  afterEach(() => {
    // Restore the original window object
    global.window = originalWindow;
    impl.disconnect();
  });

  it('should call the enable method on the Lace wallet API', async () => {
    const result = await impl.connect();
    expect(mockLace.enable).toHaveBeenCalledTimes(1);
    expect(result.connected).toBe(true);
  });

  it('should return an error if the wallet is not found', async () => {
    // @ts-expect-error - We are deleting a property from the mock window for this test case
    delete global.window.midnight.mnLace;
    const result = await impl.connect();
    expect(result.connected).toBe(false);
    expect(result.error).toBe('Lace wallet not found.');
  });

  it('should return an error if the connection is rejected', async () => {
    const rejectionError = new Error('User rejected.');
    vi.spyOn(mockLace, 'enable').mockRejectedValueOnce(rejectionError);
    const result = await impl.connect();
    expect(result.connected).toBe(false);
    expect(result.error).toBe('User rejected.');
  });
});
