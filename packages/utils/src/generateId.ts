import { v4 as uuidv4 } from 'uuid';

/**
 * General utility functions, which are not specific to any blockchain
 * It's important to keep these functions as simple as possible and avoid any
 * dependencies from other packages.
 */

/**
 * Generates a unique ID for form fields, components, etc.
 * Uses crypto.getRandomValues() for browser-compatible random ID generation.
 *
 * @param prefix Optional prefix to add before the UUID
 * @returns A string ID that is guaranteed to be unique
 */
export function generateId(prefix?: string): string {
  // Generate a browser-compatible UUID v4
  const uuid = uuidv4();

  return prefix ? `${prefix}_${uuid}` : uuid;
}
