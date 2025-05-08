import { useEffect, useMemo, useState } from 'react';

import { ContractSchema, NetworkConfig } from '@openzeppelin/transaction-form-types';

import { useConfiguredAdapter } from '../../../core/hooks/useConfiguredAdapter';
import type { BuilderFormConfig, ExecutionConfig } from '../../../core/types/FormTypes';
import { ActionBar } from '../../Common/ActionBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { StepTitleWithDescription } from '../Common';
import { ExecutionMethodSettings } from '../StepFormCustomization/ExecutionMethodSettings';

import { useFieldSelection } from './hooks/useFieldSelection';
import { useFormConfig } from './hooks/useFormConfig';

import { FieldEditor } from './FieldEditor';
import { FieldSelectorList } from './FieldSelectorList';
import { FormPreview } from './FormPreview';
import { GeneralSettings } from './GeneralSettings';

interface StepFormCustomizationProps {
  contractSchema: ContractSchema | null;
  selectedFunction: string | null;
  networkConfig: NetworkConfig | null;
  onFormConfigUpdated: (config: BuilderFormConfig) => void;
  onExecutionConfigUpdated?: (execConfig: ExecutionConfig | undefined, isValid: boolean) => void;
  currentExecutionConfig?: ExecutionConfig;
  onToggleContractState?: () => void;
  isWidgetExpanded?: boolean;
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
}: StepFormCustomizationProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [previewMode, setPreviewMode] = useState(false);

  const { adapter, isLoading: adapterLoading } = useConfiguredAdapter(networkConfig);

  const { formConfig, updateField, updateFormTitle, updateFormDescription } = useFormConfig({
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

  // Auto-select the first field when the Fields tab is selected for the first time
  useEffect(() => {
    if (
      activeTab === 'fields' &&
      selectedFieldIndex === null &&
      formConfig &&
      formConfig.fields.length > 0
    ) {
      selectField(0);
    }
  }, [activeTab, formConfig, selectedFieldIndex, selectField]);

  if (!contractSchema || !selectedFunction || !selectedFunctionDetails || !formConfig) {
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

  if (networkConfig && !adapter) {
    return (
      <div className="py-8 text-center">
        <p>Adapter not available for selected network. Please select a network.</p>
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
          onTogglePreview={() => setPreviewMode(!previewMode)}
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
          formConfig={formConfig}
          functionDetails={selectedFunctionDetails}
          contractSchema={contractSchema}
          networkConfig={networkConfig}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="execution">Execution Method</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 rounded-md border p-4">
            <GeneralSettings
              title={formConfig.title}
              description={formConfig.description}
              onUpdateTitle={updateFormTitle}
              onUpdateDescription={updateFormDescription}
              selectedFunctionDetails={selectedFunctionDetails}
            />
          </TabsContent>

          <TabsContent value="fields" className="mt-4 rounded-md border p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FieldSelectorList
                  fields={formConfig.fields}
                  selectedFieldIndex={selectedFieldIndex}
                  onSelectField={selectField}
                />

                <div className="col-span-2">
                  {/* Field editor */}
                  {selectedFieldIndex !== null &&
                    formConfig.fields[selectedFieldIndex] &&
                    adapter && (
                      <FieldEditor
                        field={formConfig.fields[selectedFieldIndex]}
                        onUpdate={(updates) => updateField(selectedFieldIndex, updates)}
                        adapter={adapter}
                        originalParameterType={
                          formConfig.fields[selectedFieldIndex].originalParameterType
                        }
                      />
                    )}
                </div>
              </div>
            </div>
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
        </Tabs>
      )}
    </div>
  );
}
