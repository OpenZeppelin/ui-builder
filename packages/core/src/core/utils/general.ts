/**
 * General utility functions, which are not specific to any blockchain
 * It's important to keep these functions as simple as possible and avoid any
 * dependencies from other packages.
 * This file is intended to be used ot only in the core app but also in all exported projects.
 * TODO: think about moving this file into a separate shared package (core-utils)
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique ID for form fields, components, etc.
 * Uses the uuid library for proper RFC 4122 UUID v4 generation.
 *
 * @param prefix Optional prefix to add before the UUID
 * @returns A string ID that is guaranteed to be unique
 */
export function generateId(prefix?: string): string {
  const uuid = uuidv4();
  return prefix ? `${prefix}_${uuid}` : uuid;
}
