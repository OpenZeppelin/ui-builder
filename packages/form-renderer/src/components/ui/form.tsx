import type { FieldError, FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

import * as React from 'react';
import { Controller, FormProvider, useFormContext } from 'react-hook-form';

import { cn } from '../../utils/cn';

import { Label } from './label';

/**
 * Context provider for the form
 */
const Form = <TFieldValues extends FieldValues = FieldValues, TContext = unknown>({
  ...props
}: React.ComponentProps<typeof FormProvider<TFieldValues, TContext>>): React.ReactElement => {
  return <FormProvider {...props} />;
};

/**
 * Props for form field components
 */
interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

/**
 * Context for form field state
 */
const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

/**
 * Get form field context
 */
const useFormField = (): {
  id: string;
  name: string;
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
  error?: FieldError;
} => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error: fieldState.error as FieldError | undefined,
  };
};

/**
 * Form field component
 */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>): React.ReactElement => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

/**
 * Context for form item state
 */
interface FormItemContextValue {
  id: string;
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

/**
 * Form item component
 */
const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div
          ref={ref}
          data-slot="form-item"
          className={cn('flex flex-col gap-2', className)}
          {...props}
        />
      </FormItemContext.Provider>
    );
  }
);
FormItem.displayName = 'FormItem';

/**
 * Form label component
 */
const FormLabel = React.forwardRef<HTMLLabelElement, React.ComponentPropsWithoutRef<typeof Label>>(
  ({ className, ...props }, ref) => {
    const { error, formItemId } = useFormField();

    return (
      <Label
        ref={ref}
        className={error ? cn('text-destructive', className) : className}
        htmlFor={formItemId}
        {...props}
      />
    );
  }
);
FormLabel.displayName = 'FormLabel';

/**
 * Form control component
 */
const FormControl = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
      <div
        ref={ref}
        id={formItemId}
        aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
        aria-invalid={!!error}
        {...props}
      />
    );
  }
);
FormControl.displayName = 'FormControl';

/**
 * Form description component
 */
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      data-slot="form-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

/**
 * Form error message component
 */
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      data-slot="form-message"
      className={cn('text-destructive text-sm font-medium', className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';

/**
 * Types for form controller props
 */
type ControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  control?: UseFormReturn<TFieldValues>['control'];
  render: (props: {
    field: {
      value: unknown;
      onChange: (...event: unknown[]) => void;
      onBlur: () => void;
      name: TName;
      ref: React.RefCallback<HTMLInputElement>;
    };
    fieldState: {
      invalid: boolean;
      isTouched: boolean;
      isDirty: boolean;
      error?: unknown;
    };
    formState: UseFormReturn<TFieldValues>['formState'];
  }) => React.ReactElement;
};

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage };
