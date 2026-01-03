import { AlertCircle } from 'lucide-react';

import { Button } from '@openzeppelin/ui-components';
import type { FunctionDecoration } from '@openzeppelin/ui-types';
import { FunctionBadge, FunctionParameter } from '@openzeppelin/ui-types';
import { cn } from '@openzeppelin/ui-utils';

import { WritableFunctionRowProps } from './types';

/**
 * Badge component for displaying function decorations
 */
function DecorationBadge({ decoration }: { decoration: FunctionDecoration }) {
  if (!decoration.badges || decoration.badges.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 ml-2">
      {decoration.badges.map((badge: FunctionBadge, idx: number) => (
        <div
          key={idx}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
            badge.variant === 'warning'
              ? 'bg-amber-100 text-amber-800'
              : badge.variant === 'info'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-neutral-100 text-neutral-800'
          )}
          title={badge.tooltip || badge.text}
        >
          {badge.variant === 'warning' && <AlertCircle size={12} className="shrink-0" />}
          <span>{badge.text}</span>
        </div>
      ))}
    </div>
  );
}

export function WritableFunctionRow({
  fn,
  isSelected,
  onSelect,
  decoration,
}: WritableFunctionRowProps & { decoration?: FunctionDecoration }) {
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
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm" title={fn.displayName}>
                  {fn.displayName}
                </span>
                {decoration && <DecorationBadge decoration={decoration} />}
              </div>
              {/* Function parameters inline for more compact layout */}
              <div className="text-xs text-muted-foreground">
                {fn.inputs.length > 0 ? (
                  <span>
                    Parameters:{' '}
                    {fn.inputs
                      .map((input: FunctionParameter) => input.name || input.type)
                      .join(', ')}
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
