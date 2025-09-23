import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appConfigService } from '@openzeppelin/ui-builder-utils';

// Import after mocks are set up
import { AnalyticsService } from '../AnalyticsService';

// Mock gtag functions
const mockGtag = vi.fn();

// Mock the app config service and logger
vi.mock('@openzeppelin/ui-builder-utils', () => ({
  appConfigService: {
    isFeatureEnabled: vi.fn(),
  },
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (AnalyticsService as any).reset();

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

    describe('trackEcosystemSelection', () => {
      it('should track ecosystem selection when enabled', () => {
        AnalyticsService.trackEcosystemSelection('evm');

        expect(mockGtag).toHaveBeenCalledWith('event', 'ecosystem_selected', {
          ecosystem: 'evm',
        });
      });

      it('should not track when analytics is disabled', () => {
        mockIsFeatureEnabled.mockReturnValue(false);

        AnalyticsService.trackEcosystemSelection('evm');

        // Only the initialization calls should be present
        expect(mockGtag).not.toHaveBeenCalledWith(
          'event',
          'ecosystem_selected',
          expect.any(Object)
        );
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

    describe('trackExportAction', () => {
      it('should track export action when enabled', () => {
        AnalyticsService.trackExportAction('react-vite');

        expect(mockGtag).toHaveBeenCalledWith('event', 'export_clicked', {
          export_type: 'react-vite',
        });
      });

      it('should not track when analytics is disabled', () => {
        mockIsFeatureEnabled.mockReturnValue(false);

        AnalyticsService.trackExportAction('react-vite');

        expect(mockGtag).not.toHaveBeenCalledWith('event', 'export_clicked', expect.any(Object));
      });
    });

    describe('trackWizardStep', () => {
      it('should track wizard step when enabled', () => {
        AnalyticsService.trackWizardStep(2, 'contract-input');

        expect(mockGtag).toHaveBeenCalledWith('event', 'wizard_step', {
          step_number: 2,
          step_name: 'contract-input',
        });
      });

      it('should not track when analytics is disabled', () => {
        mockIsFeatureEnabled.mockReturnValue(false);

        AnalyticsService.trackWizardStep(2, 'contract-input');

        expect(mockGtag).not.toHaveBeenCalledWith('event', 'wizard_step', expect.any(Object));
      });
    });

    describe('trackSidebarInteraction', () => {
      it('should track sidebar interaction when enabled', () => {
        AnalyticsService.trackSidebarInteraction('import');

        expect(mockGtag).toHaveBeenCalledWith('event', 'sidebar_interaction', {
          action: 'import',
        });
      });

      it('should not track when analytics is disabled', () => {
        mockIsFeatureEnabled.mockReturnValue(false);

        AnalyticsService.trackSidebarInteraction('import');

        expect(mockGtag).not.toHaveBeenCalledWith(
          'event',
          'sidebar_interaction',
          expect.any(Object)
        );
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
        AnalyticsService.trackEcosystemSelection('evm');
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
        AnalyticsService.trackEcosystemSelection('evm');
      }).not.toThrow();
    });
  });
});
