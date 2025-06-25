import { useEffect, useMemo } from 'react';

import { useWalletState } from '@openzeppelin/transaction-form-react-core';
import {
  ContractSchema,
  NetworkConfig,
  UiKitConfiguration,
} from '@openzeppelin/transaction-form-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@openzeppelin/transaction-form-ui';

import { ensureCompleteConfig } from '@/components/FormBuilder/StepFormCustomization/utils/executionUtils';

import type { BuilderFormConfig, ExecutionConfig } from '../../../core/types/FormTypes';
import { ActionBar } from '../../Common/ActionBar';
import { StepTitleWithDescription } from '../Common';
import { ExecutionMethodSettings } from '../StepFormCustomization/ExecutionMethodSettings';
import { useWizardStepUiState } from '../hooks/useWizardStepUiState';

import { UiKitSettings } from './components/UiKitSettings';
import { useFieldSelection } from './hooks/useFieldSelection';
import { useFormConfig } from './hooks/useFormConfig';

import { FieldEditor } from './FieldEditor';
import { FieldSelectorList } from './FieldSelectorList';
import { FormPreview } from './FormPreview';
import { GeneralSettings } from './GeneralSettings';

// TODO: Enhance the UiKitSettings component to support more advanced options from UiKitConfiguration,
// such as `showInjectedConnector` and component exclusions (e.g., hiding NetworkSwitcher).
// This data is already being stored in `formConfig.uiKitConfig` and just needs the UI controls.
// The final `uiKitConfig` also needs to be wired into the export system via `ExportOptions.uiKitConfiguration`.

interface StepFormCustomizationProps {
  contractSchema: ContractSchema | null;
  selectedFunction: string | null;
  networkConfig: NetworkConfig | null;
  onFormConfigUpdated: (config: Partial<BuilderFormConfig>) => void;
  onExecutionConfigUpdated?: (execConfig: ExecutionConfig | undefined, isValid: boolean) => void;
  currentExecutionConfig?: ExecutionConfig;
  onToggleContractState?: () => void;
  isWidgetExpanded?: boolean;
  onUiKitConfigUpdated: (config: UiKitConfiguration) => void;
  currentUiKitConfig?: UiKitConfiguration;
}

