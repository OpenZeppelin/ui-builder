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
  // formConfig, // Removed unused prop
}: StepExecutionMethodProps): React.ReactElement {
  // Use the custom hook to manage state and logic
  const {
    formMethods,
    supportedMethods,
    watchedMethodType,
    watchedEoaOption,
    // Get validation state from hook
    validationError,
  } = useExecutionMethodState({ currentConfig, adapter, onUpdateConfig });

  // Generate options - rely solely on adapter's disabled flag
  const primaryMethodOptions = supportedMethods.map((detail: ExecutionMethodDetail) => ({
    value: detail.type,
    label: detail.name,
    disabled: detail.disabled, // Use adapter's value directly
    // TODO: Add description tooltips based on detail.description
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

      {/* Placeholder for Relayer */}
      {watchedMethodType === 'relayer' && (
        <div className="border-border bg-muted/50 mt-4 rounded-md border border-dashed p-4">
          <p className="text-muted-foreground text-center text-sm">
            OpenZeppelin transaction relayer configuration options will be available here in a
            future update.
          </p>
        </div>
      )}

      {/* Placeholder for Multisig */}
      {watchedMethodType === 'multisig' && (
        <div className="border-border bg-muted/50 mt-4 rounded-md border border-dashed p-4">
          <p className="text-muted-foreground text-center text-sm">
            Multisig (e.g., Safe, Squads) configuration options will be available here in a future
            update.
          </p>
        </div>
      )}

      {/* Display validation error if present */}
      {validationError && (
        <div className="border-destructive bg-destructive/10 mt-4 rounded-md border p-3">
          <p className="text-destructive text-sm font-medium">{validationError}</p>
        </div>
      )}
    </div>
  );
}

StepExecutionMethod.displayName = 'StepExecutionMethod';
