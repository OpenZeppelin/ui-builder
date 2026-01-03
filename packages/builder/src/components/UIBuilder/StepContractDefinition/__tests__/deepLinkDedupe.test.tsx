import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContractAdapter, ContractSchema, FormValues } from '@openzeppelin/ui-types';

import { useContractDefinition } from '../../../../hooks/useContractDefinition';
import { uiBuilderStore } from '../../hooks/uiBuilderStore';

let mockAdapter: ContractAdapter;

vi.mock('@openzeppelin/ui-react', () => ({
  useWalletState: () => ({ activeAdapter: mockAdapter }),
}));

describe('Deep link auto-load deduplication', () => {
  const mockSchema: ContractSchema = {
    ecosystem: 'evm',
    functions: [],
    address: '0x2222222222222222222222222222222222222222',
  };

  let loadSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    uiBuilderStore.resetWizard();

    loadSpy = vi.fn().mockResolvedValue({
      schema: mockSchema,
      source: 'fetched',
      contractDefinitionOriginal: undefined,
      metadata: { verificationStatus: 'verified' },
    });

    const mockNetworkConfig = {
      id: 'evm:sepolia',
      name: 'Sepolia',
      ecosystem: 'evm',
      network: 'ethereum',
      type: 'testnet',
      isTestnet: true,
      exportConstName: 'ethereumSepolia',
      chainId: 11155111,
      rpcUrl: 'https://example.invalid',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    } as const;

    mockAdapter = {
      networkConfig: mockNetworkConfig,
      initialAppServiceKitName: 'custom',
      loadContract: vi.fn().mockResolvedValue(mockSchema),
      loadContractWithMetadata: loadSpy,
      getWritableFunctions: () => [],
      mapParameterTypeToFieldType: () => 'text',
      formatTransactionData: vi.fn(),
      signAndBroadcast: vi.fn(),
      isValidAddress: () => true,
      getSupportedExecutionMethods: async () => [],
      validateExecutionConfig: async () => true,
      isViewFunction: () => true,
      getCompatibleFieldTypes: () => [],
      generateDefaultField: () => ({
        id: 'x',
        name: 'x',
        label: 'x',
        type: 'text',
        validation: {},
      }),
      supportsWalletConnection: () => false,
      getAvailableUiKits: async () => [],
      getExplorerUrl: () => null,
      getContractDefinitionInputs: () => [],
      queryViewFunction: vi.fn(),
      formatFunctionResult: () => '',
      getRelayers: async () => [],
      getRelayer: async () => ({
        relayerId: 'r1',
        name: 'Relayer',
        address: '0x0000000000000000000000000000000000000000',
        network: 'evm:sepolia',
        paused: false,
        systemDisabled: false,
      }),
    } as unknown as ContractAdapter;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('centralized deep-link-triggered load happens once', async () => {
    // Simulate deep link consumption in store (initializePageState already ran)
    uiBuilderStore.setInitialState({
      selectedNetworkConfigId: mockAdapter.networkConfig.id,
      contractState: {
        schema: null,
        address: mockSchema.address!,
        formValues: { contractAddress: mockSchema.address! },
        definitionJson: null,
        definitionOriginal: null,
        source: null,
        metadata: null,
        proxyInfo: null,
        error: null,
        contractDefinitionArtifacts: null,
        requiredInputSnapshot: null,
        requiresManualReload: false,
      },
      needsContractDefinitionLoad: true,
    });

    const { result } = renderHook(() =>
      useContractDefinition({
        onLoaded: (schema, formValues, source, metadata, original) => {
          uiBuilderStore.setContractDefinitionResult({
            schema,
            formValues,
            source,
            metadata: metadata ?? {},
            original: original ?? '',
          });
        },
      })
    );

    const formValues: FormValues = { contractAddress: mockSchema.address! };

    // The first load
    await act(async () => {
      await result.current.load(formValues);
    });

    // Simulate that a secondary auto trigger would have occurred; call load again
    await act(async () => {
      await result.current.load(formValues);
    });

    expect(loadSpy).toHaveBeenCalledTimes(1);
  });
});
