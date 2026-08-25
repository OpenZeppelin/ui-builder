import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBuilderAnalytics } from '../useBuilderAnalytics';

// Mock the shared analytics hook
const mockTrackEvent = vi.fn();
const mockTrackPageView = vi.fn();
const mockTrackNetworkSelection = vi.fn();
const mockIsEnabled = vi.fn(() => true);
const mockInitialize = vi.fn();

vi.mock('@openzeppelin/ui-react', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
    trackPageView: mockTrackPageView,
    trackNetworkSelection: mockTrackNetworkSelection,
    isEnabled: mockIsEnabled,
    initialize: mockInitialize,
    tagId: 'G-TEST123',
  }),
}));

describe('useBuilderAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('passthrough methods', () => {
    it('should pass through trackPageView from base hook', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackPageView('Test Page', '/test');

      expect(mockTrackPageView).toHaveBeenCalledWith('Test Page', '/test');
    });

    it('should pass through trackNetworkSelection from base hook', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackNetworkSelection('ethereum', 'evm');

      expect(mockTrackNetworkSelection).toHaveBeenCalledWith('ethereum', 'evm');
    });

    it('should pass through isEnabled from base hook', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      expect(result.current.isEnabled()).toBe(true);
      expect(mockIsEnabled).toHaveBeenCalled();
    });

    it('should pass through initialize from base hook', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.initialize('G-NEW123');

      expect(mockInitialize).toHaveBeenCalledWith('G-NEW123');
    });
  });

  describe('trackEcosystemSelection', () => {
    it('should track ecosystem selection event', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackEcosystemSelection('stellar');

      expect(mockTrackEvent).toHaveBeenCalledWith('ecosystem_selected', { ecosystem: 'stellar' });
    });

    it('should track different ecosystems', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackEcosystemSelection('evm');
      result.current.trackEcosystemSelection('solana');

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, 'ecosystem_selected', { ecosystem: 'evm' });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, 'ecosystem_selected', {
        ecosystem: 'solana',
      });
    });
  });

  describe('trackExportAction', () => {
    it('should track export action event with network context', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackExportAction('react-vite', {
        networkId: 'ethereum-mainnet',
        ecosystem: 'evm',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('export_clicked', {
        export_type: 'react-vite',
        network_id: 'ethereum-mainnet',
        ecosystem: 'evm',
      });
    });

    it('should fall back to unknown when context is missing', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackExportAction('react-vite');

      expect(mockTrackEvent).toHaveBeenCalledWith('export_clicked', {
        export_type: 'react-vite',
        network_id: 'unknown',
        ecosystem: 'unknown',
      });
    });
  });

  describe('trackWizardStep', () => {
    it('should track wizard step progression with network context', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackWizardStep(2, 'configure', {
        networkId: 'stellar-testnet',
        ecosystem: 'stellar',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('wizard_step', {
        step_number: 2,
        step_name: 'configure',
        network_id: 'stellar-testnet',
        ecosystem: 'stellar',
      });
    });

    it('should normalise null/empty context values to unknown', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackWizardStep(1, 'select-chain', { networkId: null, ecosystem: '' });

      expect(mockTrackEvent).toHaveBeenCalledWith('wizard_step', {
        step_number: 1,
        step_name: 'select-chain',
        network_id: 'unknown',
        ecosystem: 'unknown',
      });
    });

    it('should track multiple steps', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackWizardStep(1, 'select-chain');
      result.current.trackWizardStep(2, 'configure');
      result.current.trackWizardStep(3, 'export');

      expect(mockTrackEvent).toHaveBeenCalledTimes(3);
    });
  });

  describe('trackSidebarInteraction', () => {
    it('should track sidebar interaction event with network context', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackSidebarInteraction('import', {
        networkId: 'polygon-mainnet',
        ecosystem: 'evm',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('sidebar_interaction', {
        action: 'import',
        network_id: 'polygon-mainnet',
        ecosystem: 'evm',
      });
    });

    it('should fall back to unknown when context is missing', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackSidebarInteraction('export');

      expect(mockTrackEvent).toHaveBeenCalledWith('sidebar_interaction', {
        action: 'export',
        network_id: 'unknown',
        ecosystem: 'unknown',
      });
    });

    it('should track different actions', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackSidebarInteraction('import');
      result.current.trackSidebarInteraction('export');
      result.current.trackSidebarInteraction('new');

      expect(mockTrackEvent).toHaveBeenCalledTimes(3);
    });
  });

  describe('trackTransactionExecuted', () => {
    it('should track transaction_executed with network, ecosystem, execution method', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackTransactionExecuted('ethereum-mainnet', 'evm', 'relayer');

      expect(mockTrackEvent).toHaveBeenCalledWith('transaction_executed', {
        network_id: 'ethereum-mainnet',
        ecosystem: 'evm',
        execution_method: 'relayer',
      });
    });
  });

  describe('trackContractUiCreated', () => {
    it('should track contract_ui_created with total_records', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackContractUiCreated('stellar-testnet', 'stellar', 4);

      expect(mockTrackEvent).toHaveBeenCalledWith('contract_ui_created', {
        network_id: 'stellar-testnet',
        ecosystem: 'stellar',
        total_records: 4,
      });
    });
  });

  describe('trackRelayerServiceConfigured', () => {
    it('should track relayer_service_configured', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackRelayerServiceConfigured('polygon-mainnet', 'evm');

      expect(mockTrackEvent).toHaveBeenCalledWith('relayer_service_configured', {
        network_id: 'polygon-mainnet',
        ecosystem: 'evm',
      });
    });
  });

  describe('trackUiKitChanged', () => {
    it('should track uikit_changed with uikit_name', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackUiKitChanged('ethereum-mainnet', 'evm', 'rainbowkit');

      expect(mockTrackEvent).toHaveBeenCalledWith('uikit_changed', {
        network_id: 'ethereum-mainnet',
        ecosystem: 'evm',
        uikit_name: 'rainbowkit',
      });
    });
  });

  describe('unknown fallbacks', () => {
    it('should never emit empty string dimensions', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackEcosystemSelection('');
      result.current.trackTransactionExecuted('', '', '');
      result.current.trackUiKitChanged('', 'evm', '');

      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, 'ecosystem_selected', {
        ecosystem: 'unknown',
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, 'transaction_executed', {
        network_id: 'unknown',
        ecosystem: 'unknown',
        execution_method: 'unknown',
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, 'uikit_changed', {
        network_id: 'unknown',
        ecosystem: 'evm',
        uikit_name: 'unknown',
      });
    });
  });

  describe('trackAddressBookOpened', () => {
    it('should track address_book_opened', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackAddressBookOpened('stellar-testnet', 'stellar');

      expect(mockTrackEvent).toHaveBeenCalledWith('address_book_opened', {
        network_id: 'stellar-testnet',
        ecosystem: 'stellar',
      });
    });
  });
});
