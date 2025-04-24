import type { WizardStep } from '../Common/WizardLayout';
import { WizardLayout } from '../Common/WizardLayout';
import { ContractStateWidget } from '../ContractStateWidget';

import { ChainTileSelector } from './StepChainSelection/ChainTileSelector';
import { StepFormCustomization } from './StepFormCustomization/index';
import { StepFunctionSelector } from './StepFunctionSelector/index';

import { StepComplete } from './StepComplete';
import { StepContractDefinition } from './StepContractDefinition';
import { useFormBuilderState } from './hooks';

export function TransactionFormBuilder() {
  const {
    selectedChain,
    contractSchema,
    selectedFunction,
    formConfig,
    isExecutionStepValid,
    isWidgetVisible,
    sidebarWidget: widgetData,
    exportLoading,

    handleChainSelect,
    handleContractSchemaLoaded,
    handleFunctionSelected,
    handleFormConfigUpdated,
    handleExecutionConfigUpdated,
    exportForm,
  } = useFormBuilderState();

  // Create sidebar widget when we have contract data
  const sidebarWidget = widgetData ? (
    <div className="sticky top-4">
      <ContractStateWidget
        contractSchema={widgetData.contractSchema}
        contractAddress={widgetData.contractAddress}
        chainType={widgetData.chainType}
        isVisible={widgetData.isVisible}
        onToggle={widgetData.onToggle}
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
          existingContractSchema={contractSchema}
        />
      ),
      isValid: !!contractSchema,
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
      isValid: !!selectedFunction,
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
        <StepComplete
          selectedChain={selectedChain}
          formConfig={formConfig}
          onExport={() => {
            void exportForm(formConfig, selectedChain, selectedFunction);
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
