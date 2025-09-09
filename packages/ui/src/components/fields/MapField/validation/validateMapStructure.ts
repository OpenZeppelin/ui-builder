import { validateMapEntries } from '../../utils/validation';

interface ValidateArgs {
  value: unknown;
  required: boolean;
  minItems?: number;
}

export function validateMapStructure({ value, required, minItems }: ValidateArgs): string | true {
  const mapArray = Array.isArray(value) ? value : [];

  const duplicateError = validateMapEntries(
    mapArray as unknown as { key: string; value: unknown }[]
  );
  if (duplicateError) return duplicateError;

  const hasPartial = mapArray.some((entry: { key?: unknown; value?: unknown }) => {
    const key = entry?.key;
    const val = entry?.value;
    const keyEmpty = key === '' || key == null;
    const valEmpty = val === '' || val == null;
    return (keyEmpty && !valEmpty) || (!keyEmpty && valEmpty);
  });
  if (hasPartial) return 'All key-value pairs must be completed';

  const validEntries = mapArray.filter((entry: { key?: unknown; value?: unknown }) => {
    const key = entry?.key;
    const val = entry?.value;
    return key !== '' && key != null && val !== '' && val != null;
  });

  if (required && validEntries.length === 0) return 'This field is required';

  if (minItems && validEntries.length < minItems) {
    return `At least ${minItems} item${minItems > 1 ? 's' : ''} required`;
  }

  return true;
}
