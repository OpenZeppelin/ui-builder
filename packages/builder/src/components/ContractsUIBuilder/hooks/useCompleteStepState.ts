import { useCallback, useState } from 'react';

import type { ContractSchema, NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';

import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import { downloadBlob } from '../StepComplete/utils';

// Lazy load AppExportSystem to prevent templates from loading on initial page load
const AppExportSystemPromise = import('../../../export').then((module) => module.AppExportSystem);

/**
 * Custom hook to handle the state and actions for the complete step.
 * Manages form export functionality and loading state.
 */
export function useCompleteStepState() {
  const [loading, setLoading] = useState(false);

  const exportApp = useCallback(
    async (
      formConfig: BuilderFormConfig | null,
      networkConfig: NetworkConfig | null,
      selectedFunction: string | null,
      contractSchema: ContractSchema | null
      // TODO: Add a parameter here for uiKitConfiguration from builder UI state
    ) => {
      if (!formConfig || !selectedFunction || !contractSchema || !networkConfig) {
        console.error('exportApp: Missing required configuration for export.');
        return;
      }

      setLoading(true);

      try {
        // Dynamically import AppExportSystem only when needed
        const AppExportSystem = await AppExportSystemPromise;
        const exportSystem = new AppExportSystem();

        const exportOptions = {
          ecosystem: networkConfig.ecosystem,
        };

        const result = await exportSystem.exportApp(
          formConfig,
          contractSchema,
          networkConfig,
          selectedFunction,
          exportOptions
        );

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
    []
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
