import { isMapEntryArray, MapEntry } from '@openzeppelin/contracts-ui-builder-types';

import { validateMapEntries } from '../../utils/validation';

interface ValidateArgs {
  value: unknown;
  required: boolean;
  minItems?: number;
}

export function validateMapStructure({ value, required, minItems }: ValidateArgs): string | true {
  // Validate that the value is actually an array of MapEntry objects
  if (!isMapEntryArray(value)) {
    if (required) return 'This field is required';
    return true;
  }

  const mapArray: MapEntry[] = value;

  const duplicateError = validateMapEntries(mapArray);
  if (duplicateError) return duplicateError;

  const hasPartial = mapArray.some((entry: MapEntry) => {
    const key = entry.key;
    const val = entry.value;
    const keyEmpty = key === '' || key == null;
    const valEmpty = val === '' || val == null;
    return (keyEmpty && !valEmpty) || (!keyEmpty && valEmpty);
  });
  if (hasPartial) return 'All key-value pairs must be completed';

  const validEntries = mapArray.filter((entry: MapEntry) => {
    const key = entry.key;
    const val = entry.value;
    return key !== '' && key != null && val !== '' && val != null;
  });

  if (required && validEntries.length === 0) return 'This field is required';

  if (minItems && validEntries.length < minItems) {
    return `At least ${minItems} item${minItems > 1 ? 's' : ''} required`;
  }

  return true;
}
