import type { NetworkServiceForm, UserRpcProviderConfig } from '@openzeppelin/ui-builder-types';

import { testStellarRpcConnection, validateStellarRpcEndpoint } from './rpc';

/**
 * Returns the network service forms for Stellar networks.
 * Defines the UI configuration for the RPC service.
 */
export function getStellarNetworkServiceForms(): NetworkServiceForm[] {
  return [
    {
      id: 'rpc',
      label: 'RPC Provider',
      fields: [
        {
          id: 'stellar-rpc-url',
          name: 'sorobanRpcUrl',
          type: 'text',
          label: 'Soroban RPC URL',
          placeholder: 'https://soroban.stellar.org',
          validation: { required: true, pattern: '^https?://.+' },
          width: 'full',
        },
      ],
    },
  ];
}

/**
 * Validates a network service configuration for Stellar networks.
 */
export async function validateStellarNetworkServiceConfig(
  serviceId: string,
  values: Record<string, unknown>
): Promise<boolean> {
  if (serviceId !== 'rpc') return true;
  const cfg = { url: String(values.sorobanRpcUrl || ''), isCustom: true } as UserRpcProviderConfig;
  return validateStellarRpcEndpoint(cfg);
}

/**
 * Tests a network service connection for Stellar networks.
 */
export async function testStellarNetworkServiceConnection(
  serviceId: string,
  values: Record<string, unknown>
): Promise<{ success: boolean; latency?: number; error?: string }> {
  if (serviceId !== 'rpc') return { success: true };
  const cfg = { url: String(values.sorobanRpcUrl || ''), isCustom: true } as UserRpcProviderConfig;
  return testStellarRpcConnection(cfg);
}
