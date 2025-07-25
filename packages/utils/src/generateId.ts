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
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  return prefix ? `${prefix}_${uuid}` : uuid;
}
