import { ReactNode } from 'react';

export interface SelectableOption {
  id: string;
  label: string;
  disabled?: boolean;
}

interface OptionSelectorProps<T extends SelectableOption> {
  /**
   * Array of options to display in the left selector panel
   */
  options: T[];

  /**
   * Currently selected option ID
   */
  selectedId: string | null;

  /**
   * Callback when an option is selected
   */
  onSelect: (id: string) => void;

  /**
   * Content to render in the right configuration panel
   */
  configContent?: ReactNode;

  /**
   * Loading state for the selector
   */
  isLoading?: boolean;

  /**
   * Loading message to display
   */
  loadingMessage?: string;

  /**
   * Empty state message when no options are available
   */
  emptyMessage?: string;

  /**
   * Custom empty state content to render instead of default message
   */
  emptyContent?: ReactNode;

  /**
   * Custom fallback content when no option is selected
   */
  noSelectionContent?: ReactNode;

  /**
   * Optional custom styling for the grid layout
   */
  layout?: {
    columns?: number;
    gap?: number;
  };
}

export function OptionSelector<T extends SelectableOption>({
  options,
  selectedId,
  onSelect,
  configContent,
  isLoading = false,
  loadingMessage = 'Loading options...',
  emptyMessage = 'No options available.',
  emptyContent,
  noSelectionContent,
  layout = { columns: 3, gap: 4 },
}: OptionSelectorProps<T>) {
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground text-sm">{loadingMessage}</p>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="py-8 text-center">
        {emptyContent || <p className="text-muted-foreground text-sm">{emptyMessage}</p>}
      </div>
    );
  }

  const gridClass = `grid grid-cols-${layout.columns || 3} gap-${layout.gap || 4}`;

  const defaultNoSelectionContent = (
    <div className="h-full flex flex-col items-center justify-center py-8">
      <p className="text-muted-foreground text-center text-sm">
        Select an option to see its configuration.
      </p>
    </div>
  );

  const columns = layout.columns || 3;

  return (
    <div className={gridClass}>
      {/* Option Selector (left panel) */}
      <div className="rounded-md border overflow-hidden">
        {options.map((option) => (
          <div
            key={option.id}
            className={`
              px-4 py-3 border-b last:border-0 cursor-pointer text-sm
              ${selectedId === option.id ? 'bg-primary/5 font-medium' : 'hover:bg-muted/50'}
              ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => !option.disabled && onSelect(option.id)}
          >
            {option.label}
          </div>
        ))}
      </div>

      {/* Configuration area (right panel) */}
      <div className={`col-span-${columns - 1} rounded-md border p-4`}>
        {configContent || noSelectionContent || defaultNoSelectionContent}
      </div>
    </div>
  );
}
