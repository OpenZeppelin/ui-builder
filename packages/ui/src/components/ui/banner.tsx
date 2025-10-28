import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@openzeppelin/ui-builder-utils';

interface BannerProps {
  /**
   * The variant/style of the banner
   * @default 'info'
   */
  variant?: 'info' | 'success' | 'warning' | 'error';

  /**
   * Title text displayed at the top of the banner
   */
  title?: React.ReactNode;

  /**
   * Body text/content of the banner
   */
  children: React.ReactNode;

  /**
   * Whether the banner can be dismissed
   * @default true
   */
  dismissible?: boolean;

  /**
   * Callback when the banner is dismissed
   */
  onDismiss?: () => void;

  /**
   * Icon to display on the left (replaces default based on variant)
   */
  icon?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

const variantStyles: Record<
  string,
  { container: string; icon: string; title: string; body: string }
> = {
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    body: 'text-blue-800',
  },
  success: {
    container: 'border-green-200 bg-green-50',
    icon: 'text-green-600',
    title: 'text-green-900',
    body: 'text-green-800',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    body: 'text-amber-800',
  },
  error: {
    container: 'border-red-200 bg-red-50',
    icon: 'text-red-600',
    title: 'text-red-900',
    body: 'text-red-800',
  },
};

/**
 * Dismissible banner component for notifications and alerts
 * Can be used with various variants (info, success, warning, error)
 */
export const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  ({ className, variant = 'info', title, children, dismissible = true, onDismiss, icon }, ref) => {
    const styles = variantStyles[variant] || variantStyles.info;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn('rounded-md border p-4', styles.container, className)}
      >
        <div className="flex gap-3">
          {icon && <div className={cn('mt-0.5 shrink-0', styles.icon)}>{icon}</div>}
          <div className="flex-1">
            {title && <h4 className={cn('mb-2 font-semibold text-sm', styles.title)}>{title}</h4>}
            <div className={cn('text-sm whitespace-pre-line', styles.body)}>{children}</div>
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onDismiss}
              className={cn('shrink-0 transition-colors hover:opacity-70', styles.icon)}
              aria-label="Dismiss banner"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
Banner.displayName = 'Banner';
