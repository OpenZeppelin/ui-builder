import { deepEqual } from 'fast-equals';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  ContractAdapter,
  ContractSchema,
  FormFieldType,
} from '@openzeppelin/contracts-ui-builder-types';

import type { BuilderFormConfig } from '../../../../core/types/FormTypes';
import {
  generateFallbackFields,
  generateFormConfig,
  updateFormConfig,
} from '../../../../services/FormGenerator';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

interface UseFormConfigProps {
  contractSchema: ContractSchema | null;
  selectedFunction: string | null;
  adapter: ContractAdapter | null;
  onFormConfigUpdated: (config: BuilderFormConfig) => void;
  existingFormConfig?: BuilderFormConfig | null;
}

export function useFormConfig({
  contractSchema,
  selectedFunction,
  adapter,
  onFormConfigUpdated,
  existingFormConfig,
}: UseFormConfigProps) {
  const [formConfig, setFormConfig] = useState<BuilderFormConfig | null>(
    existingFormConfig || null
  );
  const configInitialized = useRef(!!existingFormConfig);

  /**
   * Effect 1: Reset config when the selected function is cleared.
   * This ensures that no stale form configuration persists if the user
   * navigates back and deselects a function.
   */
  useEffect(() => {
    if (!selectedFunction) {
      setFormConfig(null);
      configInitialized.current = false;
    }
  }, [selectedFunction]);

  /**
   * Effect 2: Update internal state when a new `existingFormConfig` is loaded from props.
   * This handles the scenario where a saved contract UI is loaded from storage,
   * ensuring the hook's internal state syncs with the parent's state.
   */
  useEffect(() => {
    if (existingFormConfig && !deepEqual(existingFormConfig, formConfig)) {
      setFormConfig(existingFormConfig);
      configInitialized.current = true;
    }
  }, [existingFormConfig, formConfig]);

  /**
   * Effect 3: Generate a new form config when a function is selected for the first time.
   * This is the core logic for auto-generating the form layout and fields based on the
   * contract's schema and the selected function. It runs only when no configuration has
   * been initialized yet.
   */
  useEffect(() => {
    if (configInitialized.current) {
      return;
    }

    const selectedFunctionDetails = contractSchema?.functions.find(
      (fn) => fn.id === selectedFunction
    );

    if (contractSchema && selectedFunction && selectedFunctionDetails && adapter) {
      try {
        const newConfig = generateFormConfig(adapter, contractSchema, selectedFunction);
        setFormConfig(newConfig);
        onFormConfigUpdated(newConfig);
        configInitialized.current = true;
      } catch (error) {
        logger.error('useFormConfig', 'Error generating form configuration:', error);
        if (selectedFunctionDetails) {
          const contractAddress = contractSchema?.address || '';
          const fields = generateFallbackFields(selectedFunctionDetails, contractAddress);
          const fallbackConfig: BuilderFormConfig = {
            functionId: selectedFunction,
            fields,
            layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
            theme: {},
            validation: { mode: 'onChange', showErrors: 'inline' },
            contractAddress,
          };
          setFormConfig(fallbackConfig);
          onFormConfigUpdated(fallbackConfig);
          configInitialized.current = true;
        }
      }
    }
  }, [contractSchema, selectedFunction, adapter, onFormConfigUpdated, configInitialized.current]);

  /**
   * Updates a specific field in the form configuration.
   * This function creates a new configuration object with the updated field
   * and notifies the parent component of the change.
   * @param index The index of the field to update.
   * @param updates A partial object of the field properties to update.
   */
  const updateField = useCallback(
    (index: number, updates: Partial<FormFieldType>) => {
      if (!formConfig) return;

      const updatedFields = [...formConfig.fields];
      updatedFields[index] = { ...updatedFields[index], ...updates };

      const updatedConfig = updateFormConfig(formConfig, {
        fields: updatedFields,
        contractAddress: formConfig.contractAddress,
      });

      setFormConfig(updatedConfig);
      onFormConfigUpdated(updatedConfig);
    },
    [formConfig, onFormConfigUpdated]
  );

  /**
   * Updates the title of the form configuration.
   * @param title The new title for the form.
   */
  const updateFormTitle = useCallback(
    (title: string) => {
      if (!formConfig) return;

      const updatedConfig = updateFormConfig(formConfig, {
        title,
        contractAddress: formConfig.contractAddress,
      });

      setFormConfig(updatedConfig);
      onFormConfigUpdated(updatedConfig);
    },
    [formConfig, onFormConfigUpdated]
  );

  /**
   * Updates the description of the form configuration.
   * @param description The new description for the form.
   */
  const updateFormDescription = useCallback(
    (description: string) => {
      if (!formConfig) return;

      const updatedConfig = updateFormConfig(formConfig, {
        description,
        contractAddress: formConfig.contractAddress,
      });

      setFormConfig(updatedConfig);
      onFormConfigUpdated(updatedConfig);
    },
    [formConfig, onFormConfigUpdated]
  );

  return {
    formConfig: formConfig || existingFormConfig || null,
    updateField,
    updateFormTitle,
    updateFormDescription,
  };
}
