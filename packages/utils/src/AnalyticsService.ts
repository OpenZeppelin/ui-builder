import { appConfigService } from './AppConfigService';
import { logger } from './logger';

/**
 * Google Analytics service for tracking user interactions.
 * Manages Google Analytics initialization and event tracking.
 * Only active when the analytics_enabled feature flag is true.
 *
 * This is a generic service that provides core analytics functionality.
 * App-specific tracking methods should be implemented in app-level hooks
 * that use the generic `trackEvent` method.
 *
 * @example
 * ```typescript
 * // Initialize analytics (typically done once at app startup)
 * AnalyticsService.initialize('G-XXXXXXXXXX');
 *
 * // Track a custom event
 * AnalyticsService.trackEvent('button_clicked', { button_name: 'submit' });
 *
 * // Track page view
 * AnalyticsService.trackPageView('Dashboard', '/dashboard');
 * ```
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
   */
  static reset(): void {
    this.initialized = false;
  }

  /**
   * Generic event tracking method.
   * Use this to track any custom event with arbitrary parameters.
   *
   * @param eventName - Name of the event (e.g., 'button_clicked', 'form_submitted')
   * @param parameters - Key-value pairs of event parameters
   *
   * @example
   * ```typescript
   * AnalyticsService.trackEvent('ecosystem_selected', { ecosystem: 'evm' });
   * AnalyticsService.trackEvent('wizard_step', { step_number: 2, step_name: 'configure' });
   * ```
   */
  static trackEvent(eventName: string, parameters: Record<string, string | number>): void {
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

  /**
   * Track page view event.
   * Common event shared across all apps.
   *
   * @param pageName - Human-readable name of the page
   * @param pagePath - URL path of the page
   *
   * @example
   * ```typescript
   * AnalyticsService.trackPageView('Dashboard', '/dashboard');
   * ```
   */
  static trackPageView(pageName: string, pagePath: string): void {
    this.trackEvent('page_view', {
      page_title: pageName,
      page_path: pagePath,
    });
  }

  /**
   * Track network selection event.
   * Common event shared across all apps that involve network selection.
   *
   * @param networkId - Selected network ID
   * @param ecosystem - Ecosystem the network belongs to (e.g., 'evm', 'stellar')
   *
   * @example
   * ```typescript
   * AnalyticsService.trackNetworkSelection('ethereum-mainnet', 'evm');
   * ```
   */
  static trackNetworkSelection(networkId: string, ecosystem: string): void {
    this.trackEvent('network_selected', {
      network_id: networkId,
      ecosystem,
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
}

/**
 * Type declarations for Google Analytics gtag
 */
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
