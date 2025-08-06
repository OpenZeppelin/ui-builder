import { useAnalyticsContext } from './AnalyticsContext';

/**
 * Custom hook for accessing analytics functionality
 *
 * This hook provides a convenient interface for tracking user interactions
 * throughout the application. It must be used within an AnalyticsProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { trackEcosystemSelection, isEnabled } = useAnalytics();
 *
 *   const handleEcosystemChange = (ecosystem: string) => {
 *     trackEcosystemSelection(ecosystem);
 *   };
 *
 *   return (
 *     <div>
 *       Analytics enabled: {isEnabled.toString()}
 *       <button onClick={() => handleEcosystemChange('evm')}>
 *         Select EVM
 *       </button>
 *     </div>
 *   );
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
