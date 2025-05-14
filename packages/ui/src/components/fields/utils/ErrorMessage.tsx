import React from 'react';
import { FieldError } from 'react-hook-form';

import { getErrorMessage } from './validation';

interface ErrorMessageProps {
  /**
   * The error object from React Hook Form
   */
  error?: FieldError;

  /**
   * The ID of the error message for aria-errormessage references
   */
  id: string;

  /**
   * Optional custom error message to display instead of the error from React Hook Form
   */
  message?: string;

  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * Displays validation error messages for form fields
 */
export function ErrorMessage({
  error,
  id,
  message,
  className = '',
}: ErrorMessageProps): React.ReactElement | null {
  const errorMessage = message || getErrorMessage(error);

  if (!errorMessage) return null;

  return (
    <div id={id} className={`text-destructive mt-1 text-sm ${className}`} role="alert">
      {errorMessage}
    </div>
  );
}
