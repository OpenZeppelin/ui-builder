import { describe, expect, it, vi } from 'vitest';

import {
  getEvmExplorerAddressUrl,
  loadEvmContract,
  type EvmContractArtifacts,
  type TypedEvmNetworkConfig,
} from '@openzeppelin/ui-builder-adapter-evm-core';

describe('EVM provenance links', () => {
  it('builds address URL from explorer config', () => {
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

    const url = getEvmExplorerAddressUrl('0x0000000000000000000000000000000000000001', network);
    expect(url).toBe('https://etherscan.io/address/0x0000000000000000000000000000000000000001');
  });

  it('sets fetchedFrom to Etherscan address when provider is Etherscan', async () => {
    // Mock Etherscan success
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: '1', result: '[]' }) });
    vi.stubGlobal('fetch', mockFetch);

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

    const artifacts: EvmContractArtifacts = {
      contractAddress: '0x0000000000000000000000000000000000000001',
    };
    const result = await loadEvmContract(artifacts, network);
    expect(result.metadata?.fetchedFrom).toBe(
      'https://etherscan.io/address/0x0000000000000000000000000000000000000001'
    );
    vi.restoreAllMocks();
  });

  it('sets fetchedFrom to Sourcify page when provider is Sourcify', async () => {
    // Mock Etherscan timeout and Sourcify success
    const mockFetch = vi.fn();
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ ok: false, status: 504, statusText: 'Gateway Timeout' } as Response),
            10
          )
        )
    );
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ abi: [], metadata: { contractName: 'C', output: { abi: [] } } }),
    });
    vi.stubGlobal('fetch', mockFetch);

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

    const artifacts: EvmContractArtifacts = {
      contractAddress: '0x0000000000000000000000000000000000000001',
    };
    const result = await loadEvmContract(artifacts, network);
    expect(result.metadata?.fetchedFrom).toBe(
      'https://repo.sourcify.dev/1/0x0000000000000000000000000000000000000001'
    );
    vi.restoreAllMocks();
  });
});
