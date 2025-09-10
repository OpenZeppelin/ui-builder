import React from 'react';

/**
 * Keeps a field array synchronized with a watched value's length using replace,
 * while preventing infinite loops via a guard ref.
 */
export function useMapFieldSync<TReplaceValue>(
  watchedValue: unknown,
  fieldsLength: number,
  replace: (value: TReplaceValue) => void
): ReturnType<typeof React.useRef<boolean>> {
  const isReplacingRef = React.useRef(false);

  React.useEffect(() => {
    if (isReplacingRef.current) return;

    if (Array.isArray(watchedValue) && fieldsLength !== watchedValue.length) {
      isReplacingRef.current = true;
      replace(watchedValue as TReplaceValue);
      queueMicrotask(() => {
        isReplacingRef.current = false;
      });
    }
  }, [fieldsLength, watchedValue, replace]);

  return isReplacingRef;
}
