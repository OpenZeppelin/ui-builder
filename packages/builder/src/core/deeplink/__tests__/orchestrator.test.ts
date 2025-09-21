import { describe, expect, it } from 'vitest';

import { resolveDeepLinkPlan } from '../orchestrator';

describe('Deep link orchestrator (non-UI)', () => {
  const ctx = {
    hasSavedSession: true,
    adapterSupportedServices: ['etherscan', 'sourcify'] as const,
    adapterDefaultOrder: ['etherscan', 'sourcify'] as const,
  } as const;

  it('deep link takes precedence over saved session by triggering load', () => {
    const plan = resolveDeepLinkPlan(
      { networkId: 'evm:1', identifier: '0xabc', service: null },
      ctx
    );
    // Fails until implementation: should be action=load
    expect(plan.action).toBe('load');
    expect(plan.networkId).toBe('evm:1');
    expect(plan.identifier).toBe('0xabc');
  });

  it('unsupported forced service → auto-fallback to adapter default', () => {
    const plan = resolveDeepLinkPlan(
      { networkId: 'evm:1', identifier: '0xabc', service: 'unknown' },
      ctx
    );
    expect(plan.action).toBe('load');
    // Expect no forced service propagated in plan when unsupported
    expect(plan.forcedService).toBeNull();
  });

  it('forced service fails case will stop with message (to be honored later)', () => {
    // This test only asserts the plan level intent; enforcement happens in provider orchestrator
    const plan = resolveDeepLinkPlan(
      { networkId: 'evm:1', identifier: '0xabc', service: 'etherscan' },
      ctx
    );
    expect(plan.action).toBe('load');
  });
});
