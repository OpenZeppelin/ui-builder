// Re-export shared analytics from react-core for convenience
export {
  useAnalytics,
  AnalyticsProvider,
  type AnalyticsProviderProps,
  type AnalyticsContextValue,
} from '@openzeppelin/ui-react';

// Builder-specific analytics hook
export { useBuilderAnalytics } from './useBuilderAnalytics';
