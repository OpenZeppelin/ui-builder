import * as LabelPrimitive from '@radix-ui/react-label';
import * as React from 'react';

import { cn } from '@openzeppelin/contracts-ui-builder-utils';

type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;
/**
 * Label component for form fields, following shadcn/ui styling
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => {
  return (
    <LabelPrimitive.Root
      ref={ref}
      data-slot="label"
      className={cn('text-sm leading-none font-medium', className)}
      {...props}
    />
  );
});

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
