import { useCallback, useState } from 'react';

import type { ChainType, ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

import type { BuilderFormConfig, ExecutionConfig } from '../../core/types/FormTypes';
import { FormExportSystem } from '../../export';
import { WizardLayout, WizardStep } from '../Common/WizardLayout';
import { ContractStateWidget } from '../ContractStateWidget';

import { StepFormCustomization } from './StepFormCustomization/index';
import { StepFunctionSelector } from './StepFunctionSelector/index';

import { ChainTileSelector } from './ChainTileSelector';
import { CompleteStep } from './CompleteStep';
import { StepContractDefinition } from './StepContractDefinition';

interface UseFormExportParams {
  formConfig: BuilderFormConfig | null;
  selectedChain: ChainType;
  selectedFunction: string | null;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

function useFormExport({ formConfig, selectedChain, selectedFunction }: UseFormExportParams) {
  const [loading, setLoading] = useState(false);

  const exportForm = useCallback(async () => {
    if (!formConfig || !selectedFunction) return;
    setLoading(true);
    const exportSystem = new FormExportSystem();
    try {
      const result = await exportSystem.exportForm(formConfig, selectedChain, selectedFunction, {
        chainType: selectedChain,
      });
      if (result.data instanceof Blob) {
        downloadBlob(result.data, result.fileName);
      } else if (
        typeof window !== 'undefined' &&
        window.Blob &&
        result.data instanceof ArrayBuffer
      ) {
        downloadBlob(new Blob([result.data]), result.fileName);
      } else {
        alert('Export is only supported in the browser.');
      }
    } catch (err) {
      alert('Failed to export form: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [formConfig, selectedChain, selectedFunction]);

  return { exportForm, loading };
}

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

  const { exportForm, loading: exportLoading } = useFormExport({
    formConfig,
    selectedChain,
    selectedFunction,
  });

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
      id: 'complete',
      title: 'Complete',
      component: (
        <CompleteStep
          selectedChain={selectedChain}
          selectedFunction={selectedFunction}
          formConfig={formConfig}
          onExport={() => {
            void exportForm();
          }}
          exportLoading={exportLoading}
          functionDetails={
            contractSchema?.functions.find((fn) => fn.id === selectedFunction) || null
          }
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
