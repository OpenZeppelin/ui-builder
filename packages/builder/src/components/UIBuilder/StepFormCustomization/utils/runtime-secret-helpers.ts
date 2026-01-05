import type { RuntimeSecretPropertyInput } from '@openzeppelin/ui-types';

/**
 * Extended binding info with optional property name input config.
 * Adapters can provide this to enable per-function property name customization.
 */
export interface ExtendedRuntimeBinding {
  key: string;
  label: string;
  helperText?: string;
  metadata?: Record<string, unknown>;
  propertyNameInput?: RuntimeSecretPropertyInput;
}

/**
 * Build initial metadata for runtime secret field,
 * seeding property name input default if adapter provides it.
 *
 * @param binding - Extended runtime binding from adapter
 * @returns Metadata object with seeded property name if applicable,
 *          or the original metadata, or undefined if no metadata exists
 */
export function buildInitialMetadata(
  binding: ExtendedRuntimeBinding
): Record<string, unknown> | undefined {
  const { metadata, propertyNameInput } = binding;

  if (!propertyNameInput?.metadataKey || !propertyNameInput.defaultValue) {
    return metadata;
  }

  return {
    ...metadata,
    [propertyNameInput.metadataKey]:
      metadata?.[propertyNameInput.metadataKey] ?? propertyNameInput.defaultValue,
  };
}
