import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ContractAdapter,
  ContractSchema,
  FormValues,
} from '@openzeppelin/contracts-ui-builder-types';

import { useContractDefinition } from '../../../../hooks/useContractDefinition';
import { uiBuilderStore } from '../../hooks/uiBuilderStore';

let mockAdapter: ContractAdapter;

vi.mock('@openzeppelin/contracts-ui-builder-react-core', () => ({
  useWalletState: () => ({ activeAdapter: mockAdapter }),
}));

describe('Manual ABI loading deduplication', () => {
  const mockSchema: ContractSchema = {
    ecosystem: 'evm',
    functions: [],
    address: '0x1111111111111111111111111111111111111111',
  };

  let loadSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    // Reset store between tests
    uiBuilderStore.resetWizard();

    loadSpy = vi.fn().mockResolvedValue({
      schema: mockSchema,
      source: 'manual',
      contractDefinitionOriginal: '{"abi":[]}',
      metadata: { verificationStatus: 'unknown' },
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
      // minimal adapter surface used by useContractDefinition
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

  it('loads once for new manual ABI paste', async () => {
    const { result } = renderHook(() =>
      useContractDefinition({
        onLoaded: (schema, formValues) => {
          uiBuilderStore.setContractDefinitionResult({
            schema,
            formValues,
            source: 'manual',
            metadata: {},
            original: formValues.contractDefinition as string,
          });
        },
      })
    );

    const formValues: FormValues = {
      contractAddress: mockSchema.address!,
      contractDefinition: '{"abi":[]}',
    };

    await act(async () => {
      await result.current.load(formValues);
    });

    // Second attempt with identical inputs should be deduped by the service
    await act(async () => {
      await result.current.load(formValues);
    });

    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('parses once from saved config (definitionJson present) without fetching', async () => {
    // Preload store as if a saved config was loaded
    uiBuilderStore.setInitialState({
      selectedNetworkConfigId: mockAdapter.networkConfig.id,
      contractState: {
        schema: null,
        address: mockSchema.address!,
        formValues: { contractAddress: mockSchema.address! },
        definitionJson: '{"abi":[]}',
        definitionOriginal: '{"abi":[]}',
        source: 'manual',
        metadata: null,
        proxyInfo: null,
        error: null,
      },
      needsContractDefinitionLoad: true,
    });

    const { result } = renderHook(() =>
      useContractDefinition({
        onLoaded: (schema, formValues) => {
          uiBuilderStore.setContractDefinitionResult({
            schema,
            formValues,
            source: 'manual',
            metadata: {},
            original: '{"abi":[]}',
          });
        },
      })
    );

    const formValues: FormValues = {
      contractAddress: mockSchema.address!,
      contractDefinition: '{"abi":[]}',
    };

    await act(async () => {
      await result.current.load(formValues);
    });

    expect(loadSpy).toHaveBeenCalledTimes(1);
  });
});
