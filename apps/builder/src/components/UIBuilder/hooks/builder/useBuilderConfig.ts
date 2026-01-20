import { useCallback } from 'react';

import { useWalletState } from '@openzeppelin/ui-react';
import { ExecutionConfig, UiKitConfiguration } from '@openzeppelin/ui-types';

import { BuilderFormConfig } from '@/core/types/FormTypes';

import { uiBuilderStore } from '../uiBuilderStore';

/**
 * @notice A hook for updating the UI configuration.
 * @returns An object with functions to update form, execution, and UI kit configurations.
 */
export function useBuilderConfig() {
  const { reconfigureActiveAdapterUiKit } = useWalletState();

  const handleFormConfigUpdated = useCallback((config: Partial<BuilderFormConfig>) => {
    uiBuilderStore.updateState((s) => ({
      formConfig: s.formConfig ? { ...s.formConfig, ...config } : (config as BuilderFormConfig),
    }));
  }, []);

  const handleExecutionConfigUpdated = useCallback(
    (execConfig: ExecutionConfig | undefined, isValid: boolean) => {
      uiBuilderStore.updateState((s) => ({
        formConfig: s.formConfig
          ? { ...s.formConfig, executionConfig: execConfig }
          : s.selectedFunction && s.contractState.address
            ? {
                functionId: s.selectedFunction,
                contractAddress: s.contractState.address,
                fields: [],
                layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
                validation: { mode: 'onChange', showErrors: 'inline' },
                executionConfig: execConfig,
              }
            : s.formConfig,
        isExecutionStepValid: isValid,
      }));
    },
    []
  );

  const handleUiKitConfigUpdated = useCallback(
    (uiKitConfig: UiKitConfiguration) => {
      uiBuilderStore.updateState((s) => ({
        formConfig: s.formConfig ? { ...s.formConfig, uiKitConfig } : null,
      }));
      reconfigureActiveAdapterUiKit(uiKitConfig);
    },
    [reconfigureActiveAdapterUiKit]
  );

  return {
    form: handleFormConfigUpdated,
    execution: handleExecutionConfigUpdated,
    uiKit: handleUiKitConfigUpdated,
  };
}
