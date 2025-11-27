import React, { ReactNode } from 'react';

import { cn } from '@openzeppelin/ui-builder-utils';

export interface SidebarSectionProps {
  /** Optional section title displayed above the content */
  title?: string;
  /** Content to render within the section */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** CSS classes for the title element */
  titleClassName?: string;
  /** Whether this section should grow to fill available space */
  grow?: boolean;
}

/**
 * A generic sidebar section wrapper with optional title.
 * Used to group related sidebar items together.
 */
export function SidebarSection({
  title,
  children,
  className,
  titleClassName,
  grow = false,
}: SidebarSectionProps): React.ReactElement {
  return (
    <div className={cn('flex flex-col w-full', grow && 'flex-1', className)}>
      {title && (
        <div className={cn('text-[#5e5e5e] text-xs font-semibold leading-4 mb-1', titleClassName)}>
          {title}
        </div>
      )}
      <div className={cn('flex flex-col', grow && 'flex-1 overflow-hidden')}>{children}</div>
    </div>
  );
}
