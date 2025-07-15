import { ExternalLinkIcon } from 'lucide-react';

import React from 'react';

import { cn } from '@openzeppelin/contracts-ui-builder-utils';

// TODO: Add props
// interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
//   // No additional props needed for basic functionality
// }

// export const ExternalLink = React.forwardRef<HTMLAnchorElement, ExternalLinkProps>(
export const ExternalLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ children, className, ...props }, ref) => {
  return (
    <a
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline',
        className
      )}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
      <ExternalLinkIcon className="h-3 w-3 ml-1" /> {/* Adjust size/margin as needed */}
    </a>
  );
});

ExternalLink.displayName = 'ExternalLink';
