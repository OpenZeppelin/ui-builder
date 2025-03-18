import { ReadOnlyFunctionCard } from './ReadOnlyFunctionCard';
import { ReadOnlyFunctionsSectionProps } from './types';

export function ReadOnlyFunctionsSection({ functions }: ReadOnlyFunctionsSectionProps) {
  if (functions.length === 0) return null;

  return (
    <div className="space-y-2 border-t pt-4">
      <h4 className="text-md text-muted-foreground font-medium">Read-only Functions</h4>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {functions.map((fn) => (
          <ReadOnlyFunctionCard key={fn.id} fn={fn} />
        ))}
      </div>
    </div>
  );
}
