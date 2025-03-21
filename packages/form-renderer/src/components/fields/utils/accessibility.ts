/**
 * Accessibility utilities for form field components
 */

/**
 * Default aria-describedby ID generator based on field ID
 */
export function getDescribedById(
  id: string,
  type: 'error' | 'description' | 'counter' = 'error'
): string {
  return `${id}-${type}`;
}

/**
 * Interface for accessibility attributes to be applied to form fields
 */
export interface AccessibilityProps {
  /**
   * ARIA attributes for accessibility
   */
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  'aria-describedby'?: string;
  'aria-errormessage'?: string;
  'aria-labelledby'?: string;

  /**
   * Indicates if the input is required
   */
  required?: boolean;

  /**
   * Indicates if the input is disabled
   */
  disabled?: boolean;

  /**
   * Indicates if the input is readonly
   */
  readOnly?: boolean;

  /**
   * Tab index for keyboard navigation
   * Use 0 for normal tab order
   * Use -1 to remove from tab order
   */
  tabIndex?: number;
}

/**
 * Generates accessibility attributes for form fields
 */
export function getAccessibilityProps({
  id,
  hasError = false,
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  hasHelperText = false,
  hasCharacterCounter = false,
}: {
  id: string;
  hasError?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  hasHelperText?: boolean;
  hasCharacterCounter?: boolean;
}): AccessibilityProps {
  // Build aria-describedby referencing multiple elements if needed
  const describedByIds: string[] = [];

  if (hasError) {
    describedByIds.push(getDescribedById(id, 'error'));
  }

  if (hasHelperText) {
    describedByIds.push(getDescribedById(id, 'description'));
  }

  if (hasCharacterCounter) {
    describedByIds.push(getDescribedById(id, 'counter'));
  }

  return {
    'aria-invalid': hasError,
    'aria-required': isRequired,
    'aria-describedby': describedByIds.length > 0 ? describedByIds.join(' ') : undefined,
    'aria-errormessage': hasError ? getDescribedById(id, 'error') : undefined,
    required: isRequired,
    disabled: isDisabled,
    readOnly: isReadOnly,
    tabIndex: isDisabled ? -1 : 0,
  };
}

/**
 * Utility function to handle keyboard events for interactive elements
 * Helps ensure keyboard users can interact with form controls
 */
export function handleKeyboardEvent(
  event: React.KeyboardEvent,
  handlers: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onTab?: () => void;
  }
): void {
  switch (event.key) {
    case 'Enter':
      if (handlers.onEnter) {
        event.preventDefault();
        handlers.onEnter();
      }
      break;
    case ' ':
      if (handlers.onSpace) {
        event.preventDefault();
        handlers.onSpace();
      }
      break;
    case 'Escape':
      if (handlers.onEscape) {
        event.preventDefault();
        handlers.onEscape();
      }
      break;
    case 'ArrowUp':
      if (handlers.onArrowUp) {
        event.preventDefault();
        handlers.onArrowUp();
      }
      break;
    case 'ArrowDown':
      if (handlers.onArrowDown) {
        event.preventDefault();
        handlers.onArrowDown();
      }
      break;
    case 'ArrowLeft':
      if (handlers.onArrowLeft) {
        event.preventDefault();
        handlers.onArrowLeft();
      }
      break;
    case 'ArrowRight':
      if (handlers.onArrowRight) {
        event.preventDefault();
        handlers.onArrowRight();
      }
      break;
    case 'Tab':
      if (handlers.onTab) {
        event.preventDefault();
        handlers.onTab();
      }
      break;
    default:
      break;
  }
}

/**
 * Field focus management utility
 * For managing focus within a field group or complex form component
 */
export function createFocusManager() {
  return {
    /**
     * Focus the first focusable element within a container
     */
    focusFirstElement(container: HTMLElement | null): void {
      if (!container) return;

      const focusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusable.length > 0) {
        focusable[0].focus();
      }
    },

    /**
     * Focus a specific element by ID
     */
    focusElementById(id: string): void {
      const element = document.getElementById(id);
      if (element) {
        element.focus();
      }
    },

    /**
     * Trap focus within a container (for modals, dropdowns, etc.)
     */
    trapFocus(event: KeyboardEvent, container: HTMLElement | null): void {
      if (!container || event.key !== 'Tab') return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );

      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
  };
}

/**
 * Provides a handler for Escape key to clear input fields
 *
 * @param onChange - Function to call when value changes
 * @param value - Current value of the input
 * @returns A function to handle the Escape key press
 */
export function handleEscapeKey(
  onChange: (value: string) => void,
  value: unknown
): (e: React.KeyboardEvent) => void {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();

      // Only reset if there's a value to clear
      if (value) {
        onChange('');
      } else {
        // If already empty, blur the field
        (e.target as HTMLElement).blur();
      }
    }
  };
}

/**
 * Provides a handler for Space/Enter keys for toggle components (checkboxes, switches)
 *
 * @param onChange - Function to call when value changes
 * @param value - Current value of the input
 * @returns A function to handle the Space/Enter key press
 */
export function handleToggleKeys(
  onChange: (value: boolean) => void,
  value: boolean
): (e: React.KeyboardEvent) => void {
  return (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!value);
    }
  };
}

/**
 * Provides a handler for arrow keys for numeric inputs
 *
 * @param onChange - Function to call when value changes
 * @param value - Current numeric value
 * @param step - Step amount for increments/decrements
 * @param min - Minimum allowed value (optional)
 * @param max - Maximum allowed value (optional)
 * @returns A function to handle arrow key presses
 */
export function handleNumericKeys(
  onChange: (value: number) => void,
  value: number,
  step: number = 1,
  min?: number,
  max?: number
): (e: React.KeyboardEvent) => void {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const direction = e.key === 'ArrowUp' ? 1 : -1;
      let newValue = typeof value === 'number' ? value + step * direction : 0;

      // Apply min/max constraints if provided
      if (typeof min === 'number') newValue = Math.max(min, newValue);
      if (typeof max === 'number') newValue = Math.min(max, newValue);

      onChange(newValue);
    }
  };
}
