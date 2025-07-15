import { ActionBar } from '../../Common/ActionBar';
import { StepTitleWithDescription } from '../Common';

import { useFunctionFilter } from './hooks/useFunctionFilter';
import { useFunctionSelection } from './hooks/useFunctionSelection';

import { FilterControls } from './FilterControls';
import { WritableFunctionsSection } from './WritableFunctionsSection';
import { StepFunctionSelectorProps } from './types';

export function StepFunctionSelector({
  contractSchema,
  selectedFunction,
  onFunctionSelected,
  networkConfig,
  onToggleContractState,
  isWidgetExpanded,
}: StepFunctionSelectorProps) {
  // Use custom hooks to manage component logic
  const { filteredFunctions, writableFunctions, filterValue, setFilterValue } =
    useFunctionFilter(contractSchema);

  const { selectFunction } = useFunctionSelection(selectedFunction, onFunctionSelected);

  if (!contractSchema) {
    return (
      <div className="py-8 text-center">
        <p>Please upload a contract definition first.</p>
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
        />

        {/* Show a message if no functions match the filter */}
        {filteredFunctions.length === 0 && (
          <p className="text-muted-foreground py-4 text-center">No functions match your filter.</p>
        )}
      </div>
    </div>
  );
}
