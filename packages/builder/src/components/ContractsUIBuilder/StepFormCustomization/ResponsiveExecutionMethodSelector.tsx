import { ReactNode } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@openzeppelin/contracts-ui-builder-ui';

import { OptionSelector, type SelectableOption } from '../../Common/OptionSelector';

interface ExecutionMethodOption extends SelectableOption {
  value: string;
}

interface ResponsiveExecutionMethodSelectorProps {
  /**
   * Array of execution method options
   */
  options: ExecutionMethodOption[];

  /**
   * Currently selected method ID
   */
  selectedId: string | null;

  /**
   * Callback when a method is selected
   */
  onSelect: (id: string) => void;

  /**
   * Configuration content for the selected method
   */
  configContent?: ReactNode;

  /**
   * Whether the widget is expanded (affects desktop layout)
   */
  isCollapsed?: boolean;

  /**
   * Icon mapping for execution methods
   */
  iconMap?: Record<string, ReactNode>;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Loading message
   */
  loadingMessage?: string;
}

/**
 * Responsive execution method selector that adapts the layout for different screen sizes.
 *
 * On mobile devices (< md breakpoint):
 * - Shows a dropdown selector for choosing execution methods
 * - Displays the method configuration below the selector
 *
 * On desktop devices (>= md breakpoint):
 * - Shows the traditional sidebar layout with method list on the left
 * - Displays the method configuration on the right side
 */
export function ResponsiveExecutionMethodSelector({
  options,
  selectedId,
  onSelect,
  configContent,
  isCollapsed = false,
  iconMap,
  isLoading = false,
  loadingMessage = 'Loading execution methods...',
}: ResponsiveExecutionMethodSelectorProps) {
  const selectedOption = options.find((opt) => opt.id === selectedId);

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
        <p className="text-muted-foreground text-sm">No execution methods available.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <div className="space-y-6">
          {/* Mobile method selector section */}
          <div className="space-y-3">
            {/* Unified selector/indicator */}
            <Select value={selectedId || ''} onValueChange={onSelect}>
              <SelectTrigger className="h-auto min-h-[3rem] px-4 py-3 bg-card border-2 border-border hover:border-primary/50 transition-colors [&>svg]:ml-3">
                <SelectValue asChild>
                  {selectedOption ? (
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex flex-col items-start flex-1">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          Selected Method
                        </span>
                        <span className="font-semibold text-base mt-0.5">
                          {selectedOption.label}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {iconMap && iconMap[selectedOption.id] && (
                          <div className="text-muted-foreground">{iconMap[selectedOption.id]}</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span>Choose an execution method</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem
                    key={option.id}
                    value={option.id}
                    className="py-3"
                    disabled={option.disabled}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {iconMap && iconMap[option.id] && (
                        <div className="text-muted-foreground">{iconMap[option.id]}</div>
                      )}
                      <div className="font-medium text-sm">{option.label}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile method configuration content */}
          {selectedOption && configContent && (
            <div className="bg-card border rounded-lg p-4">{configContent}</div>
          )}
        </div>
      </div>

      {/* Desktop Layout: Use existing OptionSelector */}
      <div className="hidden md:block">
        <OptionSelector
          options={options}
          selectedId={selectedId}
          onSelect={onSelect}
          configContent={configContent}
          isCollapsed={isCollapsed}
          iconMap={iconMap}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
        />
      </div>
    </>
  );
}
