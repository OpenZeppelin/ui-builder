import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComposerEcosystemRuntime, PolkadotNetworkConfig } from '@openzeppelin/ui-types';

import { getRuntime } from '../ecosystemManager';

const { mockMoonbeamNetwork, mockCreateRuntime } = vi.hoisted(() => ({
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
  mockCreateRuntime: vi.fn(),
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
    createRuntime: mockCreateRuntime,
  },
}));

const networkConfig = mockMoonbeamNetwork as PolkadotNetworkConfig;

function mkCap<T extends object>(
  extra: T
): T & { networkConfig: typeof networkConfig; dispose: () => void } {
  return {
    networkConfig,
    dispose: vi.fn(),
    ...extra,
  } as T & { networkConfig: typeof networkConfig; dispose: () => void };
}

function buildMockComposerRuntime(): ComposerEcosystemRuntime {
  return {
    networkConfig,
    dispose: vi.fn(),
    addressing: mkCap({ isValidAddress: vi.fn(() => true) }),
    explorer: mkCap({
      getExplorerUrl: vi.fn(() => null),
      getExplorerTxUrl: vi.fn(() => null),
    }),
    networkCatalog: mkCap({ getNetworks: vi.fn(() => [networkConfig]) }),
    uiLabels: mkCap({ getUiLabels: vi.fn(() => ({})) }),
    contractLoading: mkCap({
      loadContract: vi.fn(),
      getContractDefinitionInputs: vi.fn(() => []),
    }),
    schema: mkCap({
      getWritableFunctions: vi.fn(() => []),
      isViewFunction: vi.fn(() => false),
    }),
    typeMapping: mkCap({
      mapParameterTypeToFieldType: vi.fn(() => 'text'),
      getCompatibleFieldTypes: vi.fn(() => []),
      generateDefaultField: vi.fn(() => ({ type: 'text' })),
      getTypeMappingInfo: vi.fn(() => ({})),
    }),
    query: mkCap({
      queryViewFunction: vi.fn(),
      formatFunctionResult: vi.fn(() => ''),
      getCurrentBlock: vi.fn(async () => 123),
    }),
    execution: mkCap({
      formatTransactionData: vi.fn(() => ({})),
      signAndBroadcast: vi.fn(async () => ({ txHash: '0xabc' })),
      getSupportedExecutionMethods: vi.fn(async () => []),
      validateExecutionConfig: vi.fn(async () => true),
    }),
    wallet: mkCap({
      supportsWalletConnection: vi.fn(() => true),
      getAvailableConnectors: vi.fn(async () => []),
      connectWallet: vi.fn(async () => ({ connected: true })),
      disconnectWallet: vi.fn(async () => ({ disconnected: true })),
      getWalletConnectionStatus: vi.fn(() => ({
        isConnected: false,
        address: undefined,
        chainId: networkConfig.id,
      })),
    }),
    uiKit: mkCap({
      getAvailableUiKits: vi.fn(async () => [{ id: 'custom', name: 'Custom', configFields: [] }]),
      configureUiKit: vi.fn(async () => undefined),
    }),
    relayer: mkCap({
      getRelayers: vi.fn(async () => []),
      getRelayer: vi.fn(async () => ({})),
      getNetworkServiceForms: vi.fn(() => []),
      getDefaultServiceConfig: vi.fn(() => null),
    }),
  } as unknown as ComposerEcosystemRuntime;
}

describe('ecosystemManager getRuntime', () => {
  beforeEach(() => {
    mockCreateRuntime.mockReset();
    mockCreateRuntime.mockImplementation(() => buildMockComposerRuntime());
  });

  it('invokes adapter createRuntime for the composer profile', async () => {
    const runtime = await getRuntime(networkConfig);

    expect(mockCreateRuntime).toHaveBeenCalledWith('composer', networkConfig);
    expect(runtime.networkConfig).toBe(networkConfig);
    expect(runtime.networkCatalog.getNetworks()).toEqual([networkConfig]);
    expect(runtime.wallet.supportsWalletConnection()).toBe(true);

    runtime.dispose();
  });

  it('exposes capability methods on the composer runtime', async () => {
    const runtime = await getRuntime(networkConfig);

    expect(runtime.networkCatalog.getNetworks()).toEqual([networkConfig]);
    expect(runtime.wallet.supportsWalletConnection()).toBe(true);

    runtime.dispose();
  });
});
