import { useStore } from 'zustand';

import { useFunctionFilter } from './hooks/useFunctionFilter';
import { useFunctionSelection } from './hooks/useFunctionSelection';

import { ActionBar } from '../../Common/ActionBar';
import { StepTitleWithDescription } from '../Common';
import { uiBuilderStoreVanilla } from '../hooks/uiBuilderStore';
import { FilterControls } from './FilterControls';
import { StepFunctionSelectorProps } from './types';
import { WritableFunctionsSection } from './WritableFunctionsSection';

export function StepFunctionSelector({
  contractSchema,
  onFunctionSelected,
  selectedFunction,
  networkConfig,
  onToggleContractState,
  isWidgetExpanded,
  adapter,
}: StepFunctionSelectorProps) {
  const { contractState } = useStore(uiBuilderStoreVanilla);

  // Use custom hooks to manage component logic
  const { filteredFunctions, writableFunctions, filterValue, setFilterValue } =
    useFunctionFilter(contractSchema);

  const { selectFunction } = useFunctionSelection(onFunctionSelected, contractSchema);

  if (!contractSchema) {
    // If we have a definition but no schema yet, we're loading
    if (contractState.definitionJson) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">Loading contract functions...</p>
        </div>
      );
    }

    // Otherwise, we need a contract definition
    return (
      <div className="py-8 text-center">
        <p>Please import a contract definition first.</p>
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
        />
      )}

      <StepTitleWithDescription
        title="Select Contract Function"
        description="Choose the contract function you want to create a transaction form for. Each function will have its own dedicated form."
      />

      <FilterControls filterValue={filterValue} setFilterValue={setFilterValue} />

      <div className="max-h-96 space-y-6 overflow-y-auto">
        <WritableFunctionsSection
          functions={writableFunctions}
          selectedFunction={selectedFunction}
          onSelectFunction={selectFunction}
          adapter={adapter}
        />

        {/* Show a message if no functions match the filter */}
        {filteredFunctions.length === 0 && (
          <p className="text-muted-foreground py-4 text-center">No functions match your filter.</p>
        )}
      </div>
    </div>
  );
}
