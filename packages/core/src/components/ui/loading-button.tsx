import { Slot, Slottable } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { buttonVariants } from '@/core/utils/button-variants';
import { cn } from '@/core/utils/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, loading = false, children, disabled, variant, size, asChild = false, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        <Slottable>{children}</Slottable>
      </Comp>
    );
  }
);
LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };
