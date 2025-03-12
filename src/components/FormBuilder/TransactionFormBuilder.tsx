import { useCallback, useState } from 'react';

import { WizardLayout, WizardStep } from '../Common/WizardLayout';

import { StepArtifactSubmit } from './StepArtifactSubmit';
import { Chain, StepChainSelect } from './StepChainSelect';
import { StepExport } from './StepExport';
import { StepFormCustomization } from './StepFormCustomization';
import { StepFunctionSelector } from './StepFunctionSelector';

import type { AbiItem } from '../../adapters/evm/types';
import type { FormConfig } from '../../core/types/FormTypes';

export function TransactionFormBuilder() {
  const [selectedChain, setSelectedChain] = useState<Chain>('ethereum');
  const [contractAbi, setContractAbi] = useState<AbiItem[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);

  // Memoize the handler functions to prevent unnecessary re-renders
  const handleChainSelect = useCallback((chain: Chain) => {
    setSelectedChain(chain);
  }, []);

  const handleAbiLoaded = useCallback((abi: AbiItem[]) => {
    setContractAbi(abi);
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
      id: 'artifact-submit',
      title: 'Upload Contract',
      component: <StepArtifactSubmit onAbiLoaded={handleAbiLoaded} />,
    },
    {
      id: 'function-selector',
      title: 'Select Function',
      component: (
        <StepFunctionSelector
          contractSchema={
            contractAbi.length > 0
              ? {
                  chainType: 'evm', // Hardcoded for now, will be based on selectedChain later
                  functions: contractAbi
                    .filter((item) => item.type === 'function')
                    .map((item) => ({
                      id: `${item.name}_${item.inputs?.map((i) => i.type).join('_') || ''}`,
                      name: item.name || '',
                      displayName: item.name ? formatMethodName(item.name) : 'Unknown Method',
                      inputs:
                        item.inputs?.map((input) => ({
                          name: input.name,
                          type: input.type,
                          displayName: formatInputName(input.name, input.type),
                        })) || [],
                      type: item.type,
                      stateMutability: item.stateMutability,
                    })),
                }
              : null
          }
          onFunctionSelected={handleFunctionSelected}
        />
      ),
    },
    {
      id: 'form-customization',
      title: 'Customize Form',
      component: (
        <StepFormCustomization
          contractSchema={
            contractAbi.length > 0
              ? {
                  chainType: 'evm',
                  functions: contractAbi
                    .filter((item) => item.type === 'function')
                    .map((item) => ({
                      id: `${item.name}_${item.inputs?.map((i) => i.type).join('_') || ''}`,
                      name: item.name || '',
                      displayName: item.name ? formatMethodName(item.name) : 'Unknown Method',
                      inputs:
                        item.inputs?.map((input) => ({
                          name: input.name,
                          type: input.type,
                          displayName: formatInputName(input.name, input.type),
                        })) || [],
                      type: item.type,
                      stateMutability: item.stateMutability,
                    })),
                }
              : null
          }
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

// Utility functions
function formatMethodName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function formatInputName(name: string, type: string): string {
  if (!name) return type;
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
