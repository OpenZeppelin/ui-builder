import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

import { AnalyticsService } from '../../services/AnalyticsService';
import { AnalyticsProvider } from '../AnalyticsProvider';
// Import after mocks
import { useAnalytics } from '../useAnalytics';

// Mock the AnalyticsService
vi.mock('../../services/AnalyticsService', () => ({
  AnalyticsService: {
    initialize: vi.fn(),
    isEnabled: vi.fn(),
    trackEcosystemSelection: vi.fn(),
    trackNetworkSelection: vi.fn(),
    trackExportAction: vi.fn(),
    trackWizardStep: vi.fn(),
    trackSidebarInteraction: vi.fn(),
  },
}));

// Get mocked functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAnalyticsService = AnalyticsService as any;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; tagId?: string; autoInit?: boolean }> = ({
  children,
  tagId = 'G-TEST123',
  autoInit = true,
}) => (
  <AnalyticsProvider tagId={tagId} autoInit={autoInit}>
    {children}
  </AnalyticsProvider>
);

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalyticsService.isEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('hook return values', () => {
    it('should return analytics functions and state', () => {
      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current).toHaveProperty('isEnabled');
      expect(result.current).toHaveProperty('trackEcosystemSelection');
      expect(result.current).toHaveProperty('trackNetworkSelection');
      expect(result.current).toHaveProperty('trackExportAction');
      expect(result.current).toHaveProperty('trackWizardStep');
      expect(result.current).toHaveProperty('trackSidebarInteraction');
      expect(result.current).toHaveProperty('initialize');
    });

    it('should return enabled state from AnalyticsService', () => {
      mockAnalyticsService.isEnabled.mockReturnValue(true);

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.isEnabled).toBe(true);
      expect(mockAnalyticsService.isEnabled).toHaveBeenCalled();
    });

    it('should return disabled state from AnalyticsService', () => {
      mockAnalyticsService.isEnabled.mockReturnValue(false);

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should auto-initialize analytics when autoInit is true', () => {
      renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper autoInit={true}>{children}</TestWrapper>,
      });

      expect(mockAnalyticsService.initialize).toHaveBeenCalledWith('G-TEST123');
    });

    it('should not auto-initialize when autoInit is false', () => {
      renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper autoInit={false}>{children}</TestWrapper>,
      });

      expect(mockAnalyticsService.initialize).not.toHaveBeenCalled();
    });

    it('should allow manual initialization', () => {
      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper autoInit={false}>{children}</TestWrapper>,
      });

      act(() => {
        result.current.initialize('G-MANUAL123');
      });

      expect(mockAnalyticsService.initialize).toHaveBeenCalledWith('G-MANUAL123');
    });
  });

  describe('event tracking methods', () => {
    it('should call AnalyticsService.trackEcosystemSelection', () => {
      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      act(() => {
        result.current.trackEcosystemSelection('evm');
      });

      expect(mockAnalyticsService.trackEcosystemSelection).toHaveBeenCalledWith('evm');
    });

    it('should call AnalyticsService.trackNetworkSelection', () => {
      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      act(() => {
        result.current.trackNetworkSelection('ethereum-mainnet', 'evm');
      });

      expect(mockAnalyticsService.trackNetworkSelection).toHaveBeenCalledWith(
        'ethereum-mainnet',
        'evm'
      );
    });

    it('should call AnalyticsService.trackExportAction', () => {
      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      act(() => {
        result.current.trackExportAction('react-vite');
      });

      expect(mockAnalyticsService.trackExportAction).toHaveBeenCalledWith('react-vite');
    });

    it('should call AnalyticsService.trackWizardStep', () => {
      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      act(() => {
        result.current.trackWizardStep(2, 'contract-input');
      });

      expect(mockAnalyticsService.trackWizardStep).toHaveBeenCalledWith(2, 'contract-input');
    });

    it('should call AnalyticsService.trackSidebarInteraction', () => {
      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      act(() => {
        result.current.trackSidebarInteraction('import');
      });

      expect(mockAnalyticsService.trackSidebarInteraction).toHaveBeenCalledWith('import');
    });
  });

  describe('error handling', () => {
    it('should handle errors in tracking methods gracefully', () => {
      mockAnalyticsService.trackEcosystemSelection.mockImplementation(() => {
        throw new Error('Tracking error');
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(() => {
        act(() => {
          result.current.trackEcosystemSelection('evm');
        });
      }).not.toThrow();
    });
  });

  describe('context requirements', () => {
    it('should throw error when used outside AnalyticsProvider', () => {
      // Suppress console errors for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useAnalytics());
      }).toThrow('useAnalytics must be used within an AnalyticsProvider');

      console.error = originalError;
    });
  });
});
