import { ReactNode } from 'react';

import { cn } from '@openzeppelin/contracts-ui-builder-utils';

interface SidebarButtonProps {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  size?: 'default' | 'small';
}

/**
 * Shared button component for sidebar actions with consistent styling
 */
export default function SidebarButton({
  icon,
  children,
  onClick,
  size = 'default',
}: SidebarButtonProps) {
  const height = size === 'small' ? 'h-10' : 'h-11';

  return (
    <button
      className={cn(
        // TODO: Replace hard-coded text colors with OpenZeppelin theme
        // Should use semantic tokens like 'text-sidebar-button hover:text-sidebar-button-hover'
        'group relative flex items-center justify-start gap-2 px-3 py-2.5 rounded-lg text-gray-600 hover:text-gray-700 font-semibold text-sm cursor-pointer transition-colors',
        'hover:before:content-[""] hover:before:absolute hover:before:inset-x-0 hover:before:top-1 hover:before:bottom-1 hover:before:bg-muted/80 hover:before:rounded-lg hover:before:-z-10',
        height
      )}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
