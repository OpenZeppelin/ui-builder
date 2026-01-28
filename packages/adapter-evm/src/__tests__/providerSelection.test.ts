import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  loadEvmContract,
  type EvmContractArtifacts,
  type TypedEvmNetworkConfig,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import { appConfigService, userNetworkServiceConfigService } from '@openzeppelin/ui-utils';

describe('EVM provider selection (etherscan → sourcify, forced/app/ui precedence)', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    // Initialize app config with empty defaults for deterministic behavior
    vi.spyOn(appConfigService, 'initialize').mockResolvedValue();
    // Reset user network service config
    vi.spyOn(userNetworkServiceConfigService, 'get').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tries Etherscan first (V2) when supported (adapter default)', async () => {
    const network: TypedEvmNetworkConfig = {
      id: 'ethereum-mainnet',
      name: 'Ethereum',
      network: 'mainnet',
      type: 'mainnet',
      isTestnet: false,
      explorerUrl: 'https://etherscan.io',
      apiUrl: 'https://api.etherscan.io/v2/api',
      supportsEtherscanV2: true,
      primaryExplorerApiIdentifier: 'etherscan-v2',
      chainId: 1,
    } as unknown as TypedEvmNetworkConfig;

    // Simulate Etherscan V2 ABI success (returns JSON {status:'1', result:'[ ... ]'})
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: '1', result: '[]' }),
    });

    const artifacts: EvmContractArtifacts = {
      contractAddress: '0x0000000000000000000000000000000000000001',
    };
    const result = await loadEvmContract(artifacts, network);

    expect(result.source).toBe('fetched');
    expect(result.schema).toBeDefined();
  });

  it('falls back to Sourcify when Etherscan times out or fails', async () => {
    const network: TypedEvmNetworkConfig = {
      id: 'ethereum-mainnet',
      name: 'Ethereum',
      network: 'mainnet',
      type: 'mainnet',
      isTestnet: false,
      explorerUrl: 'https://etherscan.io',
      apiUrl: 'https://api.etherscan.io/v2/api',
      supportsEtherscanV2: true,
      primaryExplorerApiIdentifier: 'etherscan-v2',
      chainId: 1,
    } as unknown as TypedEvmNetworkConfig;

    // First call: Etherscan V2 returns non-ok immediately (triggers move to next provider)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 504,
      statusText: 'Gateway Timeout',
    } as Response);

    // Second call: Simulate Sourcify success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ abi: [], metadata: { contractName: 'C', output: { abi: [] } } }),
    });

    const artifacts: EvmContractArtifacts = {
      contractAddress: '0x0000000000000000000000000000000000000001',
    };
    const result = await loadEvmContract(artifacts, network);
    expect(result.source).toBe('fetched');
    expect(result.metadata?.fetchedFrom).toBe(
      'https://repo.sourcify.dev/1/0x0000000000000000000000000000000000000001'
    );
  });

  it('enforces per-provider timeout before moving to next provider', async () => {
    const network: TypedEvmNetworkConfig = {
      id: 'ethereum-mainnet',
      name: 'Ethereum',
      network: 'mainnet',
      type: 'mainnet',
      isTestnet: false,
      explorerUrl: 'https://etherscan.io',
      apiUrl: 'https://api.etherscan.io/v2/api',
      supportsEtherscanV2: true,
      primaryExplorerApiIdentifier: 'etherscan-v2',
    } as unknown as TypedEvmNetworkConfig;

    // Simulate hanging Etherscan response; test will require AbortController in impl
    mockFetch.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: false } as Response), 6000))
    );

    const artifacts: EvmContractArtifacts = {
      contractAddress: '0x0000000000000000000000000000000000000001',
    };
    await expect(loadEvmContract(artifacts, network)).rejects.toBeDefined();
  });

  it('honors forced service and does not fallback on failure', async () => {
    const network: TypedEvmNetworkConfig = {
      id: 'ethereum-mainnet',
      name: 'Ethereum',
      network: 'mainnet',
      type: 'mainnet',
      isTestnet: false,
      explorerUrl: 'https://etherscan.io',
      apiUrl: 'https://api.etherscan.io/v2/api',
      supportsEtherscanV2: true,
      primaryExplorerApiIdentifier: 'etherscan-v2',
      chainId: 1,
    } as unknown as TypedEvmNetworkConfig;

    // Force sourcify via artifacts and make it fail
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });

    const artifacts: EvmContractArtifacts = {
      contractAddress: '0x0000000000000000000000000000000000000001',
      __forcedProvider: 'sourcify' as unknown as 'sourcify',
    };
    await expect(loadEvmContract(artifacts, network)).rejects.toBeDefined();
  });

  it('uses UI default provider first when set in user config', async () => {
    const network: TypedEvmNetworkConfig = {
      id: 'ethereum-mainnet',
      name: 'Ethereum',
      network: 'mainnet',
      type: 'mainnet',
      isTestnet: false,
      explorerUrl: 'https://etherscan.io',
      apiUrl: 'https://api.etherscan.io/v2/api',
      supportsEtherscanV2: true,
      primaryExplorerApiIdentifier: 'etherscan-v2',
      chainId: 1,
    } as unknown as TypedEvmNetworkConfig;

    // Reset mock to ensure clean state
    mockFetch.mockReset();

    // Mock the new service config service to return sourcify as default provider
    vi.spyOn(userNetworkServiceConfigService, 'get').mockImplementation((networkId, serviceId) => {
      if (networkId === 'ethereum-mainnet' && serviceId === 'contract-definitions') {
        return { defaultProvider: 'sourcify' };
      }
      return null;
    });

    // Mock fetch for Sourcify API call (should be the first and only call since it succeeds)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ abi: [], metadata: { contractName: 'C', output: { abi: [] } } }),
    } as Response);

    const artifacts: EvmContractArtifacts = {
      contractAddress: '0x0000000000000000000000000000000000000001',
    };
    const result = await loadEvmContract(artifacts, network);
    expect(result.metadata?.fetchedFrom).toContain('sourcify');
  });

  it('uses app-config default provider when UI default is not set', async () => {
    const network: TypedEvmNetworkConfig = {
      id: 'ethereum-mainnet',
      name: 'Ethereum',
      network: 'mainnet',
      type: 'mainnet',
      isTestnet: false,
      explorerUrl: 'https://etherscan.io',
      apiUrl: 'https://api.etherscan.io/v2/api',
      supportsEtherscanV2: true,
      primaryExplorerApiIdentifier: 'etherscan-v2',
      chainId: 1,
    } as unknown as TypedEvmNetworkConfig;

    // Mock userNetworkServiceConfigService to return null (no UI default)
    vi.spyOn(userNetworkServiceConfigService, 'get').mockReturnValue(null);
    vi.spyOn(appConfigService, 'getGlobalServiceParam').mockReturnValue('sourcify');

    // First provider per app default: sourcify
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ abi: [], metadata: { contractName: 'C', output: { abi: [] } } }),
    });

    const artifacts: EvmContractArtifacts = {
      contractAddress: '0x0000000000000000000000000000000000000001',
    };
    const result = await loadEvmContract(artifacts, network);
    expect(result.metadata?.fetchedFrom).toContain('sourcify');
  });
});
