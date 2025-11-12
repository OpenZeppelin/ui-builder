import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uiBuilderStore } from '../../uiBuilderStore';
import { useBuilderLifecycle } from '../useBuilderLifecycle';

const { parseDeepLinkMock, setActiveNetworkIdMock } = vi.hoisted(() => ({
  parseDeepLinkMock: vi.fn(),
  setActiveNetworkIdMock: vi.fn(),
}));

vi.mock('@openzeppelin/ui-builder-utils', () => ({
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

vi.mock('@openzeppelin/ui-builder-storage', () => ({
  contractUIStorage: {
    get: vi.fn(),
  },
}));

vi.mock('@openzeppelin/ui-builder-react-core', () => ({
  useWalletState: () => ({
    setActiveNetworkId: setActiveNetworkIdMock,
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
});
