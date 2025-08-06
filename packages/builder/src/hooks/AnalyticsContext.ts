import { createContext, useContext } from 'react';

import { AnalyticsContextValue } from './AnalyticsProvider';

/**
 * Analytics context
 */
export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

/**
 * Custom hook to access analytics functionality
 * Must be used within an AnalyticsProvider
 */
export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};
