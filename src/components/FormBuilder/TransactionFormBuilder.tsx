import { useCallback, useState } from 'react';

import { WizardLayout, WizardStep } from '../Common/WizardLayout';

import { StepChainSelect } from './StepChainSelect';
import { StepContractDefinition } from './StepContractDefinition';
import { StepExport } from './StepExport';
import { StepFormCustomization } from './StepFormCustomization';
import { StepFunctionSelector } from './StepFunctionSelector';

import type { ChainType, ContractSchema } from '../../core/types/ContractSchema';
import type { FormConfig } from '../../core/types/FormTypes';

export function TransactionFormBuilder() {
  const [selectedChain, setSelectedChain] = useState<ChainType>('evm');
  const [contractSchema, setContractSchema] = useState<ContractSchema | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);

  // Memoize the handler functions to prevent unnecessary re-renders
  const handleChainSelect = useCallback((chain: ChainType) => {
    setSelectedChain(chain);
    // Reset contract schema when chain changes
    setContractSchema(null);
    setSelectedFunction(null);
    setFormConfig(null);
  }, []);

  const handleContractSchemaLoaded = useCallback((schema: ContractSchema) => {
    setContractSchema(schema);
  }, []);

  const handleFunctionSelected = useCallback((functionId: string | null) => {
    setSelectedFunction(functionId);
    // Reset form config when function changes
    if (functionId === null) {
      setFormConfig(null);
    }
  }, []);

  const handleFormConfigUpdated = useCallback((config: FormConfig) => {
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

      return config;
    });
  }, []);

  const handleExport = useCallback(() => {
    // In a real implementation, this would generate the actual form code
    console.log('Exporting form with:', {
      chain: selectedChain,
      function: selectedFunction,
      formConfig,
    });
  }, [selectedChain, selectedFunction, formConfig]);

  const steps: WizardStep[] = [
    {
      id: 'chain-select',
      title: 'Select Blockchain',
      component: <StepChainSelect onChainSelect={handleChainSelect} initialChain={selectedChain} />,
    },
    {
      id: 'contract-definition',
      title: 'Upload Contract',
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
      title: 'Customize Form',
      component: (
        <StepFormCustomization
          contractSchema={contractSchema}
          selectedFunction={selectedFunction}
          onFormConfigUpdated={handleFormConfigUpdated}
        />
      ),
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
    <div className="container mx-auto max-w-3xl py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Transaction Form Builder</h1>
        <p className="text-muted-foreground text-lg">
          Create custom transaction forms for your smart contracts
        </p>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <WizardLayout steps={steps} />
      </div>
    </div>
  );
}
