import { useMemo, useState } from 'react';

import { Button } from '@openzeppelin/transaction-form-renderer';

import { getContractAdapter } from '../../../adapters';
import type { ChainType, ContractSchema } from '../../../core/types/ContractSchema';
import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

import { useFieldSelection } from './hooks/useFieldSelection';
import { useFormConfig } from './hooks/useFormConfig';

import { FieldEditor } from './FieldEditor';
import { FieldSelectorList } from './FieldSelectorList';
import { FormPreview } from './FormPreview';
import { GeneralSettings } from './GeneralSettings';
import { LayoutEditor } from './LayoutEditor';
import { ValidationEditor } from './ValidationEditor';

interface StepFormCustomizationProps {
  contractSchema: ContractSchema | null;
  selectedFunction: string | null;
  selectedChain: ChainType;
  onFormConfigUpdated: (config: BuilderFormConfig) => void;
}

export function StepFormCustomization({
  contractSchema,
  selectedFunction,
  selectedChain,
  onFormConfigUpdated,
}: StepFormCustomizationProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [previewMode, setPreviewMode] = useState(false);

  const {
    formConfig,
    updateField,
    updateFormLayout,
    updateFormValidation,
    updateFormTitle,
    updateFormDescription,
  } = useFormConfig({
    contractSchema,
    selectedFunction,
    onFormConfigUpdated,
  });

  const { selectedFieldIndex, selectField } = useFieldSelection();

  // Find the selected function details using memoization
  const selectedFunctionDetails = useMemo(() => {
    return contractSchema?.functions.find((fn) => fn.id === selectedFunction) || null;
  }, [contractSchema, selectedFunction]);

  if (!contractSchema || !selectedFunction || !selectedFunctionDetails || !formConfig) {
    return (
      <div className="py-8 text-center">
        <p>Please select a contract function first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Customize Form</h3>
        <p className="text-muted-foreground">
          Customize the form fields, layout, and validation for the &quot;
          {selectedFunctionDetails.displayName}&quot; function.
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
          {previewMode ? 'Back to Editor' : 'Preview Form'}
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
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
                      adapter={getContractAdapter(selectedChain)}
                      originalParameterType={
                        formConfig.fields[selectedFieldIndex].originalParameterType
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="mt-4 rounded-md border p-4">
            {/* Layout configuration */}
            <LayoutEditor layoutConfig={formConfig.layout} onUpdate={updateFormLayout} />
          </TabsContent>

          <TabsContent value="validation" className="mt-4 rounded-md border p-4">
            {/* Validation configuration */}
            <ValidationEditor
              validationConfig={formConfig.validation}
              onUpdate={updateFormValidation}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
