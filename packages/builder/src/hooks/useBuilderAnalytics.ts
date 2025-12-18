import { useAnalytics } from '@openzeppelin/ui-builder-react-core';

/**
 * UI Builder-specific analytics hook.
 * Wraps the shared useAnalytics hook with builder-specific tracking events.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { trackEcosystemSelection, trackWizardStep } = useBuilderAnalytics();
 *
 *   const handleEcosystemChange = (ecosystem: string) => {
 *     trackEcosystemSelection(ecosystem);
 *   };
 *
 *   return <EcosystemSelector onChange={handleEcosystemChange} />;
 * }
 * ```
 */
export function useBuilderAnalytics() {
  const analytics = useAnalytics();

  return {
    ...analytics,

    /**
     * Track ecosystem selection event.
     * @param ecosystem - Selected ecosystem (e.g., 'evm', 'solana', 'stellar')
     */
    trackEcosystemSelection: (ecosystem: string) => {
      analytics.trackEvent('ecosystem_selected', { ecosystem });
    },

    /**
     * Track export action event.
     * @param exportType - Type of export (e.g., 'react-vite')
     */
    trackExportAction: (exportType: string) => {
      analytics.trackEvent('export_clicked', { export_type: exportType });
    },

    /**
     * Track wizard step progression.
     * @param stepNumber - Current step number
     * @param stepName - Name/identifier of the step
     */
    trackWizardStep: (stepNumber: number, stepName: string) => {
      analytics.trackEvent('wizard_step', { step_number: stepNumber, step_name: stepName });
    },

    /**
     * Track sidebar interaction event.
     * @param action - Action performed (e.g., 'import', 'export')
     */
    trackSidebarInteraction: (action: string) => {
      analytics.trackEvent('sidebar_interaction', { action });
    },
  };
}
