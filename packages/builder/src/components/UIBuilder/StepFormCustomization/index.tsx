import { FormInput } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { EmptyState, Tabs, TabsContent, TabsList, TabsTrigger } from '@openzeppelin/ui-components';
import { useWalletState } from '@openzeppelin/ui-react';
import {
  ContractAdapter,
  ContractSchema,
  ExecutionConfig,
  NetworkConfig,
  UiKitConfiguration,
} from '@openzeppelin/ui-types';

import { ensureCompleteConfig } from './utils/executionUtils';

import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import { ActionBar } from '../../Common/ActionBar';
import { useWizardStepUiState } from '../hooks/useWizardStepUiState';
import { FunctionNoteSection, RuntimeSecretButton, UiKitSettings } from './components';
import { ExecutionMethodSettings } from './ExecutionMethodSettings';
import { FormPreview } from './FormPreview';
import { GeneralSettings } from './GeneralSettings';
import {
  useExecutionValidation,
  useFieldSelection,
  useFormConfig,
  useGetFunctionNote,
} from './hooks';
import { ResponsiveFieldsLayout } from './ResponsiveFieldsLayout';

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
  adapter?: ContractAdapter;
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
  adapter: adapterProp,
}: StepFormCustomizationProps) {
  const {
    stepUiState: { activeTab, previewMode, selectedFieldIndex, bannerDismissed },
    setStepUiState: setUiState,
  } = useWizardStepUiState('stepCustomize', {
    activeTab: 'general',
    previewMode: false,
    selectedFieldIndex: null as number | null,
    bannerDismissed: false,
  });

  const { activeAdapter: adapter, isAdapterLoading: adapterLoading } = useWalletState();

  // Find the selected function details using memoization
  const selectedFunctionDetails = useMemo(() => {
    return contractSchema?.functions.find((fn) => fn.id === selectedFunction) || null;
  }, [contractSchema, selectedFunction]);

  // Fetch function decorations to check if this function requires a runtime secret
  const effectiveAdapter = adapterProp ?? adapter ?? undefined;
  const functionNote = useGetFunctionNote(
    effectiveAdapter,
    selectedFunction,
    selectedFunctionDetails
  );

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

  // Field validation tracking
  const [fieldValidationErrors, setFieldValidationErrors] = useState<Map<string, boolean>>(
    new Map()
  );

  // Handle field validation changes
  const onFieldValidationChange = useCallback((fieldId: string, hasError: boolean) => {
    setFieldValidationErrors((prev) => {
      const next = new Map(prev);
      if (hasError) {
        next.set(fieldId, true);
      } else {
        next.delete(fieldId);
      }
      return next;
    });
  }, []);

  // Manage combined execution and field validation
  const { handleExecutionConfigUpdated } = useExecutionValidation(
    fieldValidationErrors,
    currentExecutionConfig,
    onExecutionConfigUpdated
  );

  // Handle field deletion
  const handleDeleteField = useCallback(
    (index: number) => {
      if (!baseFormConfigFromHook) return;

      const updatedFields = baseFormConfigFromHook.fields.filter((_, i) => i !== index);
      const updatedConfig: BuilderFormConfig = {
        ...baseFormConfigFromHook,
        fields: updatedFields,
      };

      onFormConfigUpdated(updatedConfig);

      // Select first field if available, otherwise none
      const newIndex = Math.min(index, updatedFields.length - 1);
      if (newIndex >= 0) {
        setUiState({ selectedFieldIndex: newIndex });
      } else {
        setUiState({ selectedFieldIndex: null });
      }
    },
    [baseFormConfigFromHook, onFormConfigUpdated, setUiState]
  );

  // Handle UI Kit config updates
  const handleUiKitConfigUpdate = (config: UiKitConfiguration) => {
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
    if (effectiveAdapter && handleExecutionConfigUpdated && !currentExecutionConfig) {
      const defaultConfig = ensureCompleteConfig({ method: 'eoa', allowAny: true });
      if (defaultConfig) {
        handleExecutionConfigUpdated(defaultConfig, true);
      }
    }
  }, [effectiveAdapter, currentExecutionConfig, handleExecutionConfigUpdated]);

  // Auto-select first field when fields tab becomes active
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
    // This effect should only set the *initial* selection when the tab becomes active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, baseFormConfigFromHook, selectField]);

  const handleTogglePreview = () => {
    setUiState({ previewMode: !previewMode });
  };

  // Validation checks
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

  if (!effectiveAdapter && networkConfig) {
    return (
      <div className="py-8 text-center text-red-600">
        <p>
          Failed to load adapter for the selected network. Please try again or select a different
          network.
        </p>
      </div>
    );
  }

  if (!effectiveAdapter) {
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

      {/* Function decoration banner - shown above tabs, dismissible */}
      <FunctionNoteSection
        note={functionNote}
        isDismissed={bannerDismissed}
        onDismiss={() => setUiState({ bannerDismissed: true })}
      />

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
          <div
            className="w-full max-w-full min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ contain: 'inline-size' }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="execution">Execution Method</TabsTrigger>
              <TabsTrigger value="uikit">UI Kit</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="general"
            className="mt-4 rounded-md border p-4 data-[state=inactive]:hidden"
            forceMount
          >
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

          <TabsContent
            value="fields"
            className="mt-4 rounded-md border p-4 data-[state=inactive]:hidden"
            forceMount
          >
            {baseFormConfigFromHook && (
              <div className="space-y-4">
                {baseFormConfigFromHook.fields.length === 0 ? (
                  <EmptyState
                    icon={<FormInput className="h-6 w-6 text-muted-foreground" />}
                    title="No Fields to Configure"
                    description="This function doesn't require any input parameters, so there are no form fields to customize. You can proceed to configure the execution method or preview your form."
                  />
                ) : (
                  effectiveAdapter && (
                    <>
                      <ResponsiveFieldsLayout
                        fields={baseFormConfigFromHook.fields}
                        selectedFieldIndex={selectedFieldIndex}
                        onSelectField={selectField}
                        adapter={effectiveAdapter}
                        onUpdateField={updateField}
                        onFieldValidationChange={onFieldValidationChange}
                        fieldValidationErrors={fieldValidationErrors}
                        onDeleteField={handleDeleteField}
                      />

                      {/* Show "Re-add Runtime Secret" button if function requires it but field was deleted */}
                      {functionNote &&
                        !baseFormConfigFromHook.fields.some((f) => f.type === 'runtimeSecret') && (
                          <RuntimeSecretButton
                            adapter={effectiveAdapter}
                            formConfig={baseFormConfigFromHook}
                            onFormConfigUpdated={onFormConfigUpdated}
                          />
                        )}
                    </>
                  )
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="execution"
            className="mt-4 rounded-md border p-4 data-[state=inactive]:hidden"
            forceMount
          >
            {effectiveAdapter && (
              <ExecutionMethodSettings
                adapter={effectiveAdapter}
                currentConfig={currentExecutionConfig}
                onUpdateConfig={handleExecutionConfigUpdated}
                isWidgetExpanded={isWidgetExpanded}
              />
            )}
          </TabsContent>

          <TabsContent
            value="uikit"
            className="mt-4 rounded-md border p-4 data-[state=inactive]:hidden"
            forceMount
          >
            {effectiveAdapter && (
              <UiKitSettings
                adapter={effectiveAdapter}
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
