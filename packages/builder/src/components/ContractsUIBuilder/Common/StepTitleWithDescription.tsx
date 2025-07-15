import { ReactNode } from 'react';

interface StepTitleWithDescriptionProps {
  title: string;
  description: ReactNode;
  className?: string;
}

/**
 * Reusable component for step titles and descriptions
 * Used across builder app steps for consistent layout and styling
 * Width constrained to 60% to prevent overlap with the contract state widget
 */
export function StepTitleWithDescription({
  title,
  description,
  className = '',
}: StepTitleWithDescriptionProps) {
  return (
    <div className={`space-y-2 w-[60%] ${className}`}>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
