import { useCallback, useState } from 'react';

import type { ChainType } from '@openzeppelin/transaction-form-types/contracts';

import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import { FormExportSystem } from '../../../export';
import { downloadBlob } from '../StepComplete/utils';

/**
 * Custom hook to handle the state and actions for the complete step.
 * Manages form export functionality and loading state.
 */
export function useCompleteStepState() {
  const [loading, setLoading] = useState(false);

  const exportForm = useCallback(
    async (
      formConfig: BuilderFormConfig | null,
      selectedChain: ChainType,
      selectedFunction: string | null
    ) => {
      if (!formConfig || !selectedFunction) return;

      setLoading(true);
      const exportSystem = new FormExportSystem();

      try {
        const result = await exportSystem.exportForm(formConfig, selectedChain, selectedFunction, {
          chainType: selectedChain,
        });

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
    exportForm,
    resetLoadingState,
  };
}
