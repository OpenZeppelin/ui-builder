/**
 * Deep-link utilities (chain-agnostic)
 *
 * NOTE: Stub implementation for TDD. Tests will drive full behavior in Phase 3.3.
 */
export type DeepLinkParams = Record<string, string>;

export function parseDeepLink(): DeepLinkParams {
  const params = new URLSearchParams(window.location.search);
  const result: DeepLinkParams = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function getForcedService(params: DeepLinkParams): string | null {
  return params.service ?? null;
}

export function computeEffectiveProviderPreference(input: {
  forcedService?: string | null;
  uiSelection?: string | null;
  appDefault?: string | null;
  adapterDefaultOrder: readonly string[];
}): { effectiveProvider: string; source: 'urlForced' | 'ui' | 'appConfig' | 'adapterDefault' } {
  if (input.forcedService && input.forcedService.length > 0) {
    return { effectiveProvider: input.forcedService, source: 'urlForced' };
  }

  if (input.uiSelection && input.uiSelection.length > 0) {
    return { effectiveProvider: input.uiSelection, source: 'ui' };
  }

  if (input.appDefault && input.appDefault.length > 0) {
    return { effectiveProvider: input.appDefault, source: 'appConfig' };
  }

  const fallback = input.adapterDefaultOrder[0];
  return { effectiveProvider: fallback, source: 'adapterDefault' };
}
