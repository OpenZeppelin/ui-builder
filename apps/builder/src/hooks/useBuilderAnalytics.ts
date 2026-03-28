import { useMemo } from 'react';

import { useAnalytics } from '@openzeppelin/ui-react';

/**
 * UI Builder-specific analytics hook.
 * Wraps the shared useAnalytics hook with builder-specific tracking events.
 *
 * Returns a memoized object to ensure stable function references across renders.
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

  return useMemo(
    () => ({
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

      /**
       * Fires when a transaction succeeds from the form preview (e.g. relayer or wallet).
       * @param networkId - Active network id, or `'unknown'` if not yet determined
       * @param ecosystem - Ecosystem id (e.g. `evm`, `stellar`)
       * @param executionMethod - How the tx was sent (e.g. `relayer`, `wallet`)
       */
      trackTransactionExecuted: (networkId: string, ecosystem: string, executionMethod: string) => {
        analytics.trackEvent('transaction_executed', {
          network_id: networkId,
          ecosystem,
          execution_method: executionMethod,
        });
      },

      /**
       * Fires once when a new Contract UI record is first persisted (CREATE auto-save path).
       * @param networkId - Selected or adapter network id, or `'unknown'`
       * @param ecosystem - Selected or adapter ecosystem, or `'unknown'`
       * @param totalRecords - Count of Contract UIs after this create (approximate for analytics)
       */
      trackContractUiCreated: (networkId: string, ecosystem: string, totalRecords: number) => {
        analytics.trackEvent('contract_ui_created', {
          network_id: networkId,
          ecosystem,
          total_records: totalRecords,
        });
      },

      /**
       * Fires when the relayer URL, API key, and relayer selection are all set.
       * @param networkId - Active network id
       * @param ecosystem - Active ecosystem id
       */
      trackRelayerServiceConfigured: (networkId: string, ecosystem: string) => {
        analytics.trackEvent('relayer_service_configured', {
          network_id: networkId,
          ecosystem,
        });
      },

      /**
       * Fires when the user selects a UI kit in builder settings.
       * @param networkId - Active network id
       * @param ecosystem - Active ecosystem id
       * @param uikitName - Selected kit identifier (e.g. `rainbowkit`)
       */
      trackUiKitChanged: (networkId: string, ecosystem: string, uikitName: string) => {
        analytics.trackEvent('uikit_changed', {
          network_id: networkId,
          ecosystem,
          uikit_name: uikitName,
        });
      },

      /**
       * Fires once when the address book dialog opens (false → true), not on network changes while open.
       * @param networkId - Active network id, or `'unknown'`
       * @param ecosystem - Active ecosystem id, or `'unknown'`
       */
      trackAddressBookOpened: (networkId: string, ecosystem: string) => {
        analytics.trackEvent('address_book_opened', {
          network_id: networkId,
          ecosystem,
        });
      },
    }),
    [analytics]
  );
}
