import { UseFormReturn } from 'react-hook-form';

export function computeChildTouched(
  formContext: UseFormReturn | undefined,
  name: string,
  watchedValue: unknown
): boolean {
  const mapArray = Array.isArray(watchedValue)
    ? (watchedValue as Array<{ key?: unknown; value?: unknown }>)
    : [];
  if (!formContext || mapArray.length === 0) return false;

  for (let i = 0; i < mapArray.length; i++) {
    const keyPath = `${name}.${i}.key` as const;
    const valuePath = `${name}.${i}.value` as const;
    const keyState = formContext.getFieldState(keyPath, formContext.formState);
    const valueState = formContext.getFieldState(valuePath, formContext.formState);
    if (keyState.isTouched || valueState.isTouched) return true;
  }
  return false;
}
