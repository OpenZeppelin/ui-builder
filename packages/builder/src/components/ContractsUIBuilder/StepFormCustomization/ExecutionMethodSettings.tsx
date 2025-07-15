import React from 'react';

import type {
  ContractAdapter,
  ExecutionConfig,
  ExecutionMethodDetail,
} from '@openzeppelin/contracts-ui-builder-types';

import { PrimaryMethodSelector } from './components/PrimaryMethodSelector';
import { useExecutionMethodState } from './hooks/useExecutionMethodState';

export interface ExecutionMethodSettingsProps {
  currentConfig?: ExecutionConfig;
  onUpdateConfig: (config: ExecutionConfig | undefined, isValid: boolean) => void;
  adapter: ContractAdapter | null;
  isWidgetExpanded?: boolean;
}

export function ExecutionMethodSettings({
  currentConfig,
  onUpdateConfig,
  adapter,
  isWidgetExpanded = false,
}: ExecutionMethodSettingsProps): React.ReactElement {
  // Use the custom hook to manage state and logic
  const { formMethods, supportedMethods, watchedEoaOption, validationError } =
    useExecutionMethodState({ currentConfig, adapter, onUpdateConfig });

  // Generate options - rely solely on adapter's disabled flag
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
        adapterAvailable={!!adapter}
        options={primaryMethodOptions}
        watchedEoaOption={watchedEoaOption}
        adapter={adapter}
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
