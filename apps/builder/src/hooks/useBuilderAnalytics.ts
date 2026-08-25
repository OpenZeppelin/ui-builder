import { useMemo } from 'react';

import { useAnalytics } from '@openzeppelin/ui-react';

/**
 * GA4 rejects/ignores empty parameter values and `undefined` would silently drop the dimension,
 * so every string dimension falls back to `'unknown'` to keep custom dimension reports complete.
 */
const UNKNOWN = 'unknown';

function orUnknown(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : UNKNOWN;
}

/**
 * Network context shared by most builder events. Both values are optional at the call site
 * (e.g. the wizard before a network is chosen) and normalised to `'unknown'` when missing.
 */
export interface AnalyticsNetworkContext {
  networkId?: string | null;
  ecosystem?: string | null;
}

function networkParams(context: AnalyticsNetworkContext | undefined) {
  return {
    network_id: orUnknown(context?.networkId),
    ecosystem: orUnknown(context?.ecosystem),
  };
}

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
        analytics.trackEvent('ecosystem_selected', { ecosystem: orUnknown(ecosystem) });
      },

      /**
       * Fires once when an app export completes successfully.
       * @param exportType - Type of export (e.g., 'react-vite')
       * @param context - Network the exported app targets
       */
      trackExportAction: (exportType: string, context?: AnalyticsNetworkContext) => {
        analytics.trackEvent('export_clicked', {
          export_type: orUnknown(exportType),
          ...networkParams(context),
        });
      },

      /**
       * Fires once per Next/Back click in the wizard, describing the step being entered.
       * @param stepNumber - 1-indexed step number being entered
       * @param stepName - Name/identifier of the step being entered
       * @param context - Network selected so far (`'unknown'` before chain selection)
       */
      trackWizardStep: (
        stepNumber: number,
        stepName: string,
        context?: AnalyticsNetworkContext
      ) => {
        analytics.trackEvent('wizard_step', {
          step_number: stepNumber,
          step_name: orUnknown(stepName),
          ...networkParams(context),
        });
      },

      /**
       * Fires once per sidebar Import/Export click.
       * @param action - Action performed (e.g., 'import', 'export')
       * @param context - Network currently selected in the builder
       */
      trackSidebarInteraction: (action: string, context?: AnalyticsNetworkContext) => {
        analytics.trackEvent('sidebar_interaction', {
          action: orUnknown(action),
          ...networkParams(context),
        });
      },

      /**
       * Fires when a transaction succeeds from the form preview (e.g. relayer or wallet).
       * @param networkId - Active network id, or `'unknown'` if not yet determined
       * @param ecosystem - Ecosystem id (e.g. `evm`, `stellar`)
       * @param executionMethod - How the tx was sent (e.g. `relayer`, `wallet`)
       */
      trackTransactionExecuted: (networkId: string, ecosystem: string, executionMethod: string) => {
        analytics.trackEvent('transaction_executed', {
          ...networkParams({ networkId, ecosystem }),
          execution_method: orUnknown(executionMethod),
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
          ...networkParams({ networkId, ecosystem }),
          total_records: totalRecords,
        });
      },

      /**
       * Fires when the relayer URL, API key, and relayer selection are all set.
       * @param networkId - Active network id
       * @param ecosystem - Active ecosystem id
       */
      trackRelayerServiceConfigured: (networkId: string, ecosystem: string) => {
        analytics.trackEvent('relayer_service_configured', networkParams({ networkId, ecosystem }));
      },

      /**
       * Fires when the user selects a UI kit in builder settings.
       * @param networkId - Active network id
       * @param ecosystem - Active ecosystem id
       * @param uikitName - Selected kit identifier (e.g. `rainbowkit`)
       */
      trackUiKitChanged: (networkId: string, ecosystem: string, uikitName: string) => {
        analytics.trackEvent('uikit_changed', {
          ...networkParams({ networkId, ecosystem }),
          uikit_name: orUnknown(uikitName),
        });
      },

      /**
       * Fires once when the address book dialog opens (false → true), not on network changes while open.
       * @param networkId - Active network id, or `'unknown'`
       * @param ecosystem - Active ecosystem id, or `'unknown'`
       */
      trackAddressBookOpened: (networkId: string, ecosystem: string) => {
        analytics.trackEvent('address_book_opened', networkParams({ networkId, ecosystem }));
      },
    }),
    [analytics]
  );
}
