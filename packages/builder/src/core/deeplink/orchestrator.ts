/**
 * Deep link orchestration (chain-agnostic, non-UI)
 *
 * NOTE: TDD stub for Phase 3.2. Tests define precedence behavior; implementation follows in 3.3.
 */

export interface DeepLinkContext {
  hasSavedSession: boolean;
  adapterSupportedServices: readonly string[];
  adapterDefaultOrder: readonly string[];
}

export interface DeepLinkParamsInput {
  networkId?: string | null;
  identifier?: string | null; // e.g., address or contract id
  service?: string | null; // forced provider
}

export type PlanAction = 'load' | 'stop' | 'noop';

export interface DeepLinkPlan {
  action: PlanAction;
  networkId?: string | null;
  identifier?: string | null;
  forcedService?: string | null;
  message?: string;
}

export function resolveDeepLinkPlan(
  params: DeepLinkParamsInput,
  ctx: DeepLinkContext
): DeepLinkPlan {
  // Validate minimal requirements
  const hasBasics = Boolean(params.networkId) && Boolean(params.identifier);
  if (!hasBasics) return { action: 'noop' };

  // Unsupported forced service → auto-fallback (strip forced)
  const forced = params.service ?? null;
  const isSupported = forced ? ctx.adapterSupportedServices.includes(forced) : true;

  return {
    action: 'load',
    networkId: params.networkId ?? null,
    identifier: params.identifier ?? null,
    forcedService: isSupported ? forced : null,
  };
}
