import type { xdr } from '@stellar/stellar-sdk';
import { describe, expect, it, vi } from 'vitest';

import type { StellarNetworkConfig } from '@openzeppelin/ui-types';

// T006: Integration test for loader returning SAC schema

const getStellarContractTypeMock = vi.fn();
const getSacSpecArtifactsMock = vi.fn();

vi.mock('../../src/contract/type', () => ({
  getStellarContractType: getStellarContractTypeMock,
}));

vi.mock('../../src/sac/spec-cache', () => ({
  getSacSpecArtifacts: getSacSpecArtifactsMock,
}));

vi.mock('@stellar/stellar-sdk', () => ({
  StrKey: {
    isValidContract: vi.fn(() => true),
  },
  contract: {
    Spec: vi.fn(() => ({
      funcs: () => [],
    })),
  },
}));

describe('contract/loader SAC path', () => {
  it('returns functions for SAC when contract type is SAC', async () => {
    getStellarContractTypeMock.mockResolvedValue('contractExecutableStellarAsset');
    const mockSpecEntries: xdr.ScSpecEntry[] = [{} as unknown as xdr.ScSpecEntry];
    getSacSpecArtifactsMock.mockResolvedValue({
      base64Entries: ['base64-entry'],
      specEntries: mockSpecEntries,
    });

    const { loadStellarContractFromAddress } = await import('../../src/contract/loader');

    const networkConfig: StellarNetworkConfig = {
      ecosystem: 'stellar',
      id: 'stellar-testnet',
      name: 'Testnet',
      network: 'stellar',
      type: 'testnet',
      isTestnet: true,
      exportConstName: 'STELLAR_TESTNET',
      sorobanRpcUrl: 'https://rpc.test',
      horizonUrl: 'https://horizon.stellar.org',
      networkPassphrase: 'Testnet Passphrase',
    };

    const schema = await loadStellarContractFromAddress('CCONTRACTID', networkConfig);

    expect(getStellarContractTypeMock).toHaveBeenCalledWith('CCONTRACTID', expect.any(Object));
    expect(getSacSpecArtifactsMock).toHaveBeenCalled();
    expect(schema).toEqual({
      name: expect.stringContaining('Stellar Asset Contract'),
      ecosystem: 'stellar',
      functions: [],
      metadata: {
        specEntries: mockSpecEntries,
      },
    });
  });
});
