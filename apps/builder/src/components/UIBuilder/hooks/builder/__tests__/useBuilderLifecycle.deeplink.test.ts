import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uiBuilderStore } from '../../uiBuilderStore';
import { useBuilderLifecycle } from '../useBuilderLifecycle';

const {
  parseDeepLinkMock,
  setActiveNetworkIdMock,
  trackEcosystemSelectionMock,
  trackNetworkSelectionMock,
} = vi.hoisted(() => ({
  parseDeepLinkMock: vi.fn(),
  setActiveNetworkIdMock: vi.fn(),
  trackEcosystemSelectionMock: vi.fn(),
  trackNetworkSelectionMock: vi.fn(),
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
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('../../../../../storage', () => ({
  contractUIStorage: {
    get: vi.fn(),
  },
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
});
