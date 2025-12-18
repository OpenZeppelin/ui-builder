import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

import { AnalyticsService } from '@openzeppelin/ui-builder-utils';

import { AnalyticsProvider } from '../AnalyticsProvider';
import { useAnalytics } from '../useAnalytics';

// Mock the AnalyticsService
vi.mock('@openzeppelin/ui-builder-utils', () => ({
  AnalyticsService: {
    initialize: vi.fn(),
    isEnabled: vi.fn(),
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
    trackNetworkSelection: vi.fn(),
  },
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Get mocked functions
const mockAnalyticsService = AnalyticsService as unknown as {
  initialize: ReturnType<typeof vi.fn>;
  isEnabled: ReturnType<typeof vi.fn>;
  trackEvent: ReturnType<typeof vi.fn>;
  trackPageView: ReturnType<typeof vi.fn>;
  trackNetworkSelection: ReturnType<typeof vi.fn>;
};

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
      expect(result.current).toHaveProperty('trackEvent');
      expect(result.current).toHaveProperty('trackPageView');
      expect(result.current).toHaveProperty('trackNetworkSelection');
      expect(result.current).toHaveProperty('initialize');
    });

    it('should return enabled state from AnalyticsService', () => {
      mockAnalyticsService.isEnabled.mockReturnValue(true);

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.isEnabled()).toBe(true);
      expect(mockAnalyticsService.isEnabled).toHaveBeenCalled();
    });

    it('should return disabled state from AnalyticsService', () => {
      mockAnalyticsService.isEnabled.mockReturnValue(false);

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.isEnabled()).toBe(false);
    });

    it('should reflect dynamic feature flag changes', () => {
      // Start with enabled
      mockAnalyticsService.isEnabled.mockReturnValue(true);

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(result.current.isEnabled()).toBe(true);

      // Simulate feature flag change
      mockAnalyticsService.isEnabled.mockReturnValue(false);

      // isEnabled() should return fresh state without re-render
      expect(result.current.isEnabled()).toBe(false);
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
    it('should call AnalyticsService.trackEvent', () => {
      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      act(() => {
        result.current.trackEvent('custom_event', { key: 'value' });
      });

      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('custom_event', {
        key: 'value',
      });
    });

    it('should call AnalyticsService.trackPageView', () => {
      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      act(() => {
        result.current.trackPageView('Dashboard', '/dashboard');
      });

      expect(mockAnalyticsService.trackPageView).toHaveBeenCalledWith('Dashboard', '/dashboard');
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
  });

  describe('error handling', () => {
    it('should handle errors in tracking methods gracefully', () => {
      mockAnalyticsService.trackEvent.mockImplementation(() => {
        throw new Error('Tracking error');
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
      });

      expect(() => {
        act(() => {
          result.current.trackEvent('test_event', { key: 'value' });
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
