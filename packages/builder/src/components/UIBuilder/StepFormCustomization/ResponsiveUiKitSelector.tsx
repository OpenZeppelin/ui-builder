import { ReactNode } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@openzeppelin/contracts-ui-builder-ui';

import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { type SelectableOption } from '../../Common/OptionSelector';

interface ResponsiveUiKitSelectorProps<T extends SelectableOption> {
  options: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  configContent?: ReactNode;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  isCollapsed?: boolean;
  iconMap?: Record<string, ReactNode>;
}

export function ResponsiveUiKitSelector<T extends SelectableOption>({
  options,
  selectedId,
  onSelect,
  configContent,
  isLoading = false,
  loadingMessage = 'Loading options...',
  emptyMessage = 'No UI kits available.',
  isCollapsed = false,
  iconMap,
}: ResponsiveUiKitSelectorProps<T>) {
  const selectedOption = options.find((opt) => opt.id === selectedId);

  // Use media query to determine if we're on mobile
  const isMobile = useMediaQuery('(max-width: 767px)');

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
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-6">
        {/* Mobile UI kit selector section */}
        <div className="space-y-3">
          {/* Unified selector/indicator */}
          <Select value={selectedId || ''} onValueChange={onSelect}>
            <SelectTrigger className="h-auto min-h-[3rem] px-4 py-3 bg-card border-2 border-border hover:border-primary/50 transition-colors [&>svg]:ml-3">
              <SelectValue asChild>
                {selectedOption ? (
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex flex-col items-start flex-1">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Selected UI Kit
                      </span>
                      <span className="font-semibold text-base mt-0.5">{selectedOption.label}</span>
                    </div>
                    {iconMap && selectedOption.id && (
                      <div className="flex-shrink-0 ml-2">{iconMap[selectedOption.id]}</div>
                    )}
                  </div>
                ) : (
                  <span>Choose a UI kit</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id} className="py-3">
                  <div className="flex items-center gap-2 w-full">
                    {iconMap && option.id && (
                      <div className="flex-shrink-0">{iconMap[option.id]}</div>
                    )}
                    <div className="font-medium text-sm">{option.label}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile configuration content */}
        {configContent && <div className="bg-card border rounded-lg p-4">{configContent}</div>}
      </div>
    );
  }

  // Desktop Layout: Sidebar + configuration
  return (
    <div className={`grid gap-4 ${isCollapsed ? 'grid-cols-[auto_1fr]' : 'grid-cols-3'}`}>
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
                <button
                  key={option.id}
                  type="button"
                  className={`
                    w-full h-12 p-2 rounded-none border-b last:border-0 transition-colors
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}
                    ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => !option.disabled && onSelect(option.id)}
                  disabled={option.disabled}
                  title={option.label}
                >
                  {iconMap && option.id && iconMap[option.id]}
                </button>
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
      <div className={`col-span-${isCollapsed ? 1 : 2} rounded-md border p-4 relative`}>
        {isCollapsed && selectedOption && (
          <div className="absolute top-2 left-2 text-xs text-muted-foreground font-medium">
            {selectedOption.label}
          </div>
        )}
        <div className={isCollapsed ? 'pt-6' : ''}>
          {configContent || (
            <div className="h-full flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground text-center text-sm">
                Select a UI kit to see its configuration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
