import { createContext, useContext } from 'react';

/**
 * Analytics context value interface.
 * Provides access to analytics functionality throughout the React component tree.
 */
export interface AnalyticsContextValue {
  /** Google Analytics tag ID */
  tagId?: string;
  /**
   * Check if analytics is enabled via feature flag.
   * Returns fresh state on each call to handle dynamic feature flag changes.
   */
  isEnabled: () => boolean;
  /** Initialize analytics with optional tag ID override */
  initialize: (tagIdOverride?: string) => void;
  /**
   * Track a generic event with custom parameters.
   * Use this for app-specific events.
   *
   * @example
   * ```typescript
   * trackEvent('button_clicked', { button_name: 'submit' });
   * ```
   */
  trackEvent: (eventName: string, parameters: Record<string, string | number>) => void;
  /**
   * Track page view event.
   *
   * @example
   * ```typescript
   * trackPageView('Dashboard', '/dashboard');
   * ```
   */
  trackPageView: (pageName: string, pagePath: string) => void;
  /**
   * Track network selection event.
   *
   * @example
   * ```typescript
   * trackNetworkSelection('ethereum-mainnet', 'evm');
   * ```
   */
  trackNetworkSelection: (networkId: string, ecosystem: string) => void;
}

/**
 * Analytics context for providing analytics functionality to React components.
 * Must be used within an AnalyticsProvider.
 */
export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

/**
 * Internal hook to access analytics context.
 * Throws an error if used outside of an AnalyticsProvider.
 *
 * @internal
 * @throws Error if used outside of AnalyticsProvider
 */
export const useAnalyticsContext = (): AnalyticsContextValue => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};
