/**
 * Shared integer validation patterns for BigInt fields and validation utilities.
 *
 * These patterns ensure consistent validation across the application.
 */

/**
 * Integer validation pattern - requires at least one digit
 * Used for validation to ensure complete integers are entered
 * Matches: -123, 0, 456
 * Does not match: -, abc, 12.3
 */
export const INTEGER_PATTERN = /^-?\d+$/;

/**
 * Integer input pattern - allows partial input during typing
 * Used during input to allow users to type minus sign first
 * Matches: -, -1, 123, (empty string)
 * Does not match: abc, 12.3
 */
export const INTEGER_INPUT_PATTERN = /^-?\d*$/;

/**
 * HTML pattern attribute for integer inputs
 * Must use [0-9] instead of \d for HTML5 pattern attribute
 */
export const INTEGER_HTML_PATTERN = '-?[0-9]*';
