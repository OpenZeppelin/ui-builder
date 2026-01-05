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
    it('should track export action event', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackExportAction('react-vite');

      expect(mockTrackEvent).toHaveBeenCalledWith('export_clicked', { export_type: 'react-vite' });
    });
  });

  describe('trackWizardStep', () => {
    it('should track wizard step progression', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackWizardStep(2, 'configure');

      expect(mockTrackEvent).toHaveBeenCalledWith('wizard_step', {
        step_number: 2,
        step_name: 'configure',
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
    it('should track sidebar interaction event', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackSidebarInteraction('import');

      expect(mockTrackEvent).toHaveBeenCalledWith('sidebar_interaction', { action: 'import' });
    });

    it('should track different actions', () => {
      const { result } = renderHook(() => useBuilderAnalytics());

      result.current.trackSidebarInteraction('import');
      result.current.trackSidebarInteraction('export');
      result.current.trackSidebarInteraction('new');

      expect(mockTrackEvent).toHaveBeenCalledTimes(3);
    });
  });
});
