import { describe, expect, it, vi } from 'vitest';

import {
  loadEvmContract,
  type EvmContractArtifacts,
  type TypedEvmNetworkConfig,
} from '@openzeppelin/ui-builder-adapter-evm-core';

describe('EVM provider timeouts', () => {
  it('moves to next provider when the first provider exceeds per-provider timeout', async () => {
    const mockFetch = vi.fn();
    // Simulate a slow Etherscan response (exceeds 4s) followed by a fast Sourcify success
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
      json: async () => ({ abi: [], metadata: { output: { abi: [] } }, contractName: 'C' }),
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
    expect(result.source).toBe('fetched');
    expect(result.metadata?.fetchedFrom).toContain('sourcify');

    vi.restoreAllMocks();
  });
});
