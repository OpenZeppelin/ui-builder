import React from 'react';

import { EoaConfiguration } from './components/EoaConfiguration';
import { PrimaryMethodSelector } from './components/PrimaryMethodSelector';
import { useExecutionMethodState } from './hooks/useExecutionMethodState';

import type { ExecutionMethodDetail } from '../../../core/types/FormTypes';
// Import types, hook, and sub-components directly from their files
import type { StepExecutionMethodProps } from './types';

export function StepExecutionMethod({
  // Destructure props
  currentConfig,
  onUpdateConfig,
  adapter,
  formConfig, // Keep formConfig if needed by potential future logic
}: StepExecutionMethodProps): React.ReactElement {
  // Use the custom hook to manage state and logic
  const {
    formMethods,
    supportedMethods,
    watchedMethodType,
    watchedEoaOption,
    // TODO: Get validation state from hook later
  } = useExecutionMethodState({ currentConfig, adapter, onUpdateConfig });

  // Generate options for the primary selector
  const primaryMethodOptions = supportedMethods.map((detail: ExecutionMethodDetail) => ({
    value: detail.type,
    label: detail.name,
    disabled: detail.type !== 'eoa' || detail.disabled, // Initially only allow EOA
    // TODO: Add description tooltips
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Configure Execution Method</h2>

      {/* Render Primary Method Selector Sub-component */}
      <PrimaryMethodSelector
        control={formMethods.control}
        adapterAvailable={!!adapter}
        options={primaryMethodOptions}
      />

      {/* Render EOA Configuration Sub-component Conditionally */}
      {watchedMethodType === 'eoa' && (
        <EoaConfiguration
          control={formMethods.control}
          adapter={adapter}
          watchedEoaOption={watchedEoaOption}
        />
      )}

      {/* TODO: Add display area for final adapter validation error */}
      {/* Example: <div className="text-sm text-destructive pt-2">{validationError}</div> */}
    </div>
  );
}

StepExecutionMethod.displayName = 'StepExecutionMethod';
