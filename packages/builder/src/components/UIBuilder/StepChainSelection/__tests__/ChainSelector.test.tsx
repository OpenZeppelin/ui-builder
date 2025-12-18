import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentProps } from 'react';

import type { Ecosystem } from '@openzeppelin/ui-builder-types';

import { ChainSelector } from '../components/ChainSelector';

const setValueMock = vi.fn();
const trackEcosystemSelection = vi.fn();
const trackNetworkSelection = vi.fn();
let visibleEcosystems: Ecosystem[] = [];
const ecosystemEnabledMap: Partial<Record<Ecosystem, boolean>> = {};

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    setValue: setValueMock,
  }),
}));

vi.mock('../../../../hooks/useBuilderAnalytics', () => ({
  useBuilderAnalytics: () => ({
    trackEcosystemSelection,
    trackNetworkSelection,
    trackExportAction: vi.fn(),
    trackWizardStep: vi.fn(),
    trackSidebarInteraction: vi.fn(),
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
    isEnabled: () => true,
    initialize: vi.fn(),
  }),
}));

vi.mock('../../../../core/networks/service', () => ({
  networkService: {
    getNetworkById: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../../../../core/ecosystems/registry', () => ({
  getEcosystemName: (ecosystem: Ecosystem) => ecosystem.toUpperCase(),
  getEcosystemDescription: () => '',
  getEcosystemNetworkIconName: () => null,
}));

vi.mock('../../../../utils/ecosystem-feature-flags', () => ({
  getVisibleEcosystems: () => visibleEcosystems,
  getEcosystemFeatureConfig: (ecosystem: Ecosystem) => ({
    enabled: ecosystemEnabledMap[ecosystem] ?? true,
    disabledLabel: '',
    disabledDescription: '',
  }),
  isEcosystemEnabled: (ecosystem: Ecosystem) => ecosystemEnabledMap[ecosystem] ?? true,
}));

vi.mock('../components/NetworkSelectionPanel', () => ({
  NetworkSelectionPanel: () => <div data-testid="network-panel" />,
}));

vi.mock('@openzeppelin/ui-builder-ui', () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  MidnightIcon: () => <span>Midnight</span>,
}));

vi.mock('@openzeppelin/ui-builder-utils', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ChainSelector ecosystem synchronization', () => {
  const renderSelector = (props: Partial<ComponentProps<typeof ChainSelector>> = {}) => {
    const mergedProps: ComponentProps<typeof ChainSelector> = {
      onNetworkSelect: vi.fn(),
      initialEcosystem: 'evm',
      selectedNetworkId: null,
      ...props,
    };

    return { ...render(<ChainSelector {...mergedProps} />), mergedProps };
  };

  beforeEach(() => {
    setValueMock.mockClear();
    trackEcosystemSelection.mockClear();
    trackNetworkSelection.mockClear();
    visibleEcosystems = [];
    (Object.keys(ecosystemEnabledMap) as (keyof typeof ecosystemEnabledMap)[]).forEach((key) => {
      delete ecosystemEnabledMap[key];
    });
  });

  it('syncs the selection when the provided ecosystem changes upstream', async () => {
    visibleEcosystems = ['evm', 'stellar'];
    ecosystemEnabledMap.evm = true;
    ecosystemEnabledMap.stellar = true;

    const { rerender, mergedProps } = renderSelector({ initialEcosystem: 'evm' });

    await waitFor(() => {
      expect(setValueMock).toHaveBeenCalledWith('ecosystem', 'evm');
      expect(screen.getByRole('button', { name: /evm/i })).toHaveAttribute('aria-selected', 'true');
    });

    rerender(<ChainSelector {...mergedProps} initialEcosystem="stellar" />);

    await waitFor(() => {
      expect(setValueMock).toHaveBeenCalledTimes(2);
      expect(setValueMock).toHaveBeenLastCalledWith('ecosystem', 'stellar');
      expect(screen.getByRole('button', { name: /stellar/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });
  });

  it('falls back to the first enabled ecosystem when the provided one is hidden', async () => {
    visibleEcosystems = ['solana', 'evm'];
    ecosystemEnabledMap.solana = false;
    ecosystemEnabledMap.evm = true;

    const { rerender, mergedProps } = renderSelector({ initialEcosystem: 'evm' });

    await waitFor(() => {
      expect(setValueMock).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: /evm/i })).toHaveAttribute('aria-selected', 'true');
    });

    rerender(<ChainSelector {...mergedProps} initialEcosystem="midnight" />);

    await waitFor(() => {
      expect(setValueMock).toHaveBeenCalledTimes(2);
      expect(setValueMock).toHaveBeenLastCalledWith('ecosystem', 'evm');
      expect(screen.getByRole('button', { name: /evm/i })).toHaveAttribute('aria-selected', 'true');
    });
  });
});
