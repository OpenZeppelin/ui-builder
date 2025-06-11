import {
  type DAppConnectorAPI,
  type DAppConnectorWalletAPI,
} from '@midnight-ntwrk/dapp-connector-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as implementation from '../midnight-implementation';

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
  beforeEach(() => {
    // @ts-expect-error - We are intentionally overwriting the global window for tests
    global.window = {
      midnight: {
        mnLace: mockLace,
      },
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore the original window object
    global.window = originalWindow;
    implementation.disconnect();
  });

  it('should call the enable method on the Lace wallet API', async () => {
    const api = await implementation.connect();
    expect(mockLace.enable).toHaveBeenCalledTimes(1);
    expect(api).toBe(mockApi);
  });

  it('should throw an error if the wallet is not found', async () => {
    // @ts-expect-error - We are deleting a property from the mock window for this test case
    delete global.window.midnight.mnLace;
    await expect(implementation.connect()).rejects.toThrow('Lace wallet not found.');
  });

  it('should re-throw an error if the connection is rejected', async () => {
    const rejectionError = new Error('User rejected.');
    vi.spyOn(mockLace, 'enable').mockRejectedValueOnce(rejectionError);
    await expect(implementation.connect()).rejects.toThrow(rejectionError);
  });
});
