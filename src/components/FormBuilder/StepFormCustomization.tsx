import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  generateFallbackFields,
  generateFormConfig,
  updateFormConfig,
} from '../../services/FormGenerator.ts';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';

import type { ContractFunction, ContractSchema } from '../../core/types/ContractSchema';
import type { FieldType, FormConfig, FormField } from '../../core/types/FormTypes';

// Component to edit a single field's properties
function FieldEditor({
  field,
  onUpdate,
}: {
  field: FormField;
  onUpdate: (updatedField: Partial<FormField>) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Edit Field</h3>

      <div>
        <Label htmlFor="field-label">Label</Label>
        <Input
          id="field-label"
          value={field.label}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ label: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="field-placeholder">Placeholder</Label>
        <Input
          id="field-placeholder"
          value={field.placeholder || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onUpdate({ placeholder: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="field-help">Help Text</Label>
        <Textarea
          id="field-help"
          value={field.helperText || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onUpdate({ helperText: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="field-type">Field Type</Label>
        <Select
          value={field.type}
          onValueChange={(value) => onUpdate({ type: value as FieldType })}
        >
          <SelectTrigger id="field-type">
            <SelectValue placeholder="Select field type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text Input</SelectItem>
            <SelectItem value="number">Number Input</SelectItem>
            <SelectItem value="checkbox">Checkbox</SelectItem>
            <SelectItem value="select">Dropdown Select</SelectItem>
            <SelectItem value="textarea">Text Area</SelectItem>
            <SelectItem value="address">Blockchain Address</SelectItem>
            <SelectItem value="amount">Token Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="field-width">Field Width</Label>
        <Select
          value={field.width || 'full'}
          onValueChange={(value) => onUpdate({ width: value as 'full' | 'half' | 'third' })}
        >
          <SelectTrigger id="field-width">
            <SelectValue placeholder="Select field width" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Width</SelectItem>
            <SelectItem value="half">Half Width</SelectItem>
            <SelectItem value="third">One Third</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="field-required"
          checked={field.validation.required || false}
          onCheckedChange={(checked: boolean | 'indeterminate') =>
            onUpdate({
              validation: {
                ...field.validation,
                required: checked === true,
              },
            })
          }
        />
        <Label htmlFor="field-required">Required Field</Label>
      </div>
    </div>
  );
}

// Component to preview the form
function FormPreview({
  formConfig,
  functionDetails,
}: {
  formConfig: FormConfig;
  functionDetails: ContractFunction;
}) {
  // We're not using useForm() here since this is just a display component

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4 text-xl font-bold">{functionDetails.displayName}</h3>
        <form className="space-y-4">
          <div
            className={`grid gap-4 ${
              formConfig.layout.columns === 1
                ? 'grid-cols-1'
                : formConfig.layout.columns === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
            }`}
          >
            {formConfig.fields.map((field, index) => (
              <div
                key={field.id}
                className={`space-y-2 ${
                  field.width === 'full'
                    ? 'col-span-full'
                    : field.width === 'half'
                      ? 'col-span-1 sm:col-span-1'
                      : 'col-span-1'
                }`}
              >
                <Label htmlFor={`field-${index}`}>{field.label}</Label>
                {field.type === 'text' && (
                  <Input id={`field-${index}`} placeholder={field.placeholder} />
                )}
                {field.type === 'number' && (
                  <Input id={`field-${index}`} type="number" placeholder={field.placeholder} />
                )}
                {field.type === 'checkbox' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox id={`field-${index}`} />
                    <Label htmlFor={`field-${index}`}>{field.placeholder}</Label>
                  </div>
                )}
                {field.type === 'textarea' && (
                  <Textarea id={`field-${index}`} placeholder={field.placeholder} />
                )}
                {field.type === 'select' && (
                  <Select>
                    <SelectTrigger id={`field-${index}`}>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {field.helperText && (
                  <p className="text-muted-foreground text-sm">{field.helperText}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4">
            <Button type="button">Submit Transaction</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Component to edit validation settings
function ValidationEditor({
  validationConfig,
  onUpdate,
}: {
  validationConfig: FormConfig['validation'];
  onUpdate: (updates: Partial<FormConfig['validation']>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="validation-mode">Validation Mode</Label>
        <Select
          value={validationConfig.mode}
          onValueChange={(value) => onUpdate({ mode: value as 'onChange' | 'onBlur' | 'onSubmit' })}
        >
          <SelectTrigger id="validation-mode">
            <SelectValue placeholder="Select validation mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="onChange">Validate on Change</SelectItem>
            <SelectItem value="onBlur">Validate on Blur</SelectItem>
            <SelectItem value="onSubmit">Validate on Submit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="validation-display">Error Display</Label>
        <Select
          value={validationConfig.showErrors}
          onValueChange={(value) =>
            onUpdate({ showErrors: value as 'inline' | 'summary' | 'both' })
          }
        >
          <SelectTrigger id="validation-display">
            <SelectValue placeholder="Select error display method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inline">Show errors inline</SelectItem>
            <SelectItem value="summary">Show errors in summary</SelectItem>
            <SelectItem value="both">Show errors in both places</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

interface StepFormCustomizationProps {
  contractSchema: ContractSchema | null;
  selectedFunction: string | null;
  onFormConfigUpdated: (config: FormConfig) => void;
}

export function StepFormCustomization({
  contractSchema,
  selectedFunction,
  onFormConfigUpdated,
}: StepFormCustomizationProps) {
  const [activeTab, setActiveTab] = useState('fields');
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const configInitialized = useRef(false);
  const lastSelectedFunction = useRef<string | null>(null);
  const lastParentUpdate = useRef<FormConfig | null>(null);

  // Find the selected function details using memoization
  const selectedFunctionDetails = useMemo(() => {
    return contractSchema?.functions.find((fn) => fn.id === selectedFunction) || null;
  }, [contractSchema, selectedFunction]);

  // Only for initial config generation - setup the form config when a function is first selected
  useEffect(() => {
    // Only create config when function changes or if it hasn't been initialized
    const functionChanged = lastSelectedFunction.current !== selectedFunction;
    if (functionChanged) {
      lastSelectedFunction.current = selectedFunction;
      configInitialized.current = false;
    }

    // Generate config if needed
    if (
      contractSchema &&
      selectedFunction &&
      selectedFunctionDetails &&
      !configInitialized.current
    ) {
      try {
        // Use the FormGenerator service to generate the form config
        const config = generateFormConfig(contractSchema, selectedFunction);

        // Set the flag to prevent re-initialization
        configInitialized.current = true;

        // Update state first
        setFormConfig(config);

        // Track what we're sending to parent to avoid loops
        lastParentUpdate.current = config;

        // Notify parent outside of render/effect cycle
        setTimeout(() => {
          onFormConfigUpdated(config);
        }, 0);
      } catch (error) {
        console.error('Error generating form configuration:', error);

        // If the FormGenerator service fails, use fallback field generation
        if (selectedFunctionDetails) {
          const fields = generateFallbackFields(selectedFunctionDetails);

          const config: FormConfig = {
            functionId: selectedFunction,
            fields,
            layout: {
              columns: 1,
              spacing: 'normal',
              labelPosition: 'top',
            },
            theme: {},
            validation: {
              mode: 'onChange',
              showErrors: 'inline',
            },
          };

          // Set the flag to prevent re-initialization
          configInitialized.current = true;

          // Update state first
          setFormConfig(config);

          // Track what we're sending to parent to avoid loops
          lastParentUpdate.current = config;

          // Notify parent outside of render/effect cycle
          setTimeout(() => {
            onFormConfigUpdated(config);
          }, 0);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractSchema, selectedFunction, selectedFunctionDetails]); // deliberately omit onFormConfigUpdated to avoid infinite loops since it may change frequently and we're using setTimeout to break the loop

  // Reset state if function selection changes
  useEffect(() => {
    if (!selectedFunction) {
      setFormConfig(null);
      setSelectedFieldIndex(null);
      setPreviewMode(false);
      configInitialized.current = false;
    }
  }, [selectedFunction]);

  // Memoize update handlers to prevent unnecessary re-renders
  const updateField = useCallback(
    (index: number, updates: Partial<FormField>) => {
      if (!formConfig) return;

      const updatedFields = [...formConfig.fields];
      updatedFields[index] = { ...updatedFields[index], ...updates };

      const updatedConfig = updateFormConfig(formConfig, { fields: updatedFields });

      setFormConfig(updatedConfig);

      // Only notify parent if the config actually changed
      if (JSON.stringify(updatedConfig) !== JSON.stringify(lastParentUpdate.current)) {
        lastParentUpdate.current = updatedConfig;
        onFormConfigUpdated(updatedConfig);
      }
    },
    [formConfig, onFormConfigUpdated]
  );

  const updateFormLayout = useCallback(
    (updates: Partial<FormConfig['layout']>) => {
      if (!formConfig) return;

      // Create a properly typed update with all required fields
      const layoutUpdates = {
        ...formConfig.layout,
        ...updates,
      };

      const updatedConfig = updateFormConfig(formConfig, { layout: layoutUpdates });

      setFormConfig(updatedConfig);

      // Only notify parent if the config actually changed
      if (JSON.stringify(updatedConfig) !== JSON.stringify(lastParentUpdate.current)) {
        lastParentUpdate.current = updatedConfig;
        onFormConfigUpdated(updatedConfig);
      }
    },
    [formConfig, onFormConfigUpdated]
  );

  const updateFormValidation = useCallback(
    (updates: Partial<FormConfig['validation']>) => {
      if (!formConfig) return;

      // Create a properly typed update with all required fields
      const validationUpdates = {
        ...formConfig.validation,
        ...updates,
      };

      const updatedConfig = updateFormConfig(formConfig, { validation: validationUpdates });

      setFormConfig(updatedConfig);

      // Only notify parent if the config actually changed
      if (JSON.stringify(updatedConfig) !== JSON.stringify(lastParentUpdate.current)) {
        lastParentUpdate.current = updatedConfig;
        onFormConfigUpdated(updatedConfig);
      }
    },
    [formConfig, onFormConfigUpdated]
  );

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
        <FormPreview formConfig={formConfig} functionDetails={selectedFunctionDetails} />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="mt-4 rounded-md border p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-4 border-r pr-4">
                  {/* Field selector list */}
                  {formConfig.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className={`cursor-pointer rounded-md border p-3 ${
                        selectedFieldIndex === index ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedFieldIndex(index)}
                    >
                      <p className="font-medium">{field.label}</p>
                      <p className="text-muted-foreground text-xs">{field.type}</p>
                    </div>
                  ))}
                </div>

                <div className="col-span-2">
                  {/* Field editor */}
                  {selectedFieldIndex !== null && formConfig.fields[selectedFieldIndex] && (
                    <FieldEditor
                      field={formConfig.fields[selectedFieldIndex]}
                      onUpdate={(updates) => updateField(selectedFieldIndex, updates)}
                    />
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="mt-4 rounded-md border p-4">
            {/* Layout configuration */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="layout-columns">Layout Columns</Label>
                  <Select
                    value={formConfig.layout.columns.toString()}
                    onValueChange={(value) => updateFormLayout({ columns: parseInt(value) })}
                  >
                    <SelectTrigger id="layout-columns">
                      <SelectValue placeholder="Select number of columns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Single Column</SelectItem>
                      <SelectItem value="2">Two Columns</SelectItem>
                      <SelectItem value="3">Three Columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="layout-spacing">Field Spacing</Label>
                  <Select
                    value={formConfig.layout.spacing}
                    onValueChange={(value) =>
                      updateFormLayout({
                        spacing: value as FormConfig['layout']['spacing'],
                      })
                    }
                  >
                    <SelectTrigger id="layout-spacing">
                      <SelectValue placeholder="Select field spacing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="relaxed">Relaxed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="layout-labels">Label Position</Label>
                  <Select
                    value={formConfig.layout.labelPosition}
                    onValueChange={(value) =>
                      updateFormLayout({
                        labelPosition: value as FormConfig['layout']['labelPosition'],
                      })
                    }
                  >
                    <SelectTrigger id="layout-labels">
                      <SelectValue placeholder="Select label position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
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
