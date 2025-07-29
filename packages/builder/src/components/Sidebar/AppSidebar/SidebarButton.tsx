import { ReactNode } from 'react';

import { cn } from '@openzeppelin/contracts-ui-builder-utils';

interface SidebarButtonProps {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  size?: 'default' | 'small';
  badge?: string;
  disabled?: boolean;
  isSelected?: boolean;
}

/**
 * Shared button component for sidebar actions with consistent styling
 */
export default function SidebarButton({
  icon,
  children,
  onClick,
  size = 'default',
  badge,
  disabled = false,
  isSelected = false,
}: SidebarButtonProps) {
  const height = size === 'small' ? 'h-10' : 'h-11';

  return (
    <button
      className={cn(
        // TODO: Replace hard-coded text colors with OpenZeppelin theme
        // Should use semantic tokens like 'text-sidebar-button hover:text-sidebar-button-hover'
        'group relative flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm transition-colors',
        badge ? 'justify-between' : 'justify-start',
        disabled
          ? 'text-gray-400 cursor-not-allowed'
          : isSelected
            ? // Selected state styling
              'text-[#111928] bg-neutral-100'
            : 'text-gray-600 hover:text-gray-700 cursor-pointer hover:before:content-[""] hover:before:absolute hover:before:inset-x-0 hover:before:top-1 hover:before:bottom-1 hover:before:bg-muted/80 hover:before:rounded-lg hover:before:-z-10',
        height
      )}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <div className="flex items-center gap-2">
        {icon}
        {children}
      </div>
      {badge && (
        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full font-medium">
          {badge}
        </span>
      )}
    </button>
  );
}
