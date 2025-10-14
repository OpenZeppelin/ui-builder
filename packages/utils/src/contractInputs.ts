import type { ContractAdapter, FormValues } from '@openzeppelin/ui-builder-types';

/**
 * Returns names of adapter-declared required inputs that are missing/empty in values.
 */
export function getMissingRequiredContractInputs(
  adapter: ContractAdapter,
  values: FormValues
): string[] {
  try {
    const inputs = adapter.getContractDefinitionInputs ? adapter.getContractDefinitionInputs() : [];
    const required = inputs.filter((field: unknown) => {
      const f = field as { validation?: { required?: boolean } };
      return f?.validation?.required === true;
    });
    const missing: string[] = [];
    for (const field of required as Array<{ name?: string; id?: string }>) {
      const key = field.name || field.id || '';
      const raw = (values as Record<string, unknown>)[key];
      if (raw == null) {
        missing.push(key);
        continue;
      }
      if (typeof raw === 'string' && raw.trim().length === 0) {
        missing.push(key);
      }
    }
    return missing;
  } catch {
    return [];
  }
}

/**
 * True if any adapter-declared required inputs are missing/empty.
 */
export function hasMissingRequiredContractInputs(
  adapter: ContractAdapter | null | undefined,
  values: FormValues
): boolean {
  if (!adapter) return false;
  return getMissingRequiredContractInputs(adapter, values).length > 0;
}
