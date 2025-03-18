import { WritableFunctionsSectionProps } from './types';
import { WritableFunctionCard } from './WritableFunctionCard';

export function WritableFunctionsSection({
  functions,
  selectedFunction,
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
          <WritableFunctionCard
            key={fn.id}
            fn={fn}
            isSelected={selectedFunction === fn.id}
            onSelect={onSelectFunction}
          />
        ))
      )}
    </div>
  );
}
