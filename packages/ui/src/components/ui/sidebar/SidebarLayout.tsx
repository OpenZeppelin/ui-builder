import React, { ReactNode } from 'react';

import { cn } from '@openzeppelin/ui-builder-utils';

export interface SidebarLayoutProps {
  /** Content for the sidebar header (e.g., logo) */
  header?: ReactNode;
  /** Content to be displayed below the header but above the scrollable area */
  subHeader?: ReactNode;
  /** Main scrollable content area */
  children: ReactNode;
  /** Content for the fixed footer (e.g., nav icons) */
  footer?: ReactNode;
  /** Additional CSS classes for the sidebar container */
  className?: string;
  /** Width of the sidebar (default: 289px) */
  width?: number | string;
  /** Background color/class for the sidebar */
  background?: string;
  /** Controls visibility in mobile slide-over */
  mobileOpen?: boolean;
  /** Close handler for mobile slide-over */
  onMobileOpenChange?: (open: boolean) => void;
  /** Aria label for mobile dialog */
  mobileAriaLabel?: string;
}

/**
 * A flexible sidebar layout component with desktop sidebar and mobile slide-over.
 * Provides slots for header, scrollable content, and footer.
 */
export function SidebarLayout({
  header,
  subHeader,
  children,
  footer,
  className,
  width = 289,
  background = 'bg-[rgba(245,245,245,0.31)]',
  mobileOpen,
  onMobileOpenChange,
  mobileAriaLabel = 'Menu',
}: SidebarLayoutProps): React.ReactElement {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-40 h-full hidden xl:flex xl:flex-col',
          background,
          className
        )}
        style={{ width: widthStyle }}
      >
        {/* Fixed Header */}
        {header && <div className="shrink-0 px-8 pt-12">{header}</div>}

        {/* Fixed SubHeader */}
        {subHeader && <div className="shrink-0 px-8 mt-6">{subHeader}</div>}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-24">{children}</div>

        {/* Fixed Footer */}
        {footer && <div className="pointer-events-auto sticky bottom-0 px-8 py-4">{footer}</div>}
      </div>

      {/* Spacer to push content (desktop only) */}
      <div className="hidden xl:block" style={{ width: widthStyle }} />

      {/* Mobile slide-over */}
      {typeof mobileOpen === 'boolean' && onMobileOpenChange && (
        <div
          className={cn(
            'xl:hidden fixed inset-0 z-50',
            mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
          )}
          aria-hidden={!mobileOpen}
        >
          {/* Backdrop */}
          <div
            className={cn(
              'absolute inset-0 bg-black/40 transition-opacity',
              mobileOpen ? 'opacity-100' : 'opacity-0'
            )}
            onClick={() => onMobileOpenChange(false)}
          />
          {/* Panel */}
          <div
            className={cn(
              'absolute left-0 top-0 h-full w-[85%] max-w-[320px] bg-[rgba(245,245,245,0.98)] shadow-xl transition-transform',
              mobileOpen ? 'translate-x-0' : '-translate-x-full'
            )}
            role="dialog"
            aria-modal="true"
            aria-label={mobileAriaLabel}
          >
            <div className="flex h-full flex-col">
              {/* Mobile Header */}
              {header && <div className="shrink-0 px-6 pt-10 pb-4">{header}</div>}

              {/* Mobile SubHeader */}
              {subHeader && <div className="shrink-0 px-6 pb-4">{subHeader}</div>}

              {/* Mobile Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 pb-20">{children}</div>

              {/* Mobile Footer */}
              {footer && <div className="px-6 py-4">{footer}</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
