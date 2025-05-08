import { FileText } from 'lucide-react';

import {
  Button,
  ContractStateWidget,
  truncateMiddle,
} from '@openzeppelin/transaction-form-renderer';

import type { WizardStep } from '../Common/WizardLayout';
import { WizardLayout } from '../Common/WizardLayout';

import { ChainTileSelector } from './StepChainSelection/index';
import { StepFormCustomization } from './StepFormCustomization/index';
import { StepFunctionSelector } from './StepFunctionSelector/index';

import { StepComplete } from './StepComplete';
import { StepContractDefinition } from './StepContractDefinition';
import { useFormBuilderState } from './hooks';

export function TransactionFormBuilder() {
  const {
    selectedNetworkConfigId,
    selectedNetwork,
    selectedAdapter,
    selectedEcosystem,
    contractSchema,
    selectedFunction,
    formConfig,
    isExecutionStepValid,
    isWidgetVisible,
    sidebarWidget: widgetData,
    exportLoading,
    contractAddress,

    handleNetworkSelect,
    handleContractSchemaLoaded,
    handleFunctionSelected,
    handleFormConfigUpdated,
    handleExecutionConfigUpdated,
    toggleWidget,
    exportForm,
  } = useFormBuilderState();

  // Create sidebar widget when we have contract data
  const sidebarWidget = widgetData ? (
    <div className="sticky top-4">
      <ContractStateWidget
        contractSchema={widgetData.contractSchema}
        contractAddress={widgetData.contractAddress}
        adapter={widgetData.adapter}
        isVisible={widgetData.isVisible}
        onToggle={widgetData.onToggle}
        externalToggleMode={true}
      />
    </div>
  ) : null;

  // Header actions - Contract State toggle button (only when state is hidden)
  const headerActions =
    contractSchema && contractAddress && !isWidgetVisible ? (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={toggleWidget}
        title="Show Contract State"
      >
        <FileText size={16} className="shrink-0" />
        <span className="text-sm font-medium">View Contract State</span>
        <span className="ml-2 text-xs text-muted-foreground">
          ({truncateMiddle(contractAddress)})
        </span>
      </Button>
    ) : null;

  const steps: WizardStep[] = [
    {
      id: 'chain-select',
      title: 'Select Blockchain',
      component: (
        <ChainTileSelector
          onNetworkSelect={handleNetworkSelect}
          initialEcosystem={selectedNetwork?.ecosystem ?? selectedEcosystem ?? 'evm'}
          selectedNetworkId={selectedNetworkConfigId}
        />
      ),
      isValid: !!selectedNetworkConfigId,
    },
    {
      id: 'contract-definition',
      title: 'Load Contract',
      component: (
        <StepContractDefinition
          onContractSchemaLoaded={handleContractSchemaLoaded}
          adapter={selectedAdapter}
          networkConfig={selectedNetwork}
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
          networkConfig={selectedNetwork}
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
          networkConfig={selectedNetwork}
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
          networkConfig={selectedNetwork}
          formConfig={formConfig}
          contractSchema={contractSchema}
          onExport={() => {
            void exportForm(formConfig, selectedFunction);
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
          headerActions={headerActions}
        />
      </div>
    </div>
  );
}
