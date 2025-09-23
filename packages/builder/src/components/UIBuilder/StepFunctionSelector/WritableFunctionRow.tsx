import { Button } from '@openzeppelin/contracts-ui-builder-ui';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

import { WritableFunctionRowProps } from './types';

export function WritableFunctionRow({ fn, isSelected, onSelect }: WritableFunctionRowProps) {
  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-md border p-3 transition-all w-full group cursor-pointer',
        'border-solid',
        // Selection and hover states
        isSelected ? 'border-primary bg-primary/5 ring-primary/20 ring-1' : 'border-border bg-card'
      )}
      aria-selected={isSelected}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(fn.id, fn.modifiesState);
      }}
    >
      {/* Function info display area */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
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
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Select button - visible on hover */}
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(fn.id, fn.modifiesState);
          }}
          className={cn(
            'h-8 px-3 text-xs',
            // Visible on mobile (sm and below), hover-only on desktop (md and up)
            'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
            'transition-opacity duration-200'
          )}
        >
          Select
        </Button>
      </div>
    </div>
  );
}
