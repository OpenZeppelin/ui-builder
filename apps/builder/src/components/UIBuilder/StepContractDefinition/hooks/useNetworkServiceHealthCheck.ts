import { useCallback, useEffect, useState } from 'react';

import type { ContractAdapter, NetworkConfig } from '@openzeppelin/ui-types';
import { logger, userNetworkServiceConfigService } from '@openzeppelin/ui-utils';

export interface ServiceHealthStatus {
  serviceId: string;
  serviceLabel: string;
  isHealthy: boolean;
  error?: string;
  latency?: number;
}

export interface NetworkHealthCheckResult {
  isChecking: boolean;
  hasUnhealthyServices: boolean;
  unhealthyServices: ServiceHealthStatus[];
  allStatuses: ServiceHealthStatus[];
  recheck: () => Promise<void>;
}

/**
 * Hook that proactively tests network services when a network is selected.
 * This helps users identify service outages before they try to interact with the network.
 *
 * The hook uses the adapter's getDefaultServiceConfig() method to get default endpoint
 * values for testing. User overrides from the settings dialog take precedence.
 *
 * @param adapter The contract adapter for the selected network
 * @param networkConfig The network configuration
 * @returns Health check results including any unhealthy services
 */
export function useNetworkServiceHealthCheck(
  adapter: ContractAdapter | null,
  networkConfig: NetworkConfig | null
): NetworkHealthCheckResult {
  const [isChecking, setIsChecking] = useState(false);
  const [serviceStatuses, setServiceStatuses] = useState<ServiceHealthStatus[]>([]);

  const checkServices = useCallback(async () => {
    if (!adapter || !networkConfig) {
      setServiceStatuses([]);
      return;
    }

    // Get the network service forms to know which services exist
    const serviceForms = adapter.getNetworkServiceForms();
    if (!serviceForms || serviceForms.length === 0) {
      // No services to check (e.g., some ecosystems might not have configurable services)
      setServiceStatuses([]);
      return;
    }

    setIsChecking(true);
    const statuses: ServiceHealthStatus[] = [];

    for (const serviceForm of serviceForms) {
      try {
        // Get the current service configuration values
        // Priority: 1. User overrides, 2. Adapter defaults
        let serviceValues = getUserServiceConfigOverride(networkConfig.id, serviceForm.id);

        if (!serviceValues) {
          // Get defaults from the adapter
          serviceValues = adapter.getDefaultServiceConfig(serviceForm.id);
        }

        if (!serviceValues || Object.keys(serviceValues).length === 0) {
          // No configuration available for this service, skip
          logger.debug(
            'useNetworkServiceHealthCheck',
            `No configuration for service ${serviceForm.id}, skipping`
          );
          continue;
        }

        // Test the service connection
        const result = await adapter.testNetworkServiceConnection?.(serviceForm.id, serviceValues);

        statuses.push({
          serviceId: serviceForm.id,
          serviceLabel: serviceForm.label,
          isHealthy: result?.success ?? true,
          error: result?.error,
          latency: result?.latency,
        });
      } catch (error) {
        logger.error(
          'useNetworkServiceHealthCheck',
          `Failed to test service ${serviceForm.id}:`,
          error
        );
        statuses.push({
          serviceId: serviceForm.id,
          serviceLabel: serviceForm.label,
          isHealthy: false,
          error: error instanceof Error ? error.message : 'Health check failed',
        });
      }
    }

    setServiceStatuses(statuses);
    setIsChecking(false);
  }, [adapter, networkConfig]);

  // Run health check when adapter or network changes
  useEffect(() => {
    void checkServices();
  }, [checkServices]);

  const unhealthyServices = serviceStatuses.filter((s) => !s.isHealthy);

  return {
    isChecking,
    hasUnhealthyServices: unhealthyServices.length > 0,
    unhealthyServices,
    allStatuses: serviceStatuses,
    recheck: checkServices,
  };
}

/**
 * Gets user-configured overrides for a network service.
 *
 * @param networkId The network ID
 * @param serviceId The service identifier (e.g., 'rpc', 'indexer', 'explorer')
 * @returns User-configured values, or null if no overrides exist
 */
function getUserServiceConfigOverride(
  networkId: string,
  serviceId: string
): Record<string, unknown> | null {
  const userConfig = userNetworkServiceConfigService.get(networkId, serviceId);
  if (userConfig && typeof userConfig === 'object' && Object.keys(userConfig).length > 0) {
    return userConfig as Record<string, unknown>;
  }
  return null;
}
