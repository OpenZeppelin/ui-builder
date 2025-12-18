import React, { ReactNode, useEffect, useMemo } from 'react';

import { AnalyticsService, logger } from '@openzeppelin/ui-builder-utils';

import { AnalyticsContext, AnalyticsContextValue } from './AnalyticsContext';

/**
 * Props for the AnalyticsProvider component
 */
export interface AnalyticsProviderProps {
  /** Google Analytics tag ID (e.g., 'G-XXXXXXXXXX') */
  tagId?: string;
  /** Whether to automatically initialize analytics on mount (default: true) */
  autoInit?: boolean;
  /** Child components */
  children: ReactNode;
}

/**
 * Analytics Provider component.
 * Provides analytics functionality throughout the React component tree.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AnalyticsProvider tagId={import.meta.env.VITE_GA_TAG_ID} autoInit={true}>
 *       <YourApp />
 *     </AnalyticsProvider>
 *   );
 * }
 * ```
 */
export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  tagId,
  autoInit = true,
  children,
}) => {
  useEffect(() => {
    if (autoInit && tagId) {
      AnalyticsService.initialize(tagId);
    }
  }, [tagId, autoInit]);

  const contextValue: AnalyticsContextValue = useMemo(
    () => ({
      tagId,
      isEnabled: () => AnalyticsService.isEnabled(),
      initialize: (tagIdOverride?: string) => {
        const effectiveTagId = tagIdOverride || tagId;
        if (effectiveTagId) {
          AnalyticsService.initialize(effectiveTagId);
        }
      },
      trackEvent: (eventName: string, parameters: Record<string, string | number>) => {
        try {
          AnalyticsService.trackEvent(eventName, parameters);
        } catch (error) {
          logger.error('AnalyticsProvider', 'Error tracking event:', error);
        }
      },
      trackPageView: (pageName: string, pagePath: string) => {
        try {
          AnalyticsService.trackPageView(pageName, pagePath);
        } catch (error) {
          logger.error('AnalyticsProvider', 'Error tracking page view:', error);
        }
      },
      trackNetworkSelection: (networkId: string, ecosystem: string) => {
        try {
          AnalyticsService.trackNetworkSelection(networkId, ecosystem);
        } catch (error) {
          logger.error('AnalyticsProvider', 'Error tracking network selection:', error);
        }
      },
    }),
    [tagId]
  );

  return <AnalyticsContext.Provider value={contextValue}>{children}</AnalyticsContext.Provider>;
};
