import React from 'react';

import type { ExecutionConfig, ExecutionMethodDetail } from '@openzeppelin/ui-types';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

import { PrimaryMethodSelector } from './components/PrimaryMethodSelector';
import { useExecutionMethodState } from './hooks/useExecutionMethodState';

export interface ExecutionMethodSettingsProps {
  currentConfig?: ExecutionConfig;
  onUpdateConfig: (config: ExecutionConfig | undefined, isValid: boolean) => void;
  runtime: BuilderRuntime | null;
  isWidgetExpanded?: boolean;
}

export function ExecutionMethodSettings({
  currentConfig,
  onUpdateConfig,
  runtime,
  isWidgetExpanded = false,
}: ExecutionMethodSettingsProps): React.ReactElement {
  // Use the custom hook to manage state and logic
  const { formMethods, supportedMethods, watchedEoaOption, validationError } =
    useExecutionMethodState({ currentConfig, runtime, onUpdateConfig });

  // Generate options - rely solely on runtime's disabled flag
  const primaryMethodOptions = supportedMethods.map((detail: ExecutionMethodDetail) => ({
    value: detail.type,
    label: detail.name,
    disabled: detail.disabled,
  }));

  return (
    <div className="space-y-6">
      {/* Render Primary Method Selector with embedded configuration panels */}
      <PrimaryMethodSelector
        control={formMethods.control}
        runtimeAvailable={!!runtime}
        options={primaryMethodOptions}
        watchedEoaOption={watchedEoaOption}
        runtime={runtime}
        setValue={formMethods.setValue}
        isWidgetExpanded={isWidgetExpanded}
      />

      {/* Display validation error if present */}
      {validationError && (
        <div className="border-destructive bg-destructive/10 mt-4 rounded-md border p-3">
          <p className="text-destructive text-sm font-medium">{validationError}</p>
        </div>
      )}
    </div>
  );
}

ExecutionMethodSettings.displayName = 'ExecutionMethodSettings';
