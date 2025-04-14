import { useCallback, useEffect, useRef, useState } from 'react';

import type { FormFieldType } from '@openzeppelin/transaction-form-renderer';

import type { ContractSchema } from '../../../../core/types/ContractSchema';
import type { BuilderFormConfig } from '../../../../core/types/FormTypes';
import {
  generateFallbackFields,
  generateFormConfig,
  updateFormConfig,
} from '../../../../services/FormGenerator';

interface UseFormConfigProps {
  contractSchema: ContractSchema | null;
  selectedFunction: string | null;
  onFormConfigUpdated: (config: BuilderFormConfig) => void;
}

export function useFormConfig({
  contractSchema,
  selectedFunction,
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
      !configInitialized.current
    ) {
      try {
        // Use the FormGenerator service to generate the form config
        const config = generateFormConfig(contractSchema, selectedFunction);

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
          const fields = generateFallbackFields(selectedFunctionDetails);

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
  }, [contractSchema, selectedFunction, onFormConfigUpdated]); // Include all dependencies

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

      const updatedConfig = updateFormConfig(formConfig, { fields: updatedFields });

      setFormConfig(updatedConfig);

      // Only notify parent if the config actually changed
      if (JSON.stringify(updatedConfig) !== JSON.stringify(lastParentUpdate.current)) {
        lastParentUpdate.current = updatedConfig;
        onFormConfigUpdated(updatedConfig);
      }
    },
    [formConfig, onFormConfigUpdated]
  );

  const updateFormLayout = useCallback(
    (updates: Partial<BuilderFormConfig['layout']>) => {
      if (!formConfig) return;

      // Create a properly typed update with all required fields
      const layoutUpdates = {
        ...formConfig.layout,
        ...updates,
      };

      const updatedConfig = updateFormConfig(formConfig, { layout: layoutUpdates });

      setFormConfig(updatedConfig);

      // Only notify parent if the config actually changed
      if (JSON.stringify(updatedConfig) !== JSON.stringify(lastParentUpdate.current)) {
        lastParentUpdate.current = updatedConfig;
        onFormConfigUpdated(updatedConfig);
      }
    },
    [formConfig, onFormConfigUpdated]
  );

  const updateFormValidation = useCallback(
    (updates: Partial<BuilderFormConfig['validation']>) => {
      if (!formConfig) return;

      // Create a properly typed update with all required fields
      const validationUpdates = {
        ...formConfig.validation,
        ...updates,
      };

      const updatedConfig = updateFormConfig(formConfig, { validation: validationUpdates });

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

      const updatedConfig = updateFormConfig(formConfig, { title });

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

      const updatedConfig = updateFormConfig(formConfig, { description });

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
    updateFormLayout,
    updateFormValidation,
    updateFormTitle,
    updateFormDescription,
  };
}
