import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { type VariantProps, cva } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';

import * as React from 'react';

import { cn } from '@openzeppelin/contracts-ui-builder-utils';

const accordionItemVariants = cva('', {
  variants: {
    variant: {
      default: 'border-b',
      card: 'mb-3 rounded-lg border bg-card shadow-sm overflow-hidden',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const accordionTriggerVariants = cva(
  'flex flex-1 items-center justify-between font-medium transition-all [&[data-state=open]>svg]:rotate-180',
  {
    variants: {
      variant: {
        default: 'py-4 hover:underline',
        card: 'px-4 py-3 hover:bg-muted/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const accordionContentVariants = cva(
  'overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
  {
    variants: {
      variant: {
        default: '',
        card: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const accordionContentInnerVariants = cva('', {
  variants: {
    variant: {
      default: 'pb-4 pt-0',
      card: 'px-4 pb-4 pt-1',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

// Create a context for the variant
type AccordionVariant = 'default' | 'card';
const AccordionVariantContext = React.createContext<AccordionVariant>('default');

// Extend the Accordion component to accept and provide variant
type AccordionProps = (
  | AccordionPrimitive.AccordionSingleProps
  | AccordionPrimitive.AccordionMultipleProps
) & {
  variant?: AccordionVariant;
};

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ variant = 'default', ...props }, ref) => (
    <AccordionVariantContext.Provider value={variant}>
      <AccordionPrimitive.Root ref={ref} {...props} />
    </AccordionVariantContext.Provider>
  )
);
Accordion.displayName = 'Accordion';

interface AccordionItemProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>,
    VariantProps<typeof accordionItemVariants> {}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, variant: variantProp, ...props }, ref) => {
    const contextVariant = React.useContext(AccordionVariantContext);
    const variant = variantProp ?? contextVariant;

    return (
      <AccordionPrimitive.Item
        ref={ref}
        className={cn(accordionItemVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>,
    VariantProps<typeof accordionTriggerVariants> {}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, variant: variantProp, ...props }, ref) => {
    const contextVariant = React.useContext(AccordionVariantContext);
    const variant = variantProp ?? contextVariant;

    return (
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          ref={ref}
          className={cn(accordionTriggerVariants({ variant }), className)}
          {...props}
        >
          {children}
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

interface AccordionContentProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>,
    VariantProps<typeof accordionContentVariants> {}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, variant: variantProp, ...props }, ref) => {
    const contextVariant = React.useContext(AccordionVariantContext);
    const variant = variantProp ?? contextVariant;

    return (
      <AccordionPrimitive.Content
        ref={ref}
        className={cn(accordionContentVariants({ variant }), className)}
        {...props}
      >
        <div className={cn(accordionContentInnerVariants({ variant }))}>{children}</div>
      </AccordionPrimitive.Content>
    );
  }
);
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
export type { AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps };
