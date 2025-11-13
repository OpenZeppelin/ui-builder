/**
 * Utility functions for handling identity secret key property names
 */

/**
 * Resolves the identity secret key property name from configuration,
 * applying trim and empty string validation, with an optional fallback default.
 *
 * @param secretConfig - Optional secret configuration containing the property name
 * @param defaultName - Optional fallback property name if none configured (default: 'organizerSecretKey')
 * @returns The resolved property name (non-empty string), the default, or undefined if no default provided
 */
export function resolveSecretPropertyName(
  secretConfig?: { identitySecretKeyPropertyName?: string },
  defaultName?: string
): string | undefined {
  const configured = secretConfig?.identitySecretKeyPropertyName?.trim();
  if (configured && configured.length > 0) {
    return configured;
  }
  return defaultName;
}
