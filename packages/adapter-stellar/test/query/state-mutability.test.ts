import { xdr } from '@stellar/stellar-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StellarNetworkConfig } from '@openzeppelin/ui-types';

const simulateTransactionMock = vi.fn();

vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    BASE_FEE: '100',
    Contract: vi.fn(() => ({
      call: () => ({}),
    })),
    Address: {
      fromString: vi.fn(() => true),
    },
    Account: vi.fn(() => ({})),
    TransactionBuilder: vi.fn(() => ({
      addOperation: vi.fn().mockReturnThis(),
      setTimeout: vi.fn().mockReturnThis(),
      build: vi.fn(() => ({ toXDR: () => 'mock-xdr' })),
    })),
    nativeToScVal: vi.fn((value: unknown) => value),
    rpc: {
      Server: vi.fn(() => ({
        simulateTransaction: simulateTransactionMock,
      })),
      Api: {
        isSimulationError: () => false,
      },
    },
  };
});

vi.mock('@openzeppelin/ui-utils', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  userRpcConfigService: {
    getUserRpcConfig: vi.fn(() => undefined),
  },
}));

vi.mock('../../src/utils', () => ({
  convertStellarTypeToScValType: vi.fn((type: string) => type),
}));

const CONTRACT_ADDRESS = 'CDXBAC2SN6DR67PWHP45KIG2A2AY7EC2O2H4IIW4GR3NQP7AY37RKJU5';

const NETWORK_CONFIG: StellarNetworkConfig = {
  ecosystem: 'stellar',
  id: 'stellar-testnet',
  name: 'Stellar Testnet',
  network: 'stellar',
  type: 'testnet',
  isTestnet: true,
  exportConstName: 'STELLAR_TESTNET',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
};

// stellar-base XDR types expect Opaque[]/Hash which doesn't match Node Buffer in newer TS
/* eslint-disable @typescript-eslint/no-explicit-any */
const dummyHash = Buffer.alloc(32, 0) as any;
const dummyContractAddr = xdr.ScAddress.scAddressTypeContract(Buffer.alloc(32, 1) as any);
/* eslint-enable @typescript-eslint/no-explicit-any */

function makeContractCodeKey(): xdr.LedgerKey {
  return xdr.LedgerKey.contractCode(new xdr.LedgerKeyContractCode({ hash: dummyHash }));
}

function makeContractInstanceKey(): xdr.LedgerKey {
  return xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: dummyContractAddr,
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
    })
  );
}

function makeStorageDataKey(keySymbol: string): xdr.LedgerKey {
  return xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: dummyContractAddr,
      key: xdr.ScVal.scvSymbol(keySymbol),
      durability: xdr.ContractDataDurability.persistent(),
    })
  );
}

describe('checkStellarFunctionStateMutability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false (read-only) when only infrastructure state changes are present', async () => {
    simulateTransactionMock.mockResolvedValue({
      stateChanges: [
        { type: 2, key: makeContractCodeKey(), before: null, after: null },
        { type: 2, key: makeContractInstanceKey(), before: null, after: null },
      ],
    });

    const { checkStellarFunctionStateMutability } = await import('../../src/query/handler');

    const modifiesState = await checkStellarFunctionStateMutability(
      CONTRACT_ADDRESS,
      'owner',
      NETWORK_CONFIG,
      []
    );

    expect(modifiesState).toBe(false);
  });

  it('returns true when actual storage changes are present alongside infrastructure changes', async () => {
    simulateTransactionMock.mockResolvedValue({
      stateChanges: [
        { type: 2, key: makeContractCodeKey(), before: null, after: null },
        { type: 2, key: makeContractInstanceKey(), before: null, after: null },
        { type: 2, key: makeStorageDataKey('Balance'), before: null, after: null },
      ],
    });

    const { checkStellarFunctionStateMutability } = await import('../../src/query/handler');

    const modifiesState = await checkStellarFunctionStateMutability(
      CONTRACT_ADDRESS,
      'stake',
      NETWORK_CONFIG,
      ['Address', 'I128']
    );

    expect(modifiesState).toBe(true);
  });

  it('returns false when stateChanges is empty', async () => {
    simulateTransactionMock.mockResolvedValue({
      stateChanges: [],
    });

    const { checkStellarFunctionStateMutability } = await import('../../src/query/handler');

    const modifiesState = await checkStellarFunctionStateMutability(
      CONTRACT_ADDRESS,
      'greeting',
      NETWORK_CONFIG,
      []
    );

    expect(modifiesState).toBe(false);
  });

  it('returns false when stateChanges is undefined', async () => {
    simulateTransactionMock.mockResolvedValue({});

    const { checkStellarFunctionStateMutability } = await import('../../src/query/handler');

    const modifiesState = await checkStellarFunctionStateMutability(
      CONTRACT_ADDRESS,
      'paused',
      NETWORK_CONFIG,
      []
    );

    expect(modifiesState).toBe(false);
  });

  it('returns true when only real contract data changes are present (no infrastructure)', async () => {
    simulateTransactionMock.mockResolvedValue({
      stateChanges: [{ type: 1, key: makeStorageDataKey('Greeting'), before: null, after: null }],
    });

    const { checkStellarFunctionStateMutability } = await import('../../src/query/handler');

    const modifiesState = await checkStellarFunctionStateMutability(
      CONTRACT_ADDRESS,
      'set_greeting',
      NETWORK_CONFIG,
      ['String']
    );

    expect(modifiesState).toBe(true);
  });

  it('returns true when simulation fails (safe default)', async () => {
    simulateTransactionMock.mockRejectedValue(new Error('RPC timeout'));

    const { checkStellarFunctionStateMutability } = await import('../../src/query/handler');

    const modifiesState = await checkStellarFunctionStateMutability(
      CONTRACT_ADDRESS,
      'unknown_fn',
      NETWORK_CONFIG,
      []
    );

    expect(modifiesState).toBe(true);
  });
});
