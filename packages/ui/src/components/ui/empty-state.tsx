import { FileText } from 'lucide-react';

import React from 'react';

export interface EmptyStateProps {
  /**
   * The icon to display - can be a React component or SVG path
   */
  icon?: React.ReactNode;

  /**
   * Main heading text
   */
  title: string;

  /**
   * Descriptive text explaining the empty state
   */
  description: string;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Size variant for the empty state
   * @default 'default'
   */
  size?: 'small' | 'default' | 'large';
}

/**
 * Reusable empty state component for showing helpful messages when content is not available
 */
export function EmptyState({
  icon,
  title,
  description,
  className = '',
  size = 'default',
}: EmptyStateProps) {
  // Default icon using lucide-react
  const defaultIcon = <FileText className="h-6 w-6 text-muted-foreground" />;

  // Size-based styling
  const sizeClasses = {
    small: {
      container: 'py-6',
      iconContainer: 'p-2 mb-2',
      title: 'text-base font-medium mb-1',
      description: 'text-xs max-w-sm',
    },
    default: {
      container: 'py-12',
      iconContainer: 'p-3 mb-4',
      title: 'text-lg font-medium mb-2',
      description: 'text-sm max-w-md',
    },
    large: {
      container: 'py-16',
      iconContainer: 'p-4 mb-6',
      title: 'text-xl font-medium mb-3',
      description: 'text-base max-w-lg',
    },
  };

  const styles = sizeClasses[size];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${styles.container} ${className}`}
    >
      <div className={`rounded-full bg-muted ${styles.iconContainer}`}>{icon || defaultIcon}</div>
      <h3 className={`${styles.title}`}>{title}</h3>
      <p className={`text-muted-foreground ${styles.description}`}>{description}</p>
    </div>
  );
}
