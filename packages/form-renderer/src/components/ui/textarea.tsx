import * as React from 'react';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return <textarea data-slot="textarea" className={className} ref={ref} {...props} />;
});

Textarea.displayName = 'Textarea';

export { Textarea };
