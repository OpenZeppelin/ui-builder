import { CircleHelp } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@openzeppelin/ui-components';

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

  /**
   * Whether the left panel should be displayed in collapsed (compact) mode
   */
  isCollapsed?: boolean;

  /**
   * Optional mapping of option IDs to React icons for collapsed mode
   */
  iconMap?: Record<string, ReactNode>;
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
  isCollapsed = false,
  iconMap,
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

  const selectedOption = options.find((opt) => opt.id === selectedId);

  const defaultNoSelectionContent = (
    <div className="h-full flex flex-col items-center justify-center py-8">
      <p className="text-muted-foreground text-center text-sm">
        Select an option to see its configuration.
      </p>
    </div>
  );

  const columns = layout.columns || 3;
  const gridClass = `grid gap-${layout.gap || 4}`;

  // Function to get icon for an option
  const getOptionIcon = (option: T): ReactNode => {
    if (iconMap && iconMap[option.id]) {
      return iconMap[option.id];
    }
    // Fallback to first letter or default icon
    return <CircleHelp className="size-4" />;
  };

  return (
    <div
      className={`${gridClass} ${isCollapsed ? 'grid-cols-[auto_1fr]' : `grid-cols-${columns}`}`}
    >
      {/* Option Selector (left panel) */}
      <div
        className={`rounded-md border overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-12' : ''}`}
      >
        {isCollapsed ? (
          // Collapsed mode - show only icons
          <div className="flex flex-col">
            {options.map((option) => {
              const isSelected = selectedId === option.id;
              return (
                <Button
                  key={option.id}
                  variant={isSelected ? 'default' : 'ghost'}
                  size="sm"
                  className={`
                    w-full h-12 p-2 rounded-none border-b last:border-0 
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}
                    ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => !option.disabled && onSelect(option.id)}
                  disabled={option.disabled}
                  title={option.label}
                >
                  {getOptionIcon(option)}
                </Button>
              );
            })}
          </div>
        ) : (
          // Normal mode - show full option labels
          options.map((option) => (
            <div
              key={option.id}
              className={`
                px-4 py-3 border-b last:border-0 cursor-pointer text-sm transition-colors
                ${selectedId === option.id ? 'bg-primary/5 font-medium' : 'hover:bg-muted/50'}
                ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !option.disabled && onSelect(option.id)}
            >
              {option.label}
            </div>
          ))
        )}
      </div>

      {/* Configuration area (right panel) */}
      <div className={`col-span-${isCollapsed ? 1 : columns - 1} rounded-md border p-4 relative`}>
        {isCollapsed && selectedOption && (
          <div className="absolute top-2 left-2 text-xs text-muted-foreground font-medium">
            {selectedOption.label}
          </div>
        )}
        <div className={isCollapsed ? 'pt-6' : ''}>
          {configContent || noSelectionContent || defaultNoSelectionContent}
        </div>
      </div>
    </div>
  );
}
