import { appConfigService, logger } from '@openzeppelin/ui-builder-utils';

/**
 * Google Analytics service for tracking user interactions
 * Manages Google Analytics initialization and event tracking
 * Only active when the analytics_enabled feature flag is true
 */
export class AnalyticsService {
  private static initialized = false;

  /**
   * Initialize Google Analytics
   * @param tagId - Google Analytics tag ID (e.g., G-N3DZK5FCT1)
   */
  static initialize(tagId: string): void {
    if (!tagId) {
      logger.warn('AnalyticsService', 'No tag ID provided');
      return;
    }

    if (!this.isEnabled()) {
      logger.info('AnalyticsService', 'Analytics is disabled via feature flag');
      return;
    }

    if (this.initialized) {
      logger.info('AnalyticsService', 'Already initialized');
      return;
    }

    try {
      this.loadGtagScript(tagId);
      this.initializeGtag(tagId);
      this.initialized = true;
      logger.info('AnalyticsService', 'Initialized successfully');
    } catch (error) {
      logger.error('AnalyticsService', 'Failed to initialize:', error);
    }
  }

  /**
   * Check if analytics is enabled via feature flag
   */
  static isEnabled(): boolean {
    return appConfigService.isFeatureEnabled('analytics_enabled');
  }

  /**
   * Reset the analytics service state (primarily for testing)
   * @private
   */
  static reset(): void {
    this.initialized = false;
  }

  /**
   * Track ecosystem selection
   * @param ecosystem - Selected ecosystem (e.g., 'evm', 'solana')
   */
  static trackEcosystemSelection(ecosystem: string): void {
    this.trackEvent('ecosystem_selected', {
      ecosystem,
    });
  }

  /**
   * Track network selection
   * @param networkId - Selected network ID
   * @param ecosystem - Ecosystem the network belongs to
   */
  static trackNetworkSelection(networkId: string, ecosystem: string): void {
    this.trackEvent('network_selected', {
      network_id: networkId,
      ecosystem,
    });
  }

  /**
   * Track export action
   * @param exportType - Type of export (e.g., 'react-vite')
   */
  static trackExportAction(exportType: string): void {
    this.trackEvent('export_clicked', {
      export_type: exportType,
    });
  }

  /**
   * Track wizard step progression
   * @param stepNumber - Current step number
   * @param stepName - Name/identifier of the step
   */
  static trackWizardStep(stepNumber: number, stepName: string): void {
    this.trackEvent('wizard_step', {
      step_number: stepNumber,
      step_name: stepName,
    });
  }

  /**
   * Track sidebar interactions
   * @param action - Action performed (e.g., 'import', 'export')
   */
  static trackSidebarInteraction(action: string): void {
    this.trackEvent('sidebar_interaction', {
      action,
    });
  }

  /**
   * Load the Google Analytics gtag script
   * @private
   */
  private static loadGtagScript(tagId: string): void {
    // Check if script is already loaded
    if (document.querySelector(`script[src*="gtag/js?id=${tagId}"]`)) {
      return;
    }

    // Initialize dataLayer
    if (!window.dataLayer) {
      window.dataLayer = [];
    }

    // Define gtag function
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };

    // Create and inject the script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
    document.head.appendChild(script);
  }

  /**
   * Initialize gtag with configuration
   * @private
   */
  private static initializeGtag(tagId: string): void {
    if (typeof window.gtag === 'function') {
      window.gtag('js', new Date());
      window.gtag('config', tagId);
    }
  }

  /**
   * Generic event tracking method
   * @private
   */
  private static trackEvent(eventName: string, parameters: Record<string, string | number>): void {
    if (!this.isEnabled()) {
      return;
    }

    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, parameters);
      } else {
        logger.warn('AnalyticsService', 'gtag is not available');
      }
    } catch (error) {
      logger.error('AnalyticsService', `Failed to track event '${eventName}':`, error);
    }
  }
}

/**
 * Type declarations for gtag
 */
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
