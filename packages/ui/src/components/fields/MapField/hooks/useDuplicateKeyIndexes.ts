import React from 'react';

export function useDuplicateKeyIndexes(watchedValue: unknown): Set<number> {
  return React.useMemo(() => {
    const duplicates = new Set<number>();
    if (!Array.isArray(watchedValue)) return duplicates;

    const keyCounts = new Map<string, number[]>();
    watchedValue.forEach((item: { key?: unknown }, index: number) => {
      const key = item?.key;
      if (key !== undefined && key !== null && key !== '') {
        const keyStr = String(key);
        if (!keyCounts.has(keyStr)) keyCounts.set(keyStr, []);
        keyCounts.get(keyStr)!.push(index);
      }
    });

    for (const [, indexes] of keyCounts) {
      if (indexes.length > 1) {
        indexes.forEach((i) => duplicates.add(i));
      }
    }
    return duplicates;
  }, [watchedValue]);
}
