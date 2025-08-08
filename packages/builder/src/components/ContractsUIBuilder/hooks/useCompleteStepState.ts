import { useCallback, useState } from 'react';

import type { ContractSchema, NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { downloadBlob } from '../StepComplete/utils';

// Lazy load AppExportSystem to prevent templates from loading on initial page load
const AppExportSystemPromise = import('../../../export').then((module) => module.AppExportSystem);

/**
 * Custom hook to handle the state and actions for the complete step.
 * Manages form export functionality and loading state.
 */
export function useCompleteStepState() {
  const [loading, setLoading] = useState(false);
  const { trackExportAction } = useAnalytics();

  const exportApp = useCallback(
    async (
      formConfig: BuilderFormConfig | null,
      networkConfig: NetworkConfig | null,
      selectedFunction: string | null,
      contractSchema: ContractSchema | null
      // TODO: Add a parameter here for uiKitConfiguration from builder UI state
    ) => {
      if (!formConfig || !selectedFunction || !contractSchema || !networkConfig) {
        logger.error(
          'useCompleteStepState',
          'exportApp: Missing required configuration for export.'
        );
        return;
      }

      setLoading(true);

      try {
        // Dynamically import AppExportSystem only when needed
        const AppExportSystem = await AppExportSystemPromise;
        const exportSystem = new AppExportSystem();

        // Determine export environment from build-time env var
        // - 'local' for CLI/development: uses workspace:* (latest local code)
        // - 'staging' for staging UI: uses RC versions (latest unpublished features)
        // - 'production' for production: uses stable published package versions
        //
        // TRANSITION NOTE: Once packages are published to public npm,
        // RC versions will be automatically available via standard npm install
        const exportEnv = import.meta.env.VITE_EXPORT_ENV as
          | 'local'
          | 'staging'
          | 'production'
          | undefined;

        const exportOptions = {
          ecosystem: networkConfig.ecosystem,
          env: exportEnv || 'production',
        };

        const result = await exportSystem.exportApp(
          formConfig,
          contractSchema,
          networkConfig,
          selectedFunction,
          exportOptions
        );

        // Track successful export action
        trackExportAction('react-vite'); // Default export type - could be made dynamic based on template choice

        if (result.data instanceof Blob) {
          downloadBlob(result.data, result.fileName);
        } else if (
          typeof window !== 'undefined' &&
          window.Blob &&
          result.data instanceof ArrayBuffer
        ) {
          downloadBlob(new Blob([result.data]), result.fileName);
        } else {
          alert('Export is only supported in the browser.');
        }
      } catch (err) {
        alert('Failed to export form: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    },
    [trackExportAction]
  );

  // Reset loading state when dependencies change
  const resetLoadingState = useCallback(() => {
    if (loading) {
      setLoading(false);
    }
  }, [loading]);

  return {
    loading,
    exportApp,
    resetLoadingState,
  };
}
