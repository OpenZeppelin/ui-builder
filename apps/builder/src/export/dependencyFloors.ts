/**
 * Minimum version floors for external packages that adapter export configs may
 * under-pin relative to the published adapter peerDependencies.
 *
 * Example: adapter-evm@2.3.0 peers require viem ^2.35.0 (ENS v2), but its
 * AdapterConfig still advertises viem ^2.28.0 for exported apps. PackageManager
 * elevates any listed dependency to at least these floors.
 */
export const EXTERNAL_DEPENDENCY_FLOORS: Readonly<Record<string, string>> = {
  viem: '^2.35.0',
};

/**
 * Returns the higher of `requested` and the known floor for `packageName`.
 * Only handles simple caret (^x.y.z) / exact semver strings; other ranges pass through.
 */
export function applyDependencyFloor(packageName: string, requested: string): string {
  const floor = EXTERNAL_DEPENDENCY_FLOORS[packageName];
  if (!floor) {
    return requested;
  }

  const requestedMin = parseCaretOrExact(requested);
  const floorMin = parseCaretOrExact(floor);
  if (!requestedMin || !floorMin) {
    return requested;
  }

  return compareSemver(requestedMin, floorMin) >= 0 ? requested : floor;
}

function parseCaretOrExact(range: string): [number, number, number] | null {
  const match = range.trim().match(/^\^?(\d+)\.(\d+)\.(\d+)(?:-[\w.-]+)?$/);
  if (!match) {
    return null;
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareSemver(a: [number, number, number], b: [number, number, number]): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return 0;
}
