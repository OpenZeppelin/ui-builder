import * as React from 'react';

/**
 * Input component that follows shadcn/ui styling and accessibility patterns
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return <input type={type} data-slot="input" className={className} ref={ref} {...props} />;
  }
);

Input.displayName = 'Input';

export { Input };
