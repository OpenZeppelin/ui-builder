import { cn } from '@openzeppelin/contracts-ui-builder-utils';

import { WritableFunctionRowProps } from './types';

export function WritableFunctionRow({ fn, isSelected, onSelect }: WritableFunctionRowProps) {
  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-md border p-3 transition-all w-full group',
        'border-solid',
        // Selection and hover states
        isSelected ? 'border-primary bg-primary/5 ring-primary/20 ring-1' : 'border-border bg-card'
      )}
      aria-selected={isSelected}
    >
      {/* Clickable area for function selection */}
      <button
        type="button"
        onClick={() => onSelect(fn.id, fn.modifiesState)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left hover:bg-muted/50 rounded-sm p-1 -m-1 transition-colors"
      >
        {/* Function details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-medium text-sm" title={fn.displayName}>
                {fn.displayName}
              </span>
              {/* Function parameters inline for more compact layout */}
              <div className="text-xs text-muted-foreground">
                {fn.inputs.length > 0 ? (
                  <span>
                    Parameters: {fn.inputs.map((input) => input.name || input.type).join(', ')}
                  </span>
                ) : (
                  <span>No parameters</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
