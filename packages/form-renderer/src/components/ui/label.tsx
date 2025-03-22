'use client';

import * as React from 'react';

import * as LabelPrimitive from '@radix-ui/react-label';

type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

/**
 * Label component for form fields, following shadcn/ui styling
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => {
  return <LabelPrimitive.Root ref={ref} data-slot="label" className={className} {...props} />;
});

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
