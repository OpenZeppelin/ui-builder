import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uiBuilderStore } from '../../uiBuilderStore';
import { useBuilderLifecycle } from '../useBuilderLifecycle';

const {
  parseDeepLinkMock,
  setActiveNetworkIdMock,
  trackEcosystemSelectionMock,
  trackNetworkSelectionMock,
  getNetworkByIdMock,
  isNetworkSelectableMock,
  getDisabledNetworkRejectionToastMock,
  contractUIStorageGetMock,
  toastErrorMock,
  resolveNetworkIdFromDeepLinkMock,
} = vi.hoisted(() => ({
  parseDeepLinkMock: vi.fn(),
  setActiveNetworkIdMock: vi.fn(),
  trackEcosystemSelectionMock: vi.fn(),
  trackNetworkSelectionMock: vi.fn(),
  getNetworkByIdMock: vi.fn(),
  isNetworkSelectableMock: vi.fn(),
  getDisabledNetworkRejectionToastMock: vi.fn(),
  contractUIStorageGetMock: vi.fn(),
  toastErrorMock: vi.fn(),
  resolveNetworkIdFromDeepLinkMock: vi.fn(),
}));

vi.mock('@openzeppelin/ui-utils', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  parseDeepLink: parseDeepLinkMock,
  routerService: {
    navigate: vi.fn(),
  },
  isNetworkSelectable: isNetworkSelectableMock,
  getDisabledNetworkRejectionToast: getDisabledNetworkRejectionToastMock,
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
  },
}));

vi.mock('../../../../../storage', () => ({
  contractUIStorage: {
    get: contractUIStorageGetMock,
  },
}));

vi.mock('@/core/ecosystemManager', () => ({
  getNetworkById: getNetworkByIdMock,
}));

vi.mock('@/core/deeplink', () => ({
  extractDeepLinkParams: (params: Record<string, string>) => ({
    ecosystem: (params.ecosystem || '').trim(),
    networkId: params.networkId || params.networkid || null,
    address: params.contractAddress || params.address || params.identifier || null,
    forcedService: typeof params.service === 'string' ? params.service : null,
    chainId: params.chainId || null,
  }),
  resolveNetworkIdFromDeepLink: resolveNetworkIdFromDeepLinkMock,
}));

vi.mock('@openzeppelin/ui-react', () => ({
  useWalletState: () => ({
    setActiveNetworkId: setActiveNetworkIdMock,
  }),
}));

vi.mock('@/hooks/useBuilderAnalytics', () => ({
  useBuilderAnalytics: () => ({
    trackEcosystemSelection: trackEcosystemSelectionMock,
    trackNetworkSelection: trackNetworkSelectionMock,
    trackExportAction: vi.fn(),
    trackWizardStep: vi.fn(),
    trackSidebarInteraction: vi.fn(),
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
    isEnabled: () => true,
    initialize: vi.fn(),
  }),
}));

