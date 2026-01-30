import type {
  NetworkServiceForm,
  StellarNetworkConfig,
  UserRpcProviderConfig,
} from '@openzeppelin/ui-types';
import { isValidUrl } from '@openzeppelin/ui-utils';

import { testStellarRpcConnection, validateStellarRpcEndpoint } from './rpc';

/**
 * Returns the default service configuration values for a given service ID.
 * Used for proactive health checks when no user overrides are configured.
 *
 * @param networkConfig The network configuration
 * @param serviceId The service identifier (e.g., 'rpc', 'indexer')
 * @returns The default configuration values, or null if not available
 */
export function getStellarDefaultServiceConfig(
  networkConfig: StellarNetworkConfig,
  serviceId: string
): Record<string, unknown> | null {
  switch (serviceId) {
    case 'rpc':
      if (networkConfig.sorobanRpcUrl) {
        return { sorobanRpcUrl: networkConfig.sorobanRpcUrl };
      }
      break;
    case 'indexer':
      // Indexer is optional for Stellar - only return if both URLs are configured
      if (networkConfig.indexerUri && networkConfig.indexerWsUri) {
        return {
          indexerUri: networkConfig.indexerUri,
          indexerWsUri: networkConfig.indexerWsUri,
        };
      }
      break;
  }
  return null;
}

/**
 * Returns the network service forms for Stellar networks.
 * Defines the UI configuration for the RPC and Indexer services.
 *
 * @param exclude Optional array of service IDs to exclude from the returned forms
 * @returns Array of network service forms
 */
export function getStellarNetworkServiceForms(exclude: string[] = []): NetworkServiceForm[] {
  const forms: NetworkServiceForm[] = [
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
    {
      id: 'indexer',
      label: 'Indexer',
      description: 'Optional GraphQL indexer endpoint for historical access control data',
      supportsConnectionTest: true,
      fields: [
        {
          id: 'stellar-indexer-uri',
          name: 'indexerUri',
          type: 'text',
          label: 'Indexer GraphQL HTTP Endpoint',
          placeholder: 'https://indexer.example.com/graphql',
          validation: { required: false, pattern: '^https?://.+' },
          width: 'full',
          helperText: 'Optional. Used for querying historical access control events.',
        },
        {
          id: 'stellar-indexer-ws-uri',
          name: 'indexerWsUri',
          type: 'text',
          label: 'Indexer GraphQL WebSocket Endpoint',
          placeholder: 'wss://indexer.example.com/graphql',
          validation: { required: false, pattern: '^wss?://.+' },
          width: 'full',
          helperText: 'Optional. Used for real-time subscriptions.',
        },
      ],
    },
  ];

  return forms.filter((form) => !exclude.includes(form.id));
}

/**
 * Validates a network service configuration for Stellar networks.
 */
export async function validateStellarNetworkServiceConfig(
  serviceId: string,
  values: Record<string, unknown>
): Promise<boolean> {
  if (serviceId === 'rpc') {
    const cfg = {
      url: String(values.sorobanRpcUrl || ''),
      isCustom: true,
    } as UserRpcProviderConfig;
    return validateStellarRpcEndpoint(cfg);
  }

  if (serviceId === 'indexer') {
    // Validate indexerUri if provided
    if (values.indexerUri !== undefined && values.indexerUri !== null && values.indexerUri !== '') {
      if (!isValidUrl(String(values.indexerUri))) {
        return false;
      }
    }

    // Validate indexerWsUri if provided
    if (
      values.indexerWsUri !== undefined &&
      values.indexerWsUri !== null &&
      values.indexerWsUri !== ''
    ) {
      if (!isValidUrl(String(values.indexerWsUri))) {
        return false;
      }
    }

    return true;
  }

  return true;
}

/**
 * Tests a network service connection for Stellar networks.
 */
export async function testStellarNetworkServiceConnection(
  serviceId: string,
  values: Record<string, unknown>
): Promise<{ success: boolean; latency?: number; error?: string }> {
  if (serviceId === 'rpc') {
    const cfg = {
      url: String(values.sorobanRpcUrl || ''),
      isCustom: true,
    } as UserRpcProviderConfig;
    return testStellarRpcConnection(cfg);
  }

  if (serviceId === 'indexer') {
    const indexerUri = values.indexerUri;

    // If no indexer URI is provided, indexer is optional - return success (nothing to test)
    if (!indexerUri || typeof indexerUri !== 'string' || indexerUri.trim() === '') {
      return { success: true };
    }

    if (!isValidUrl(indexerUri)) {
      return { success: false, error: 'Invalid indexer URI format' };
    }

    try {
      const startTime = Date.now();
      // Perform a simple GraphQL introspection query to test connectivity
      const response = await fetch(indexerUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '{ __typename }',
        }),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: false,
          latency,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      if (data.errors) {
        return {
          success: false,
          latency,
          error: `GraphQL errors: ${JSON.stringify(data.errors)}`,
        };
      }

      return { success: true, latency };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return { success: true };
}
