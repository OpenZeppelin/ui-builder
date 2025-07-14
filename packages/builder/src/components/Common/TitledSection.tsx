import { ReactNode } from 'react';

import { Label } from '@openzeppelin/contracts-ui-builder-ui';

interface TitledSectionProps {
  /**
   * Main title for the section
   */
  title: string;

  /**
   * Description text below the title
   */
  description: string;

  /**
   * Content to render in the main area
   */
  children: ReactNode;

  /**
   * Optional error message to display
   */
  errorMessage?: string | null;

  /**
   * Whether the section is available (controls fallback message)
   */
  isAvailable?: boolean;

  /**
   * Custom message to show when section is not available
   */
  unavailableMessage?: string;

  /**
   * Optional custom spacing between title and content (defaults to space-y-4)
   */
  spacing?: 'tight' | 'normal' | 'loose';
}

export function TitledSection({
  title,
  description,
  children,
  errorMessage,
  isAvailable = true,
  unavailableMessage = 'This section is currently unavailable.',
  spacing = 'normal',
}: TitledSectionProps) {
  const spacingClass = {
    tight: 'space-y-2',
    normal: 'space-y-4',
    loose: 'space-y-6',
  }[spacing];

  return (
    <div className={spacingClass}>
      <div>
        <Label className="text-base font-medium mb-1">{title}</Label>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {isAvailable ? (
        <>
          {children}

          {/* Display error if present */}
          {errorMessage && (
            <div className="border-destructive bg-destructive/10 mt-4 rounded-md border p-3">
              <p className="text-destructive text-sm font-medium">{errorMessage}</p>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted-foreground text-sm">{unavailableMessage}</p>
      )}
    </div>
  );
}
