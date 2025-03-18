import { ReadOnlyFunctionCardProps } from './types';

export function ReadOnlyFunctionCard({ fn }: ReadOnlyFunctionCardProps) {
  return (
    <div className="bg-muted/20 rounded-md border border-dashed p-2">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <h5 className="text-sm font-medium">{fn.displayName}</h5>
          <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
            Read-only
          </span>
        </div>
        {fn.inputs.length > 0 && (
          <p className="text-muted-foreground truncate text-xs">
            Params: {fn.inputs.map((input) => input.name || input.type).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
