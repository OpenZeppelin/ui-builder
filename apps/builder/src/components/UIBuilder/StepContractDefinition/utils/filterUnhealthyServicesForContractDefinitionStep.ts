import type { ContractDefinitionMetadata, ContractSchema } from '@openzeppelin/ui-types';

import type { ServiceHealthStatus } from '../hooks/useNetworkServiceHealthCheck';

/**
 * True when contract metadata indicates the ABI was satisfied via Sourcify
 * (used to suppress explorer probe errors after a successful fallback).
 */
export function isSourcifyFetchedMetadata(
  metadata: ContractDefinitionMetadata | null | undefined
): boolean {
  const from = metadata?.fetchedFrom?.toLowerCase() ?? '';
  return from.includes('sourcify');
}

export interface ContractDefinitionBannerContext {
  contractSource: 'fetched' | 'manual' | null;
  contractSchema: ContractSchema | null;
  contractMetadata: ContractDefinitionMetadata | null;
  contractDefinitionError: string | null;
  isContractLoading: boolean;
}

/**
 * Filters proactive {@link ServiceHealthStatus} rows before showing {@link NetworkServiceErrorBanner}.
 *
 * For the block explorer service, hides the banner while a contract load is in flight (avoids
 * flashing "explorer unavailable" before Sourcify is tried), when the user supplied a manual ABI,
 * or when an automatic fetch succeeded via Sourcify after the explorer probe failed.
 *
 * Other unhealthy services (e.g. RPC) are always kept.
 */
export function filterUnhealthyServicesForContractDefinitionStep(
  unhealthyServices: ServiceHealthStatus[],
  ctx: ContractDefinitionBannerContext
): ServiceHealthStatus[] {
  return unhealthyServices.filter((service) => {
    if (service.serviceId !== 'explorer') {
      return true;
    }

    if (ctx.isContractLoading) {
      return false;
    }

    if (ctx.contractDefinitionError) {
      return true;
    }

    if (!ctx.contractSchema) {
      return true;
    }

    if (ctx.contractSource === 'manual') {
      return false;
    }

    if (ctx.contractSource === 'fetched' && isSourcifyFetchedMetadata(ctx.contractMetadata)) {
      return false;
    }

    return true;
  });
}
