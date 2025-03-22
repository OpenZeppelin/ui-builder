'use client';

import * as React from 'react';

import { cn } from '../../utils/cn';

/**
 * Example component that uses data-slot attributes for styling
 * This is for testing the data-slot style generator
 */
const ExampleComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="example-container"
        className={cn('bg-background flex flex-col gap-4 rounded-md border p-4', className)}
        {...props}
      >
        <div data-slot="example-header" className="flex items-center justify-between">
          <h3 data-slot="example-title" className="text-lg font-semibold">
            Example Component
          </h3>
          <button data-slot="example-close-button" className="hover:bg-muted rounded-full p-1">
            <span className="sr-only">Close</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div data-slot="example-content" className="text-sm">
          {children}
        </div>
      </div>
    );
  }
);

ExampleComponent.displayName = 'ExampleComponent';

export { ExampleComponent };
