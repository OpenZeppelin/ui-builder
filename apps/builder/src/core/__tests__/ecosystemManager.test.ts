import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PolkadotNetworkConfig } from '@openzeppelin/ui-types';

import { getAdapter, getRuntime } from '../ecosystemManager';

const { mockMoonbeamNetwork, mockLegacyCreateAdapter } = vi.hoisted(() => ({
  mockMoonbeamNetwork: {
    id: 'polkadot-moonbeam-mainnet',
    name: 'Moonbeam',
    exportConstName: 'moonbeamMainnet',
    ecosystem: 'polkadot',
    network: 'moonbeam',
    type: 'mainnet',
    isTestnet: false,
    executionType: 'evm',
    networkCategory: 'parachain',
    chainId: 1284,
    rpcUrl: 'https://rpc.example.invalid',
    nativeCurrency: {
      name: 'Glimmer',
      symbol: 'GLMR',
      decimals: 18,
    },
  },
  mockLegacyCreateAdapter: vi.fn(),
}));

vi.mock('@openzeppelin/adapter-evm/metadata', () => ({
  ecosystemMetadata: { ecosystem: 'evm' },
}));

vi.mock('@openzeppelin/adapter-midnight/metadata', () => ({
  ecosystemMetadata: { ecosystem: 'midnight' },
}));

vi.mock('@openzeppelin/adapter-polkadot/metadata', () => ({
  ecosystemMetadata: { ecosystem: 'polkadot' },
}));

vi.mock('@openzeppelin/adapter-solana/metadata', () => ({
  ecosystemMetadata: { ecosystem: 'solana' },
}));

vi.mock('@openzeppelin/adapter-stellar/metadata', () => ({
  ecosystemMetadata: { ecosystem: 'stellar' },
}));

vi.mock('@openzeppelin/adapter-polkadot', () => ({
  ecosystemDefinition: {
    ecosystem: 'polkadot',
    networks: [mockMoonbeamNetwork],
    createAdapter: mockLegacyCreateAdapter,
  },
}));

const networkConfig = mockMoonbeamNetwork as PolkadotNetworkConfig;

function createLegacyAdapter() {
  return {
    networkConfig,
    dispose: vi.fn(),
    isValidAddress: vi.fn(() => true),
    getExplorerUrl: vi.fn(() => 'https://moonbeam.explorer/address/0x123'),
    getExplorerTxUrl: vi.fn(() => 'https://moonbeam.explorer/tx/0xabc'),
    getUiLabels: vi.fn(() => ({ connectWallet: 'Connect wallet' })),
    loadContract: vi.fn(),
    getContractDefinitionInputs: vi.fn(() => []),
    getWritableFunctions: vi.fn(() => []),
    isViewFunction: vi.fn(() => false),
    mapParameterTypeToFieldType: vi.fn(() => 'text'),
    getCompatibleFieldTypes: vi.fn(() => []),
    generateDefaultField: vi.fn(() => ({ type: 'text' })),
    getTypeMappingInfo: vi.fn(() => ({})),
    queryViewFunction: vi.fn(),
    formatFunctionResult: vi.fn(() => ''),
    getCurrentBlock: vi.fn(async () => 123),
    formatTransactionData: vi.fn(async () => ({ calldata: '0x' })),
    signAndBroadcast: vi.fn(async () => ({ txHash: '0xabc' })),
    getSupportedExecutionMethods: vi.fn(() => ['wallet']),
    validateExecutionConfig: vi.fn(async () => true),
    supportsWalletConnection: vi.fn(function (this: { networkConfig: PolkadotNetworkConfig }) {
      return this.networkConfig.id === networkConfig.id;
    }),
    getAvailableConnectors: vi.fn(async () => []),
    connectWallet: vi.fn(async () => ({ connected: true, address: '0x123' })),
    disconnectWallet: vi.fn(async () => ({ disconnected: true })),
    getWalletConnectionStatus: vi.fn(() => ({
      status: 'disconnected',
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      isReconnecting: false,
    })),
    getAvailableUiKits: vi.fn(async () => [{ name: 'rainbowkit' }]),
    configureUiKit: vi.fn(async () => undefined),
    getRelayers: vi.fn(async () => []),
    getRelayer: vi.fn(async () => ({ id: 'relayer-1' })),
    getNetworkServiceForms: vi.fn(() => []),
    getDefaultServiceConfig: vi.fn(() => ({})),
  };
}

describe('ecosystemManager legacy runtime fallback', () => {
  beforeEach(() => {
    mockLegacyCreateAdapter.mockReset();
  });

  it('wraps legacy createAdapter exports into a composer runtime', async () => {
    const legacyAdapter = createLegacyAdapter();
    mockLegacyCreateAdapter.mockReturnValue(legacyAdapter);

    const runtime = await getRuntime(networkConfig);

    expect(mockLegacyCreateAdapter).toHaveBeenCalledWith(networkConfig);
    expect(runtime.networkConfig).toBe(networkConfig);
    expect(runtime.networkCatalog.getNetworks()).toEqual([networkConfig]);
    expect(runtime.wallet.supportsWalletConnection()).toBe(true);
    expect(legacyAdapter.supportsWalletConnection).toHaveBeenCalledTimes(1);
    expect(await runtime.uiKit.getAvailableUiKits()).toEqual([{ name: 'rainbowkit' }]);

    runtime.dispose();

    expect(legacyAdapter.dispose).toHaveBeenCalledTimes(1);
  });

  it('builds a flattened builder adapter from the legacy runtime bridge', async () => {
    const legacyAdapter = createLegacyAdapter();
    mockLegacyCreateAdapter.mockReturnValue(legacyAdapter);

    const adapter = await getAdapter(networkConfig);

    expect(adapter.getNetworks()).toEqual([networkConfig]);
    expect(adapter.supportsWalletConnection()).toBe(true);
    expect(legacyAdapter.supportsWalletConnection).toHaveBeenCalledTimes(1);
  });
});
