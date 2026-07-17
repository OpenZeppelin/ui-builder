import { describe, expect, it } from 'vitest';

import { applyDependencyFloor, EXTERNAL_DEPENDENCY_FLOORS } from '../dependencyFloors';

describe('dependencyFloors', () => {
  it('exposes a viem ENS floor', () => {
    expect(EXTERNAL_DEPENDENCY_FLOORS.viem).toBe('^2.35.0');
  });

  it('elevates viem below the floor', () => {
    expect(applyDependencyFloor('viem', '^2.28.0')).toBe('^2.35.0');
    expect(applyDependencyFloor('viem', '^2.0.0')).toBe('^2.35.0');
  });

  it('keeps viem at or above the floor', () => {
    expect(applyDependencyFloor('viem', '^2.35.0')).toBe('^2.35.0');
    expect(applyDependencyFloor('viem', '^2.47.10')).toBe('^2.47.10');
  });

  it('passes through packages without a floor', () => {
    expect(applyDependencyFloor('wagmi', '^2.15.0')).toBe('^2.15.0');
  });
});
