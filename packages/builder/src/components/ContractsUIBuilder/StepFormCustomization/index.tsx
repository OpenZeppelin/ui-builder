import { FormInput } from 'lucide-react';
import { useEffect, useMemo } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';
import {
  ContractSchema,
  ExecutionConfig,
  NetworkConfig,
  UiKitConfiguration,
} from '@openzeppelin/contracts-ui-builder-types';
import {
  EmptyState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@openzeppelin/contracts-ui-builder-ui';

import { useFieldSelection } from './hooks/useFieldSelection';
import { useFormConfig } from './hooks/useFormConfig';
import { ensureCompleteConfig } from './utils/executionUtils';

import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import { ActionBar } from '../../Common/ActionBar';
import { useWizardStepUiState } from '../hooks/useWizardStepUiState';
import { UiKitSettings } from './components';
import { ExecutionMethodSettings } from './ExecutionMethodSettings';
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
  currentFormConfig?: BuilderFormConfig | null;
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
  currentFormConfig,
}: StepFormCustomizationProps) {
  const {
    stepUiState: { activeTab, previewMode, selectedFieldIndex },
    setStepUiState: setUiState,
  } = useWizardStepUiState('stepCustomize', {
    activeTab: 'general',
    previewMode: false,
    selectedFieldIndex: null as number | null,
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
    existingFormConfig: currentFormConfig,
  });

  const { selectField } = useFieldSelection({
    onSelectField: (index) => setUiState({ selectedFieldIndex: index }),
  });

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
    // We intentionally omit `selectedFieldIndex` from the dependency array.
    // Including it would cause the effect to re-run after the first field is selected,
    // which is unnecessary and not the intended behavior. This effect should only
    // set the *initial* selection when the tab becomes active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, baseFormConfigFromHook, selectField]);

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

      {previewMode ? (
        <FormPreview
          formConfig={formConfigForPreview!}
          functionDetails={selectedFunctionDetails!}
          contractSchema={contractSchema!}
        />
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(newTab) =>
            setUiState({ activeTab: newTab as 'general' | 'fields' | 'execution' | 'uikit' })
          }
        >
          <div className="w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="w-max sm:w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="execution">Execution Method</TabsTrigger>
              <TabsTrigger value="uikit">UI Kit</TabsTrigger>
            </TabsList>
          </div>

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
                {baseFormConfigFromHook.fields.length === 0 ? (
                  <EmptyState
                    icon={<FormInput className="h-6 w-6 text-muted-foreground" />}
                    title="No Fields to Configure"
                    description="This function doesn't require any input parameters, so there are no form fields to customize. You can proceed to configure the execution method or preview your form."
                  />
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <FieldSelectorList
                      fields={baseFormConfigFromHook.fields}
                      selectedFieldIndex={selectedFieldIndex}
                      onSelectField={selectField}
                    />
                    <div className="col-span-2">
                      {(() => {
                        // Show first field if none is selected but fields exist
                        const effectiveSelectedIndex = selectedFieldIndex ?? 0;
                        const selectedField = baseFormConfigFromHook.fields[effectiveSelectedIndex];

                        if (selectedField && adapter) {
                          return (
                            <FieldEditor
                              field={selectedField}
                              onUpdate={(updates) => updateField(effectiveSelectedIndex, updates)}
                              adapter={adapter}
                              originalParameterType={selectedField.originalParameterType}
                            />
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="execution" className="mt-4 rounded-md border p-4">
            {adapter && (
              <ExecutionMethodSettings
                adapter={adapter}
                currentConfig={currentExecutionConfig}
                onUpdateConfig={onExecutionConfigUpdated || (() => {})}
                isWidgetExpanded={isWidgetExpanded}
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