describe('useBuilderLifecycle deep link ecosystem sync', () => {
  const createRefs = () => ({
    loadingRef: { current: false },
    savedIdRef: { current: null },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    uiBuilderStore.updateState(() => ({
      selectedEcosystem: 'evm',
      selectedNetworkConfigId: null,
      pendingNetworkId: null,
      networkToSwitchTo: null,
    }));
  });

  it('selects the ecosystem provided by the deep link even if no network can be resolved', async () => {
    parseDeepLinkMock.mockReturnValue({ ecosystem: 'stellar' });

    const { loadingRef, savedIdRef } = createRefs();
    const autoSave = { pause: vi.fn(), resume: vi.fn(), isPaused: false };

    const { result } = renderHook(() => useBuilderLifecycle(loadingRef, savedIdRef, autoSave));

    await act(async () => {
      await result.current.initializePageState();
    });

    expect(uiBuilderStore.getState().selectedEcosystem).toBe('stellar');
  });

  it('tracks ecosystem selection from deep link', async () => {
    parseDeepLinkMock.mockReturnValue({ ecosystem: 'stellar' });

    const { loadingRef, savedIdRef } = createRefs();
    const autoSave = { pause: vi.fn(), resume: vi.fn(), isPaused: false };

    const { result } = renderHook(() => useBuilderLifecycle(loadingRef, savedIdRef, autoSave));

    await act(async () => {
      await result.current.initializePageState();
    });

    expect(trackEcosystemSelectionMock).toHaveBeenCalledWith('stellar');
  });

  it('does not track ecosystem selection if ecosystem did not change', async () => {
    // Start with evm already selected
    uiBuilderStore.updateState(() => ({ selectedEcosystem: 'evm' }));
    parseDeepLinkMock.mockReturnValue({ ecosystem: 'evm' });

    const { loadingRef, savedIdRef } = createRefs();
    const autoSave = { pause: vi.fn(), resume: vi.fn(), isPaused: false };

    const { result } = renderHook(() => useBuilderLifecycle(loadingRef, savedIdRef, autoSave));

    await act(async () => {
      await result.current.initializePageState();
    });

    expect(trackEcosystemSelectionMock).not.toHaveBeenCalled();
  });

  it('rejects deep links targeting a disabled network', async () => {
    parseDeepLinkMock.mockReturnValue({
      ecosystem: 'evm',
      networkId: 'ethereum-mainnet',
      address: '0xabc',
    });
    resolveNetworkIdFromDeepLinkMock.mockResolvedValue('ethereum-mainnet');
    getNetworkByIdMock.mockResolvedValue({
      id: 'ethereum-mainnet',
      name: 'Ethereum Mainnet',
      type: 'mainnet',
    });
    isNetworkSelectableMock.mockReturnValue(false);
    getDisabledNetworkRejectionToastMock.mockReturnValue({
      title: 'Mainnet networks are disabled on this hosted UI Builder',
      description:
        'Testnet and devnet networks remain available here. To use mainnet, deploy UI Builder yourself from the source repository.',
    });

    const { loadingRef, savedIdRef } = createRefs();
    const autoSave = { pause: vi.fn(), resume: vi.fn(), isPaused: false };

    const { result } = renderHook(() => useBuilderLifecycle(loadingRef, savedIdRef, autoSave));

    await act(async () => {
      await result.current.initializePageState();
    });

    expect(getDisabledNetworkRejectionToastMock).toHaveBeenCalledWith('UI Builder');
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Mainnet networks are disabled on this hosted UI Builder',
      expect.objectContaining({
        description:
          'Testnet and devnet networks remain available here. To use mainnet, deploy UI Builder yourself from the source repository.',
      })
    );
    expect(setActiveNetworkIdMock).not.toHaveBeenCalled();
    expect(trackNetworkSelectionMock).not.toHaveBeenCalled();
    expect(uiBuilderStore.getState().selectedNetworkConfigId).toBeNull();
    expect(uiBuilderStore.getState().pendingNetworkId).toBeNull();
  });
});

describe('useBuilderLifecycle saved configuration loading', () => {
  const createRefs = () => ({
    loadingRef: { current: false },
    savedIdRef: { current: null as string | null },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    uiBuilderStore.resetWizard();
  });

  it('rejects loading a saved configuration on a disabled mainnet network', async () => {
    contractUIStorageGetMock.mockResolvedValue({
      id: 'saved-mainnet',
      title: 'Old Mainnet UI',
      ecosystem: 'evm',
      networkId: 'ethereum-mainnet',
      contractAddress: '0xabc',
      functionId: 'transfer',
      formConfig: { functionId: 'transfer', title: 'Old Mainnet UI', fields: [] },
    });
    getNetworkByIdMock.mockResolvedValue({
      id: 'ethereum-mainnet',
      name: 'Ethereum Mainnet',
      type: 'mainnet',
    });
    isNetworkSelectableMock.mockReturnValue(false);
    getDisabledNetworkRejectionToastMock.mockReturnValue({
      title: 'Mainnet networks are disabled on this hosted UI Builder',
      description:
        'Testnet and devnet networks remain available here. To use mainnet, deploy UI Builder yourself from the source repository.',
    });

    const { loadingRef, savedIdRef } = createRefs();
    const autoSave = { pause: vi.fn(), resume: vi.fn(), isPaused: false };

    const { result } = renderHook(() => useBuilderLifecycle(loadingRef, savedIdRef, autoSave));

    await act(async () => {
      await result.current.load('saved-mainnet');
    });

    expect(getDisabledNetworkRejectionToastMock).toHaveBeenCalledWith('UI Builder');
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Mainnet networks are disabled on this hosted UI Builder',
      expect.objectContaining({
        description:
          'Testnet and devnet networks remain available here. To use mainnet, deploy UI Builder yourself from the source repository.',
      })
    );
    expect(setActiveNetworkIdMock).not.toHaveBeenCalled();
    expect(savedIdRef.current).toBeNull();
    expect(uiBuilderStore.getState().loadedConfigurationId).toBeNull();
  });
});
