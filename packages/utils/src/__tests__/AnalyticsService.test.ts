import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../AnalyticsService';
import { appConfigService } from '../AppConfigService';

// Mock gtag functions
const mockGtag = vi.fn();

// Mock the app config service and logger
vi.mock('../AppConfigService', () => ({
  appConfigService: {
    isFeatureEnabled: vi.fn(),
  },
}));

vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock global window and document
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
});

Object.defineProperty(window, 'dataLayer', {
  value: [],
  writable: true,
});

// Get the mocked function
const mockIsFeatureEnabled = appConfigService.isFeatureEnabled as ReturnType<typeof vi.fn>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Reset DOM
    document.head.innerHTML = '';

    // Reset window properties
    window.gtag = mockGtag;
    window.dataLayer = [];

    // Reset AnalyticsService static state
    AnalyticsService.reset();

    // Default: analytics is disabled
    mockIsFeatureEnabled.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should not initialize when analytics is disabled', () => {
      mockIsFeatureEnabled.mockReturnValue(false);

      AnalyticsService.initialize('G-TEST123');

      expect(mockIsFeatureEnabled).toHaveBeenCalledWith('analytics_enabled');
      expect(document.querySelector('script[src*="gtag"]')).toBeNull();
      expect(mockGtag).not.toHaveBeenCalled();
    });

    it('should initialize when analytics is enabled', () => {
      mockIsFeatureEnabled.mockReturnValue(true);

      AnalyticsService.initialize('G-TEST123');

      expect(mockIsFeatureEnabled).toHaveBeenCalledWith('analytics_enabled');
      expect(document.querySelector('script[src*="gtag"]')).toBeTruthy();
      expect(window.dataLayer).toBeDefined();
      expect(mockGtag).toHaveBeenCalledWith('js', expect.any(Date));
      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123');
    });

    it('should not initialize twice', () => {
      mockIsFeatureEnabled.mockReturnValue(true);

      AnalyticsService.initialize('G-TEST123');
      AnalyticsService.initialize('G-TEST123');

      // Should only have one script tag
      const scripts = document.querySelectorAll('script[src*="gtag"]');
      expect(scripts).toHaveLength(1);
    });

    it('should handle missing tag ID gracefully', () => {
      mockIsFeatureEnabled.mockReturnValue(true);

      expect(() => {
        AnalyticsService.initialize('');
      }).not.toThrow();
    });
  });

  describe('isEnabled', () => {
    it('should return false when analytics is disabled', () => {
      mockIsFeatureEnabled.mockReturnValue(false);
      expect(AnalyticsService.isEnabled()).toBe(false);
    });

    it('should return true when analytics is enabled', () => {
      mockIsFeatureEnabled.mockReturnValue(true);
      expect(AnalyticsService.isEnabled()).toBe(true);
    });
  });

  describe('event tracking', () => {
    beforeEach(() => {
      mockIsFeatureEnabled.mockReturnValue(true);
      AnalyticsService.initialize('G-TEST123');
    });

    describe('trackEvent (generic)', () => {
      it('should track generic event when enabled', () => {
        AnalyticsService.trackEvent('custom_event', { key: 'value', count: 42 });

        expect(mockGtag).toHaveBeenCalledWith('event', 'custom_event', {
          key: 'value',
          count: 42,
        });
      });

      it('should not track when analytics is disabled', () => {
        mockIsFeatureEnabled.mockReturnValue(false);

        AnalyticsService.trackEvent('custom_event', { key: 'value' });

        expect(mockGtag).not.toHaveBeenCalledWith('event', 'custom_event', expect.any(Object));
      });
    });

    describe('trackPageView', () => {
      it('should track page view when enabled', () => {
        AnalyticsService.trackPageView('Dashboard', '/dashboard');

        expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
          page_title: 'Dashboard',
          page_path: '/dashboard',
        });
      });

      it('should not track when analytics is disabled', () => {
        mockIsFeatureEnabled.mockReturnValue(false);

        AnalyticsService.trackPageView('Dashboard', '/dashboard');

        expect(mockGtag).not.toHaveBeenCalledWith('event', 'page_view', expect.any(Object));
      });
    });

    describe('trackNetworkSelection', () => {
      it('should track network selection when enabled', () => {
        AnalyticsService.trackNetworkSelection('ethereum-mainnet', 'evm');

        expect(mockGtag).toHaveBeenCalledWith('event', 'network_selected', {
          network_id: 'ethereum-mainnet',
          ecosystem: 'evm',
        });
      });

      it('should not track when analytics is disabled', () => {
        mockIsFeatureEnabled.mockReturnValue(false);

        AnalyticsService.trackNetworkSelection('ethereum-mainnet', 'evm');

        expect(mockGtag).not.toHaveBeenCalledWith('event', 'network_selected', expect.any(Object));
      });
    });
  });

  describe('error handling', () => {
    it('should handle gtag errors gracefully', () => {
      mockIsFeatureEnabled.mockReturnValue(true);
      mockGtag.mockImplementation(() => {
        throw new Error('Gtag error');
      });

      expect(() => {
        AnalyticsService.initialize('G-TEST123');
      }).not.toThrow();
    });

    it('should handle tracking errors gracefully', () => {
      mockIsFeatureEnabled.mockReturnValue(true);
      AnalyticsService.initialize('G-TEST123');

      mockGtag.mockImplementation(() => {
        throw new Error('Tracking error');
      });

      expect(() => {
        AnalyticsService.trackEvent('test_event', { key: 'value' });
      }).not.toThrow();
    });
  });

  describe('performance', () => {
    it('should load gtag script asynchronously', () => {
      mockIsFeatureEnabled.mockReturnValue(true);

      AnalyticsService.initialize('G-TEST123');

      const script = document.querySelector('script[src*="gtag"]') as HTMLScriptElement;
      expect(script?.async).toBe(true);
    });

    it('should not block when gtag is not available', () => {
      mockIsFeatureEnabled.mockReturnValue(true);

      // Set gtag to undefined to simulate it not being available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag = undefined;

      expect(() => {
        AnalyticsService.trackEvent('test_event', { key: 'value' });
      }).not.toThrow();
    });
  });
});
