import type { ContractAdapter, FormFieldType, FormValues } from '@openzeppelin/ui-builder-types';

type RequiredInputSnapshot = Record<string, unknown>;

function normalizeSnapshotValue(value: unknown): unknown {
  if (value instanceof File) {
    return {
      name: value.name,
      size: value.size,
      lastModified: value.lastModified,
    };
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (value === undefined) {
    return null;
  }

  return value;
}

function extractRequiredFields(adapter: ContractAdapter | null): FormFieldType[] {
  if (!adapter || typeof adapter.getContractDefinitionInputs !== 'function') {
    return [];
  }

  try {
    const inputs = adapter.getContractDefinitionInputs() || [];
    return inputs.filter((field) => field.validation?.required);
  } catch {
    return [];
  }
}

export function buildRequiredInputSnapshot(
  adapter: ContractAdapter | null,
  formValues: FormValues | null | undefined
): RequiredInputSnapshot | null {
  if (!formValues) {
    return null;
  }

  const requiredFields = extractRequiredFields(adapter);
  if (requiredFields.length === 0) {
    return null;
  }

  const snapshot: RequiredInputSnapshot = {};
  const values = formValues as Record<string, unknown>;

  for (const field of requiredFields) {
    const key = field.name || field.id;
    if (!key) continue;
    snapshot[key] = normalizeSnapshotValue(values[key]);
  }

  return Object.keys(snapshot).length > 0 ? snapshot : null;
}

export function requiredSnapshotsEqual(
  a: RequiredInputSnapshot | null,
  b: RequiredInputSnapshot | null
): boolean {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i += 1) {
    if (keysA[i] !== keysB[i]) {
      return false;
    }

    const valueA = a[keysA[i]];
    const valueB = b[keysA[i]];

    if (
      typeof valueA === 'object' &&
      valueA !== null &&
      typeof valueB === 'object' &&
      valueB !== null
    ) {
      if (JSON.stringify(valueA) !== JSON.stringify(valueB)) {
        return false;
      }
    } else if (valueA !== valueB) {
      return false;
    }
  }

  return true;
}
