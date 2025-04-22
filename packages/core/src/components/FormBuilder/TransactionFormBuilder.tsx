import { useCallback, useState } from 'react';

import type { ChainType, ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

import type { BuilderFormConfig, ExecutionConfig } from '../../core/types/FormTypes';
import { WizardLayout, WizardStep } from '../Common/WizardLayout';
import { ContractStateWidget } from '../ContractStateWidget';

import { StepFormCustomization } from './StepFormCustomization/index';
import { StepFunctionSelector } from './StepFunctionSelector/index';

import { ChainTileSelector } from './ChainTileSelector';
import { StepContractDefinition } from './StepContractDefinition';
import { StepExport } from './StepExport';

export function TransactionFormBuilder() {
  const [selectedChain, setSelectedChain] = useState<ChainType>('evm');
  const [contractSchema, setContractSchema] = useState<ContractSchema | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [formConfig, setFormConfig] = useState<BuilderFormConfig | null>(null);
  const [isExecutionStepValid, setIsExecutionStepValid] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);

  // Memoize the handler functions to prevent unnecessary re-renders
  const handleChainSelect = useCallback((chain: ChainType) => {
    setSelectedChain(chain);
    // Reset dependent states when chain changes
    setContractSchema(null);
    setSelectedFunction(null);
    setFormConfig(null);
    setContractAddress(null);
  }, []);

  const handleContractSchemaLoaded = useCallback((schema: ContractSchema) => {
    setContractSchema(schema);
    setContractAddress(schema.address ?? null);
    // Automatically show the widget when a contract is loaded for the first time
    setIsWidgetVisible(true);
  }, []);

  const handleFunctionSelected = useCallback((functionId: string | null) => {
    setSelectedFunction(functionId);
    // Reset form config when function changes
    if (functionId === null) {
      setFormConfig(null);
    }
  }, []);

  const handleFormConfigUpdated = useCallback((config: BuilderFormConfig) => {
    // Only update state if the config actually changed
    setFormConfig((prevConfig) => {
      // If the new config is exactly the same object, don't update
      if (prevConfig === config) {
        return prevConfig;
      }

      // If the new config has the same values, don't update
      if (
        prevConfig &&
        prevConfig.functionId === config.functionId &&
        JSON.stringify(prevConfig) === JSON.stringify(config)
      ) {
        return prevConfig;
      }
      const existingExecutionConfig = prevConfig?.executionConfig;
      return { ...config, executionConfig: existingExecutionConfig };
    });
  }, []);

  // Update this handler to also receive validation status
  const handleExecutionConfigUpdated = useCallback(
    (execConfig: ExecutionConfig | undefined, isValid: boolean) => {
      setFormConfig((prevConfig) => {
        if (!prevConfig) return null;
        if (JSON.stringify(prevConfig.executionConfig) === JSON.stringify(execConfig)) {
          return prevConfig;
        }
        return { ...prevConfig, executionConfig: execConfig };
      });
      setIsExecutionStepValid(isValid);
    },
    []
  );

  const handleExport = useCallback(() => {
    // In a real implementation, this would generate the actual form code
    console.log('Exporting form with:', {
      chain: selectedChain,
      function: selectedFunction,
      formConfig,
    });

    // -----------------------------------------------------------------------
    // COMPLEX FIELDS HANDLING
    // -----------------------------------------------------------------------
    // This section detects form fields that represent complex blockchain data types
    // (like arrays and objects) that require special handling during export.
    //
    // TODO: Enhance this implementation to:
    //  - Parse JSON input from textareas into proper JavaScript data structures
    //  - Validate the parsed data against expected blockchain types
    //  - Handle nested arrays and objects
    //  - Provide proper error handling for malformed JSON
    //  - Consider providing a specialized UI for array/tuple editing instead of raw JSON
    // -----------------------------------------------------------------------
    if (formConfig) {
      // Log which fields are complex types to assist with the export process
      const complexFields = formConfig.fields.filter(
        (field) =>
          field.type === 'textarea' &&
          (field.helperText?.includes('JSON array') || field.helperText?.includes('JSON object'))
      );

      if (complexFields.length > 0) {
        console.log('Complex fields detected:', complexFields);
      }
    }
  }, [selectedChain, selectedFunction, formConfig]);

  // Toggle widget visibility
  const toggleWidget = useCallback(() => {
    setIsWidgetVisible((prev) => !prev);
  }, []);

  // Create sidebar widget when we have contract data
  const sidebarWidget =
    contractAddress && contractSchema ? (
      <div className="sticky top-4">
        <ContractStateWidget
          contractSchema={contractSchema}
          contractAddress={contractAddress}
          chainType={selectedChain}
          isVisible={isWidgetVisible}
          onToggle={toggleWidget}
        />
      </div>
    ) : null;

  const steps: WizardStep[] = [
    {
      id: 'chain-select',
      title: 'Select Blockchain',
      component: (
        <ChainTileSelector onChainSelect={handleChainSelect} initialChain={selectedChain} />
      ),
    },
    {
      id: 'contract-definition',
      title: 'Load Contract',
      component: (
        <StepContractDefinition
          onContractSchemaLoaded={handleContractSchemaLoaded}
          selectedChain={selectedChain}
        />
      ),
    },
    {
      id: 'function-selector',
      title: 'Select Function',
      component: (
        <StepFunctionSelector
          contractSchema={contractSchema}
          onFunctionSelected={handleFunctionSelected}
          selectedFunction={selectedFunction}
        />
      ),
    },
    {
      id: 'form-customization',
      title: 'Customize',
      component: (
        <StepFormCustomization
          contractSchema={contractSchema}
          selectedFunction={selectedFunction}
          selectedChain={selectedChain}
          onFormConfigUpdated={handleFormConfigUpdated}
          onExecutionConfigUpdated={handleExecutionConfigUpdated}
          currentExecutionConfig={formConfig?.executionConfig}
        />
      ),
      isValid: isExecutionStepValid,
    },
    {
      id: 'export',
      title: 'Export Form',
      component: (
        <StepExport
          selectedChain={selectedChain}
          selectedFunction={selectedFunction}
          formConfig={formConfig}
          onExport={handleExport}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Transaction Form Builder</h1>
        <p className="text-muted-foreground text-lg">
          Create custom transaction forms for your smart contracts
        </p>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <WizardLayout
          steps={steps}
          sidebarWidget={sidebarWidget}
          isWidgetExpanded={isWidgetVisible}
        />
      </div>
    </div>
  );
}