export function StepFormCustomization({
  contractSchema,
  selectedFunction,
  networkConfig,
  onFormConfigUpdated,
  onExecutionConfigUpdated,
  currentExecutionConfig,
  onToggleContractState,
  isWidgetExpanded,
  onUiKitConfigUpdated,
  currentUiKitConfig,
}: StepFormCustomizationProps) {
  const [{ activeTab, previewMode }, setUiState] = useWizardStepUiState('stepCustomize', {
    activeTab: 'general',
    previewMode: false,
  });

  const { activeAdapter: adapter, isAdapterLoading: adapterLoading } = useWalletState();

  const {
    formConfig: baseFormConfigFromHook,
    updateField,
    updateFormTitle,
    updateFormDescription,
  } = useFormConfig({
    contractSchema,
    selectedFunction,
    adapter,
    onFormConfigUpdated,
  });

  const { selectedFieldIndex, selectField } = useFieldSelection();

  // Find the selected function details using memoization
  const selectedFunctionDetails = useMemo(() => {
    return contractSchema?.functions.find((fn) => fn.id === selectedFunction) || null;
  }, [contractSchema, selectedFunction]);

  const handleUiKitConfigUpdate = (config: UiKitConfiguration) => {
    // For runtime UI updates, exclude customCode to prevent reinitialization
    const runtimeConfig: UiKitConfiguration = {
      kitName: config.kitName,
      kitConfig: config.kitConfig,
      // Intentionally omit customCode for runtime
    };

    // Only trigger UI update if runtime config actually changed
    if (
      currentUiKitConfig?.kitName !== runtimeConfig.kitName ||
      JSON.stringify(currentUiKitConfig?.kitConfig) !== JSON.stringify(runtimeConfig.kitConfig)
    ) {
      onUiKitConfigUpdated(runtimeConfig);
    }

    // Always save the full config (including customCode) for export
    onFormConfigUpdated({ uiKitConfig: config });
  };

  const formConfigForPreview = useMemo(() => {
    if (!baseFormConfigFromHook) return null;
    return {
      ...baseFormConfigFromHook,
      executionConfig: currentExecutionConfig,
    };
  }, [baseFormConfigFromHook, currentExecutionConfig]);

  // Ensure execution config validation happens on mount if no config exists
  useEffect(() => {
    if (adapter && onExecutionConfigUpdated && !currentExecutionConfig) {
      // Create a default EOA config and validate it
      const defaultConfig = ensureCompleteConfig({ method: 'eoa', allowAny: true });
      if (defaultConfig) {
        // For the initial validation, we know EOA with allowAny is always valid
        onExecutionConfigUpdated(defaultConfig, true);
      }
    }
  }, [adapter, currentExecutionConfig, onExecutionConfigUpdated]);

  useEffect(() => {
    if (
      activeTab === 'fields' &&
      selectedFieldIndex === null &&
      baseFormConfigFromHook &&
      baseFormConfigFromHook.fields.length > 0
    ) {
      selectField(0);
    }
  }, [activeTab, baseFormConfigFromHook, selectedFieldIndex, selectField]);

  const handleTogglePreview = () => {
    setUiState({ previewMode: !previewMode });
  };

  if (
    !contractSchema ||
    !selectedFunction ||
    !selectedFunctionDetails ||
    !(previewMode ? formConfigForPreview : baseFormConfigFromHook)
  ) {
    return (
      <div className="py-8 text-center">
        <p>Please select a contract function first.</p>
      </div>
    );
  }

  if (adapterLoading) {
    return (
      <div className="py-8 text-center">
        <p>Loading adapter...</p>
      </div>
    );
  }

  if (!adapter && networkConfig) {
    return (
      <div className="py-8 text-center text-red-600">
        <p>
          Failed to load adapter for the selected network. Please try again or select a different
          network.
        </p>
      </div>
    );
  }

  if (!adapter) {
    return (
      <div className="py-8 text-center">
        <p>Adapter not available. Please ensure network is selected and supported.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {networkConfig && (
        <ActionBar
          network={networkConfig}
          contractAddress={contractSchema.address}
          onToggleContractState={onToggleContractState}
          isWidgetExpanded={isWidgetExpanded}
          showPreviewButton={true}
          isPreviewMode={previewMode}
          onTogglePreview={handleTogglePreview}
        />
      )}

      <StepTitleWithDescription
        title="Customize"
        description={
          <>
            Customize the form fields and general settings for the &quot;
            {selectedFunctionDetails.displayName}&quot; function.
          </>
        }
      />

      {previewMode ? (
        <FormPreview
          formConfig={formConfigForPreview!}
          functionDetails={selectedFunctionDetails!}
          contractSchema={contractSchema!}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={(newTab) => setUiState({ activeTab: newTab })}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="execution">Execution Method</TabsTrigger>
            <TabsTrigger value="uikit">UI Kit</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 rounded-md border p-4">
            {baseFormConfigFromHook && (
              <GeneralSettings
                title={baseFormConfigFromHook.title}
                description={baseFormConfigFromHook.description}
                onUpdateTitle={updateFormTitle}
                onUpdateDescription={updateFormDescription}
                selectedFunctionDetails={selectedFunctionDetails}
              />
            )}
          </TabsContent>

          <TabsContent value="fields" className="mt-4 rounded-md border p-4">
            {baseFormConfigFromHook && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FieldSelectorList
                    fields={baseFormConfigFromHook.fields}
                    selectedFieldIndex={selectedFieldIndex}
                    onSelectField={selectField}
                  />
                  <div className="col-span-2">
                    {selectedFieldIndex !== null &&
                      baseFormConfigFromHook.fields[selectedFieldIndex] &&
                      adapter && (
                        <FieldEditor
                          field={baseFormConfigFromHook.fields[selectedFieldIndex]}
                          onUpdate={(updates) => updateField(selectedFieldIndex, updates)}
                          adapter={adapter}
                          originalParameterType={
                            baseFormConfigFromHook.fields[selectedFieldIndex].originalParameterType
                          }
                        />
                      )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="execution" className="mt-4 rounded-md border p-4">
            {adapter && (
              <ExecutionMethodSettings
                adapter={adapter}
                currentConfig={currentExecutionConfig}
                onUpdateConfig={onExecutionConfigUpdated || (() => {})}
              />
            )}
          </TabsContent>

          <TabsContent value="uikit" className="mt-4 rounded-md border p-4">
            {adapter && (
              <UiKitSettings
                adapter={adapter}
                onUpdateConfig={handleUiKitConfigUpdate}
                currentConfig={currentUiKitConfig}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
