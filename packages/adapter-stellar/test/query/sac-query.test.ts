import type { xdr } from '@stellar/stellar-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContractSchema } from '@openzeppelin/ui-types';

// T007: Integration test for SAC query flow

const simulateTransactionMock = vi.fn();
const transactionAddOperationMock = vi.fn().mockReturnThis();
const transactionSetTimeoutMock = vi.fn().mockReturnThis();
const transactionBuildMock = vi.fn(() => ({ toXDR: () => 'mock-xdr' }));

const parseStellarInputMock = vi.fn((value) => value);
const formatStellarFunctionResultMock = vi.fn((_rawResult) => ({ result_0: _rawResult.value }));
const convertTypeMock = vi.fn((type) => type);
const isViewFunctionMock = vi.fn(() => true);
const nativeToScValMock = vi.fn((value) => value);

vi.mock('@stellar/stellar-sdk', () => ({
  BASE_FEE: '100',
  Contract: vi.fn(() => ({
    call: () => ({}),
  })),
  Address: {
    fromString: vi.fn(() => true),
  },
  Account: vi.fn(() => ({})),
  Keypair: { random: () => ({ publicKey: () => 'GABC' }) },
  TransactionBuilder: vi.fn(() => ({
    addOperation: transactionAddOperationMock,
    setTimeout: transactionSetTimeoutMock,
    build: transactionBuildMock,
  })),
  nativeToScVal: nativeToScValMock,
  rpc: {
    Server: vi.fn(() => ({
      simulateTransaction: simulateTransactionMock,
    })),
    Api: {
      isSimulationError: () => false,
    },
  },
}));

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

vi.mock('../../src/transform', () => ({
  parseStellarInput: parseStellarInputMock,
}));

vi.mock('../../src/transform/output-formatter', () => ({
  formatStellarFunctionResult: formatStellarFunctionResultMock,
}));

vi.mock('../../src/utils', () => ({
  convertStellarTypeToScValType: convertTypeMock,
}));

vi.mock('../../src/query/view-checker', () => ({
  isStellarViewFunction: isViewFunctionMock,
}));

describe('query/sac-query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('simulates and formats view result for SAC function', async () => {
    simulateTransactionMock.mockResolvedValue({
      result: {
        retval: { type: 'i128', value: '1000' },
      },
      stateChanges: [],
    });

    const { queryStellarViewFunction } = await import('../../src/query/handler');

    const contractSchema: ContractSchema = {
      ecosystem: 'stellar',
      functions: [
        {
          id: 'get_balance_StellarAsset',
          name: 'get_balance',
          displayName: 'Get Balance',
          inputs: [],
          outputs: [{ name: 'result_0', type: 'I128' }],
          type: 'function',
          stateMutability: 'view',
          modifiesState: false,
        },
      ],
      metadata: {
        specEntries: [] as xdr.ScSpecEntry[],
      },
    };

    const result = await queryStellarViewFunction(
      'CCONTRACTID',
      'get_balance_StellarAsset',
      {
        ecosystem: 'stellar',
        id: 'stellar-testnet',
        name: 'Testnet',
        network: 'stellar',
        type: 'testnet',
        isTestnet: true,
        exportConstName: 'STELLAR_TESTNET',
        sorobanRpcUrl: 'https://rpc.test',
        horizonUrl: 'https://horizon.stellar.org',
        networkPassphrase: 'Test',
      },
      [],
      contractSchema
    );

    expect(result).toEqual({ result_0: '1000' });
    expect(simulateTransactionMock).toHaveBeenCalled();
    expect(isViewFunctionMock).toHaveBeenCalled();
  });
});
