import React, { ReactNode } from 'react';

import { cn } from '@openzeppelin/ui-builder-utils';

export interface SidebarButtonProps {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  size?: 'default' | 'small';
  badge?: string;
  disabled?: boolean;
  isSelected?: boolean;
  /** When provided, renders as an anchor element instead of a button */
  href?: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
  className?: string;
}

/**
 * A styled button component for sidebar actions with consistent styling.
 * Can render as a button or anchor element depending on whether href is provided.
 */
export function SidebarButton({
  icon,
  children,
  onClick,
  size = 'default',
  badge,
  disabled = false,
  isSelected = false,
  href,
  target,
  rel,
  className,
}: SidebarButtonProps): React.ReactElement {
  const height = size === 'small' ? 'h-10' : 'h-11';

  const commonClass = cn(
    'group relative flex items-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm transition-colors',
    badge ? 'justify-between' : 'justify-start',
    disabled
      ? 'text-gray-400 cursor-not-allowed'
      : isSelected
        ? 'text-[#111928] bg-neutral-100'
        : 'text-gray-600 hover:text-gray-700 cursor-pointer hover:before:content-[""] hover:before:absolute hover:before:inset-x-0 hover:before:top-1 hover:before:bottom-1 hover:before:bg-muted/80 hover:before:rounded-lg hover:before:-z-10',
    height,
    className
  );

  const content = (
    <>
      <div className="flex items-center gap-2">
        {icon}
        {children}
      </div>
      {badge && (
        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full font-medium">
          {badge}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={commonClass} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button className={commonClass} onClick={disabled ? undefined : onClick} disabled={disabled}>
      {content}
    </button>
  );
}
