import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MidnightAdapter } from '../adapter';
import { midnightTestnet } from '../networks/testnet';
import * as connection from '../wallet/connection';

vi.mock('../wallet/connection', () => {
  const supportsMidnightWalletConnection = vi.fn().mockReturnValue(true);
  const getMidnightAvailableConnectors = vi
    .fn()
    .mockResolvedValue([{ id: 'mnLace', name: 'Lace (Midnight)' }]);
  const disconnectMidnightWallet = vi.fn().mockResolvedValue({ disconnected: true });
  const getMidnightWalletConnectionStatus = vi
    .fn()
    .mockReturnValue({ isConnected: true, address: 'ct1qtestaddress', status: 'connected' });

  return {
    supportsMidnightWalletConnection,
    getMidnightAvailableConnectors,
    disconnectMidnightWallet,
    getMidnightWalletConnectionStatus,
  };
});

describe('MidnightAdapter Wallet Connection', () => {
  const networkConfig = midnightTestnet;
  let adapter: MidnightAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new MidnightAdapter(networkConfig);
  });

  it('supports wallet connection when Lace is available', () => {
    expect(adapter.supportsWalletConnection()).toBe(true);
  });

  it('returns available connectors (Lace)', async () => {
    const connectors = await adapter.getAvailableConnectors();
    expect(Array.isArray(connectors)).toBe(true);
    expect(connectors[0]).toEqual({ id: 'mnLace', name: 'Lace (Midnight)' });
  });

  it('connectWallet is not supported (use ConnectButton path)', async () => {
    const result = await adapter.connectWallet('mnLace');
    expect(result.connected).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('disconnects wallet via connection facade', async () => {
    const res = await adapter.disconnectWallet();
    expect(res.disconnected).toBe(true);
    // Narrow the type to access the mocked function without using 'any'
    const mocked = connection as unknown as {
      disconnectMidnightWallet: (...args: unknown[]) => unknown;
    };
    expect(mocked.disconnectMidnightWallet).toHaveBeenCalledTimes(1);
  });

  it('maps wallet connection status and injects chainId', () => {
    const status = adapter.getWalletConnectionStatus();
    expect(status.isConnected).toBe(true);
    expect(status.address).toBe('ct1qtestaddress');
    expect(status.chainId).toBe(networkConfig.id);
  });

  it('exposes provider root, hooks facade, and wallet components', () => {
    const Provider = adapter.getEcosystemReactUiContextProvider();
    const hooks = adapter.getEcosystemReactHooks();
    const components = adapter.getEcosystemWalletComponents();

    expect(typeof Provider).toBe('function');
    expect(hooks).toBeDefined();
    const typedHooks = hooks as { useAccount?: unknown } | undefined;
    expect(typeof (typedHooks?.useAccount as unknown as () => unknown)).toBe('function');
    expect(components).toBeDefined();
    const typedComponents = components as
      | { ConnectButton?: unknown; AccountDisplay?: unknown }
      | undefined;
    expect(typeof (typedComponents?.ConnectButton as unknown as () => unknown)).toBe('function');
    expect(typeof (typedComponents?.AccountDisplay as unknown as () => unknown)).toBe('function');
  });
});
