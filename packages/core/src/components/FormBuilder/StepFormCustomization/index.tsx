import { Eye, Pencil } from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@openzeppelin/transaction-form-renderer';
import type { ChainType, ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

import { getAdapter } from '../../../core/adapterRegistry';
import type { BuilderFormConfig, ExecutionConfig } from '../../../core/types/FormTypes';
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
  selectedChain: ChainType;
  onFormConfigUpdated: (config: BuilderFormConfig) => void;
  onExecutionConfigUpdated?: (execConfig: ExecutionConfig | undefined, isValid: boolean) => void;
  currentExecutionConfig?: ExecutionConfig;
}

export function StepFormCustomization({
  contractSchema,
  selectedFunction,
  selectedChain,
  onFormConfigUpdated,
  onExecutionConfigUpdated,
  currentExecutionConfig,
}: StepFormCustomizationProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [previewMode, setPreviewMode] = useState(false);

  const { formConfig, updateField, updateFormTitle, updateFormDescription } = useFormConfig({
    contractSchema,
    selectedFunction,
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

  return (
    <div className="space-y-6">
      <StepTitleWithDescription
        title="Customize"
        description={
          <>
            Customize the form fields and general settings for the &quot;
            {selectedFunctionDetails.displayName}&quot; function.
          </>
        }
      />

      <div className="flex justify-end space-x-2">
        <Button
          variant={previewMode ? 'outline' : 'default'}
          size="sm"
          onClick={() => setPreviewMode(!previewMode)}
          className="gap-2"
        >
          {previewMode ? (
            <>
              <Pencil size={16} />
              <span>Back to Editor</span>
            </>
          ) : (
            <>
              <Eye size={16} />
              <span>Preview Form</span>
            </>
          )}
        </Button>
      </div>

      {previewMode ? (
        <FormPreview
          formConfig={formConfig}
          functionDetails={selectedFunctionDetails}
          selectedChain={selectedChain}
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
                  {selectedFieldIndex !== null && formConfig.fields[selectedFieldIndex] && (
                    <FieldEditor
                      field={formConfig.fields[selectedFieldIndex]}
                      onUpdate={(updates) => updateField(selectedFieldIndex, updates)}
                      adapter={getAdapter(selectedChain)}
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
            <ExecutionMethodSettings
              adapter={getAdapter(selectedChain)}
              currentConfig={currentExecutionConfig}
              onUpdateConfig={onExecutionConfigUpdated || (() => {})}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
