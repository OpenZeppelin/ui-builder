import { WritableFunctionRow } from './WritableFunctionRow';
import { WritableFunctionsSectionProps } from './types';

export function WritableFunctionsSection({
  functions,
  onSelectFunction,
}: WritableFunctionsSectionProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-md font-medium">Writable Functions</h4>
      {functions.length === 0 ? (
        <p className="text-muted-foreground py-2 text-center">
          No writable functions found in this contract.
        </p>
      ) : (
        functions.map((fn) => (
          <WritableFunctionRow
            key={fn.id}
            fn={fn}
            isSelected={false} // Never show selection in the function selector step. We automatically navigate to the form customization step when a function is selected.
            onSelect={onSelectFunction}
          />
        ))
      )}
    </div>
  );
}
