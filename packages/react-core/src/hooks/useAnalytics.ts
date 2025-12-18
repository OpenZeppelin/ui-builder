import { useAnalyticsContext } from './AnalyticsContext';

/**
 * Custom hook for accessing analytics functionality.
 *
 * This hook provides a convenient interface for tracking user interactions
 * throughout the application. It must be used within an AnalyticsProvider.
 *
 * For app-specific tracking methods, create a wrapper hook that uses this
 * hook and adds your custom tracking functions.
 *
 * @example
 * ```tsx
 * // Basic usage
 * function MyComponent() {
 *   const { trackEvent, trackPageView, isEnabled } = useAnalytics();
 *
 *   const handleClick = () => {
 *     trackEvent('button_clicked', { button_name: 'submit' });
 *   };
 *
 *   return (
 *     <div>
 *       Analytics enabled: {isEnabled().toString()}
 *       <button onClick={handleClick}>Submit</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Creating app-specific wrapper hook
 * function useMyAppAnalytics() {
 *   const analytics = useAnalytics();
 *
 *   return {
 *     ...analytics,
 *     trackFormSubmit: (formName: string) => {
 *       analytics.trackEvent('form_submitted', { form_name: formName });
 *     },
 *   };
 * }
 * ```
 *
 * @returns Analytics context with tracking methods and state
 * @throws Error if used outside of AnalyticsProvider
 */
export const useAnalytics = () => {
  try {
    return useAnalyticsContext();
  } catch {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
};
