import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  ContractAdapter,
  ContractSchema,
  FormFieldType,
} from '@openzeppelin/transaction-form-types';

import type { BuilderFormConfig } from '../../../../core/types/FormTypes';
import {
  generateFallbackFields,
  generateFormConfig,
  updateFormConfig,
} from '../../../../services/FormGenerator';

interface UseFormConfigProps {
  contractSchema: ContractSchema | null;
  selectedFunction: string | null;
  adapter: ContractAdapter | null;
  onFormConfigUpdated: (config: BuilderFormConfig) => void;
}

export function useFormConfig({
  contractSchema,
  selectedFunction,
  adapter,
  onFormConfigUpdated,
}: UseFormConfigProps) {
  const [formConfig, setFormConfig] = useState<BuilderFormConfig | null>(null);
  const configInitialized = useRef(false);
  const lastSelectedFunction = useRef<string | null>(null);
  const lastParentUpdate = useRef<BuilderFormConfig | null>(null);

  // Only for initial config generation - setup the form config when a function is first selected
  useEffect(() => {
    // Only create config when function changes or if it hasn't been initialized
    const functionChanged = lastSelectedFunction.current !== selectedFunction;
    if (functionChanged) {
      lastSelectedFunction.current = selectedFunction;
      configInitialized.current = false;
    }

    // Get selected function details
    const selectedFunctionDetails = contractSchema?.functions.find(
      (fn) => fn.id === selectedFunction
    );

    // Generate config if needed
    if (
      contractSchema &&
      selectedFunction &&
      selectedFunctionDetails &&
      adapter &&
      !configInitialized.current
    ) {
      try {
        // Use the FormGenerator service to generate the form config
        const config = generateFormConfig(adapter, contractSchema, selectedFunction);

        // Set the flag to prevent re-initialization
        configInitialized.current = true;

        // Update state first
        setFormConfig(config);

        // Track what we're sending to parent to avoid loops
        lastParentUpdate.current = config;

        // Notify parent outside of render/effect cycle
        setTimeout(() => {
          onFormConfigUpdated(config);
        }, 0);
      } catch (error) {
        console.error('Error generating form configuration:', error);

        // If the FormGenerator service fails, use fallback field generation
        if (selectedFunctionDetails) {
          const contractAddress = contractSchema?.address || '';
          const fields = generateFallbackFields(selectedFunctionDetails, contractAddress);

          const config: BuilderFormConfig = {
            functionId: selectedFunction,
            fields,
            layout: {
              columns: 1,
              spacing: 'normal',
              labelPosition: 'top',
            },
            theme: {},
            validation: {
              mode: 'onChange',
              showErrors: 'inline',
            },
            contractAddress,
          };

          // Set the flag to prevent re-initialization
          configInitialized.current = true;

          // Update state first
          setFormConfig(config);

          // Track what we're sending to parent to avoid loops
          lastParentUpdate.current = config;

          // Notify parent outside of render/effect cycle
          setTimeout(() => {
            onFormConfigUpdated(config);
          }, 0);
        }
      }
    }
  }, [contractSchema, selectedFunction, adapter, onFormConfigUpdated]); // Include all dependencies

  // Reset state if function selection changes
  useEffect(() => {
    if (!selectedFunction) {
      setFormConfig(null);
      configInitialized.current = false;
    }
  }, [selectedFunction]);

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

      // Only notify parent if the config actually changed
      if (JSON.stringify(updatedConfig) !== JSON.stringify(lastParentUpdate.current)) {
        lastParentUpdate.current = updatedConfig;
        onFormConfigUpdated(updatedConfig);
      }
    },
    [formConfig, onFormConfigUpdated]
  );

  const updateFormTitle = useCallback(
    (title: string) => {
      if (!formConfig) return;

      const updatedConfig = updateFormConfig(formConfig, {
        title,
        contractAddress: formConfig.contractAddress,
      });

      setFormConfig(updatedConfig);

      // Only notify parent if the config actually changed
      if (JSON.stringify(updatedConfig) !== JSON.stringify(lastParentUpdate.current)) {
        lastParentUpdate.current = updatedConfig;
        onFormConfigUpdated(updatedConfig);
      }
    },
    [formConfig, onFormConfigUpdated]
  );

  const updateFormDescription = useCallback(
    (description: string) => {
      if (!formConfig) return;

      const updatedConfig = updateFormConfig(formConfig, {
        description,
        contractAddress: formConfig.contractAddress,
      });

      setFormConfig(updatedConfig);

      // Only notify parent if the config actually changed
      if (JSON.stringify(updatedConfig) !== JSON.stringify(lastParentUpdate.current)) {
        lastParentUpdate.current = updatedConfig;
        onFormConfigUpdated(updatedConfig);
      }
    },
    [formConfig, onFormConfigUpdated]
  );

  return {
    formConfig,
    updateField,
    updateFormTitle,
    updateFormDescription,
  };
}
