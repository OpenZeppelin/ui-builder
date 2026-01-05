import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { StellarNetworkConfig } from '@openzeppelin/ui-types';

// T004: Unit test for contract type detection (SAC vs Wasm)

const getLedgerEntriesMock = vi.fn();
const serverCtorMock = vi.fn(() => ({ getLedgerEntries: getLedgerEntriesMock }));
const contractFootprintMock = vi.fn(() => 'mock-footprint');
const contractCtorMock = vi.fn(() => ({ getFootprint: contractFootprintMock }));

const createLedgerEntry = (executableName: string) => ({
  contractData: () => ({
    val: () => ({
      instance: () => ({
        executable: () => ({
          switch: () => ({ name: executableName }),
        }),
      }),
    }),
  }),
});

type MockLedgerEntry = {
  val: ReturnType<typeof createLedgerEntry>;
};

const createLedgerEntriesResponse = (executableName: string) => ({
  entries: [{ val: createLedgerEntry(executableName) }] as MockLedgerEntry[],
});

vi.mock('@stellar/stellar-sdk', () => ({
  Contract: contractCtorMock,
  rpc: {
    Server: serverCtorMock,
  },
  xdr: {
    ContractExecutableType: {
      contractExecutableWasm: () => ({ name: 'contractExecutableWasm' }),
      contractExecutableStellarAsset: () => ({ name: 'contractExecutableStellarAsset' }),
    },
  },
}));

vi.mock('@openzeppelin/ui-utils', () => ({
  logger: {
    error: vi.fn(),
  },
  userRpcConfigService: {
    getUserRpcConfig: vi.fn(() => undefined),
  },
}));

describe('contract/type-detection', () => {
  const baseNetworkConfig: StellarNetworkConfig = {
    ecosystem: 'stellar',
    id: 'stellar-testnet',
    name: 'Stellar Testnet',
    network: 'stellar',
    type: 'testnet',
    isTestnet: true,
    exportConstName: 'STELLAR_TESTNET',
    sorobanRpcUrl: 'https://soroban.example/rpc',
    horizonUrl: 'https://horizon.stellar.example',
    networkPassphrase: 'Test SDF Network ; September 2015',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('detects SAC via RPC executable type', async () => {
    getLedgerEntriesMock.mockResolvedValue(
      createLedgerEntriesResponse('contractExecutableStellarAsset')
    );

    const { getStellarContractType } = await import('../../src/contract/type');

    const result = await getStellarContractType('CCONTRACTID', baseNetworkConfig);

    expect(result).toBe('contractExecutableStellarAsset');
    expect(serverCtorMock).toHaveBeenCalledWith('https://soroban.example/rpc', {
      allowHttp: false,
    });
    expect(getLedgerEntriesMock).toHaveBeenCalledWith('mock-footprint');
  });

  it('detects Wasm executable type', async () => {
    getLedgerEntriesMock.mockResolvedValue(createLedgerEntriesResponse('contractExecutableWasm'));

    const { getStellarContractType } = await import('../../src/contract/type');

    const result = await getStellarContractType('CCONTRACTID2', baseNetworkConfig);

    expect(result).toBe('contractExecutableWasm');
  });

  it('returns null when executable type is unsupported', async () => {
    getLedgerEntriesMock.mockResolvedValue(createLedgerEntriesResponse('unknownExecutable'));

    const { getStellarContractType } = await import('../../src/contract/type');

    const result = await getStellarContractType('CCONTRACTID3', baseNetworkConfig);

    expect(result).toBeNull();
  });

  it('throws a friendly error when RPC call fails', async () => {
    getLedgerEntriesMock.mockRejectedValue(new Error('RPC failed'));

    const { getStellarContractType } = await import('../../src/contract/type');

    await expect(getStellarContractType('CCONTRACTID4', baseNetworkConfig)).rejects.toThrow(
      'Something went wrong getting contract type by contract ID. RPC failed'
    );
  });
});
