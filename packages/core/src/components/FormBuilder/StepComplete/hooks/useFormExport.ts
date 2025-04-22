import { useCallback, useEffect, useState } from 'react';

import type { ChainType } from '@openzeppelin/transaction-form-types/contracts';

import type { BuilderFormConfig } from '../../../../core/types/FormTypes';
import { FormExportSystem } from '../../../../export';
import { downloadBlob } from '../utils';

interface UseFormExportParams {
  formConfig: BuilderFormConfig | null;
  selectedChain: ChainType;
  selectedFunction: string | null;
}

/**
 * Custom hook to handle exporting a form configuration as a downloadable file.
 * Handles browser-specific logic and error handling.
 */
export function useFormExport({
  formConfig,
  selectedChain,
  selectedFunction,
}: UseFormExportParams) {
  const [loading, setLoading] = useState(false);

  // Reset loading state if dependencies change
  useEffect(() => {
    if (loading) {
      setLoading(false);
    }
  }, [formConfig, selectedChain, selectedFunction]);

  const exportForm = useCallback(async () => {
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
  }, [formConfig, selectedChain, selectedFunction]);

  return { exportForm, loading };
}
