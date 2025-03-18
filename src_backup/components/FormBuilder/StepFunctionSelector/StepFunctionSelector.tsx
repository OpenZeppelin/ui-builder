import { useFunctionFilter } from './hooks/useFunctionFilter';
import { useFunctionSelection } from './hooks/useFunctionSelection';
import { useReadOnlyVisibility } from './hooks/useReadOnlyVisibility';
import { FilterControls } from './FilterControls';
import { ReadOnlyFunctionsSection } from './ReadOnlyFunctionsSection';
import { StepFunctionSelectorProps } from './types';
import { WritableFunctionsSection } from './WritableFunctionsSection';

export function StepFunctionSelector({
  contractSchema,
  selectedFunction,
  onFunctionSelected,
}: StepFunctionSelectorProps) {
  // Use custom hooks to manage component logic
  const { filteredFunctions, writableFunctions, readOnlyFunctions, filterValue, setFilterValue } =
    useFunctionFilter(contractSchema);

  const { showReadOnlyFunctions, setShowReadOnlyFunctions } = useReadOnlyVisibility(false);

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
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Contract Function</h3>
        <p className="text-muted-foreground">
          Choose the contract function you want to create a transaction form for. Each function will
          have its own dedicated form.
        </p>
      </div>

      <FilterControls
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        showReadOnlyFunctions={showReadOnlyFunctions}
        setShowReadOnlyFunctions={setShowReadOnlyFunctions}
      />

      <div className="max-h-96 space-y-6 overflow-y-auto">
        <WritableFunctionsSection
          functions={writableFunctions}
          selectedFunction={selectedFunction}
          onSelectFunction={selectFunction}
        />

        {showReadOnlyFunctions && <ReadOnlyFunctionsSection functions={readOnlyFunctions} />}

        {/* Show a message if no functions match the filter */}
        {filteredFunctions.length === 0 && (
          <p className="text-muted-foreground py-4 text-center">No functions match your filter.</p>
        )}
      </div>
    </div>
  );
}
