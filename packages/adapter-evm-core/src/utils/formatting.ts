/**
 * Format a method name for display (e.g., from camelCase to Title Case).
 */
export function formatMethodName(name: string): string {
  if (!name) return '';
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Format an input name for display (e.g., from camelCase or snake_case to Title Case).
 * Provides a default name based on type if the original name is empty.
 */
export function formatInputName(name: string, type: string): string {
  if (!name || name === '') {
    return `Parameter (${type})`; // Use type if name is missing
  }
  return name
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
}
