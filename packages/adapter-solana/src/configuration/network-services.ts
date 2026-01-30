import type {
  NetworkServiceForm,
  SolanaNetworkConfig,
  UserRpcProviderConfig,
} from '@openzeppelin/ui-types';

import { testSolanaRpcConnection, validateSolanaRpcEndpoint } from './rpc';

/**
 * Returns the default service configuration values for a given service ID.
 * Used for proactive health checks when no user overrides are configured.
 *
 * @param networkConfig The network configuration
 * @param serviceId The service identifier (e.g., 'rpc')
 * @returns The default configuration values, or null if not available
 */
export function getSolanaDefaultServiceConfig(
  networkConfig: SolanaNetworkConfig,
  serviceId: string
): Record<string, unknown> | null {
  if (serviceId === 'rpc' && networkConfig.rpcEndpoint) {
    return { rpcEndpoint: networkConfig.rpcEndpoint };
  }
  return null;
}

/**
 * Returns the network service forms for Solana networks.
 * Defines the UI configuration for the RPC service.
 */
export function getSolanaNetworkServiceForms(): NetworkServiceForm[] {
  return [
    {
      id: 'rpc',
      label: 'RPC Provider',
      fields: [
        {
          id: 'solana-rpc-endpoint',
          name: 'rpcEndpoint',
          type: 'text',
          label: 'RPC Endpoint',
          placeholder: 'https://api.mainnet-beta.solana.com',
          validation: { required: true, pattern: '^https?://.+' },
          width: 'full',
        },
      ],
    },
  ];
}

/**
 * Validates a network service configuration for Solana networks.
 */
export async function validateSolanaNetworkServiceConfig(
  serviceId: string,
  values: Record<string, unknown>
): Promise<boolean> {
  if (serviceId !== 'rpc') return true;
  const cfg = { url: String(values.rpcEndpoint || ''), isCustom: true } as UserRpcProviderConfig;
  return validateSolanaRpcEndpoint(cfg);
}

/**
 * Tests a network service connection for Solana networks.
 */
export async function testSolanaNetworkServiceConnection(
  serviceId: string,
  values: Record<string, unknown>
): Promise<{ success: boolean; latency?: number; error?: string }> {
  if (serviceId !== 'rpc') return { success: true };
  const cfg = { url: String(values.rpcEndpoint || ''), isCustom: true } as UserRpcProviderConfig;
  return testSolanaRpcConnection(cfg);
}
