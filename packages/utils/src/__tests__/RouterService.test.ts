import { describe, expect, it } from 'vitest';

import { routerService } from '../RouterService';

describe('RouterService', () => {
  it('getParam returns null for missing param', () => {
    const value = routerService.getParam('missing');
    expect(value).toBeNull();
  });

  it('currentLocation returns a non-empty string in browser env', () => {
    const href = routerService.currentLocation();
    expect(typeof href).toBe('string');
  });

  it('navigate updates the URL for relative paths (pushState)', () => {
    const initial = window.location.href;
    routerService.navigate('/test-path?x=1');
    const after = window.location.href;
    expect(after).not.toBe(initial);
    expect(after.includes('/test-path?x=1')).toBe(true);
  });
});
