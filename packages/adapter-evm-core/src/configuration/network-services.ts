/**
 * Network Service Configuration for EVM-compatible networks.
 *
 * Provides validation and connection testing for network services (RPC, Explorer, Contract Definitions).
 * These are ecosystem-agnostic and can be used by any EVM-compatible adapter.
 *
 * @module configuration/network-services
 */

import type { UserExplorerConfig, UserRpcProviderConfig } from '@openzeppelin/ui-types';

import { isEvmProviderKey } from '../types';
import type { EvmCompatibleNetworkConfig } from '../types';
import { testEvmExplorerConnection, validateEvmExplorerConfig } from './explorer';
import { testEvmRpcConnection, validateEvmRpcEndpoint } from './rpc';

/**
 * Validates a network service configuration for EVM-compatible networks.
 *
 * @param serviceId - The service identifier ('rpc', 'explorer', or 'contract-definitions')
 * @param values - The form values to validate
 * @returns True if valid, false otherwise
 */
export async function validateEvmNetworkServiceConfig(
  serviceId: string,
  values: Record<string, unknown>
): Promise<boolean> {
  if (serviceId === 'rpc') {
    const cfg = { url: String(values.rpcUrl || ''), isCustom: true } as UserRpcProviderConfig;
    return validateEvmRpcEndpoint(cfg);
  }
  if (serviceId === 'explorer') {
    const cfg = {
      explorerUrl: values.explorerUrl ? String(values.explorerUrl) : undefined,
      apiUrl: values.apiUrl ? String(values.apiUrl) : undefined,
      apiKey: values.apiKey ? String(values.apiKey) : undefined,
      isCustom: true,
      applyToAllNetworks: Boolean(values.applyToAllNetworks),
    } as UserExplorerConfig;
    return validateEvmExplorerConfig(cfg);
  }
  if (serviceId === 'contract-definitions') {
    const raw = values.defaultProvider;
    if (raw === undefined || raw === null || raw === '') return true;
    return isEvmProviderKey(raw);
  }
  return true;
}

/**
 * Tests a network service connection for EVM-compatible networks.
 *
 * @param serviceId - The service identifier ('rpc', 'explorer', or 'contract-definitions')
 * @param values - The form values containing connection details
 * @param networkConfig - The network configuration (ecosystem-agnostic)
 * @returns Connection test result with success status, latency, and optional error
 */
export async function testEvmNetworkServiceConnection(
  serviceId: string,
  values: Record<string, unknown>,
  networkConfig: EvmCompatibleNetworkConfig
): Promise<{ success: boolean; latency?: number; error?: string }> {
  if (serviceId === 'rpc') {
    const cfg = { url: String(values.rpcUrl || ''), isCustom: true } as UserRpcProviderConfig;
    return testEvmRpcConnection(cfg);
  }
  if (serviceId === 'explorer') {
    const cfg = {
      explorerUrl: values.explorerUrl ? String(values.explorerUrl) : undefined,
      apiUrl: values.apiUrl ? String(values.apiUrl) : undefined,
      apiKey: values.apiKey ? String(values.apiKey) : undefined,
      isCustom: true,
      applyToAllNetworks: Boolean(values.applyToAllNetworks),
    } as UserExplorerConfig;
    return testEvmExplorerConnection(cfg, networkConfig);
  }
  return { success: true };
}
