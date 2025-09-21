import { describe, expect, it } from 'vitest';

import { computeEffectiveProviderPreference, getForcedService, parseDeepLink } from '../deepLink';

describe('deepLink (parse/precedence)', () => {
  it('parses query parameters from location.search', () => {
    const url = new URL(window.location.href);
    url.search = '?address=0xabc&chainId=1&service=etherscan';
    window.history.replaceState({}, '', url.toString());

    const params = parseDeepLink();
    expect(params.address).toBe('0xabc');
    expect(params.chainId).toBe('1');
    expect(params.service).toBe('etherscan');
  });

  it('getForcedService returns service when present', () => {
    const params = { service: 'sourcify' } as Record<string, string>;
    expect(getForcedService(params)).toBe('sourcify');
  });

  it('provider precedence: forced service > ui > app > adapter default (stub failing)', () => {
    const result = computeEffectiveProviderPreference({
      forcedService: 'sourcify',
      uiSelection: 'etherscan',
      appDefault: 'etherscan',
      adapterDefaultOrder: ['etherscan', 'sourcify'],
    });
    // This will fail until precedence logic is implemented in Phase 3.3
    expect(result.effectiveProvider).toBe('sourcify');
    expect(result.source).toBe('urlForced');
  });
});
