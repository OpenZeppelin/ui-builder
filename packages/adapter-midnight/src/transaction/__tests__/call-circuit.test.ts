import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { callCircuit } from '../call-circuit';

describe('callCircuit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should proceed with SDK call even when private state is missing (SDK will handle validation)', async () => {
    const mockSubmitCallTx = vi.fn().mockRejectedValue(
      new Error('No private state found at private state ID')
    );

    vi.doMock('@midnight-ntwrk/midnight-js-contracts', () => ({
      submitCallTx: mockSubmitCallTx,
    }));

    const mockProviders = {
      privateStateProvider: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn(),
      },
      publicDataProvider: {},
      walletProvider: {
        coinPublicKey: '0x1234',
        encryptionPublicKey: '0x5678',
      },
      proofProvider: {},
      zkConfigProvider: {},
      midnightProvider: {},
    };

    const params = {
      contractInstance: { impureCircuits: { testCircuit: () => {} } },
      providers: mockProviders as unknown as MidnightProviders,
      contractAddress: '0200d9e0014c52f716d21fb76ac32333c7ca78f677f4cd8555cddaf25f1761c06991',
      circuitId: 'testCircuit',
      privateStateId: 'test-state-id',
      args: [],
    };

    // Should proceed to SDK call and get mapped error from SDK
    await expect(callCircuit(params)).rejects.toThrow(
      /Private state not initialized or organizer secret key missing/
    );

    // Verify privateStateProvider was checked
    expect(mockProviders.privateStateProvider.get).toHaveBeenCalledWith('test-state-id');
    // Verify SDK was actually called (not failed preemptively)
    expect(mockSubmitCallTx).toHaveBeenCalled();
  });

  it('should include privateStateId when calling submitCallTx if private state is present', async () => {
    const mockSubmitCallTx = vi.fn().mockResolvedValue({
      txHash: '0xabc123',
      public: { txHash: '0xabc123' },
      private: { nextPrivateState: { some: 'state' } },
    });

    vi.doMock('@midnight-ntwrk/midnight-js-contracts', () => ({
      submitCallTx: mockSubmitCallTx,
    }));

    const mockProviders = {
      privateStateProvider: {
        get: vi.fn().mockResolvedValue({ organizerSecretKey: new Uint8Array(32) }),
        set: vi.fn(),
      },
      publicDataProvider: {},
      walletProvider: {
        coinPublicKey: '0x1234',
        encryptionPublicKey: '0x5678',
      },
      proofProvider: {},
      zkConfigProvider: {},
      midnightProvider: {},
    };

    const mockContract = {
      impureCircuits: {
        testCircuit: vi.fn(),
      },
    };

    const params = {
      contractInstance: mockContract,
      providers: mockProviders as unknown as MidnightProviders,
      contractAddress: '0200d9e0014c52f716d21fb76ac32333c7ca78f677f4cd8555cddaf25f1761c06991',
      circuitId: 'testCircuit',
      privateStateId: 'test-state-id',
      args: ['arg1'],
    };

    // Override to mock the dynamic import
    const result = await callCircuit(params);

    expect(result.txHash).toBe('0xabc123');
    expect(mockProviders.privateStateProvider.get).toHaveBeenCalledWith('test-state-id');
  });

  it('should persist updated private state after successful circuit call', async () => {
    const mockSubmitCallTx = vi.fn().mockResolvedValue({
      txHash: '0xdef456',
      public: { txHash: '0xdef456' },
      private: { nextPrivateState: { updated: 'state' } },
    });

    vi.doMock('@midnight-ntwrk/midnight-js-contracts', () => ({
      submitCallTx: mockSubmitCallTx,
    }));

    const mockProviders = {
      privateStateProvider: {
        get: vi.fn().mockResolvedValue({ organizerSecretKey: new Uint8Array(32) }),
        set: vi.fn(),
      },
      publicDataProvider: {},
      walletProvider: {
        coinPublicKey: '0x1234',
        encryptionPublicKey: '0x5678',
      },
      proofProvider: {},
      zkConfigProvider: {},
      midnightProvider: {},
    };

    const mockContract = {
      impureCircuits: {
        setName: vi.fn(),
      },
    };

    const params = {
      contractInstance: mockContract,
      providers: mockProviders as unknown as MidnightProviders,
      contractAddress: '0200d9e0014c52f716d21fb76ac32333c7ca78f677f4cd8555cddaf25f1761c06991',
      circuitId: 'setName',
      privateStateId: 'kitchensink_v1',
      args: ['newName'],
    };

    const result = await callCircuit(params);

    expect(result.txHash).toBe('0xdef456');
    expect(mockProviders.privateStateProvider.set).toHaveBeenCalledWith('kitchensink_v1', {
      updated: 'state',
    });
  });
});
