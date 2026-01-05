import type { NetworkServiceForm } from '@openzeppelin/ui-types';

/**
 * Returns the network service forms for Midnight networks.
 * Defines the UI configuration for the Indexer service.
 */
export function getMidnightNetworkServiceForms(): NetworkServiceForm[] {
  return [
    {
      id: 'indexer',
      label: 'Indexer',
      description:
        'Configure Midnight Indexer GraphQL endpoints. Provide both HTTP and WebSocket URLs.',
      fields: [
        {
          id: 'indexer-http',
          name: 'httpUrl',
          type: 'text',
          label: 'HTTP URL',
          placeholder: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
          validation: { required: true, pattern: '^https?://.+' },
          width: 'full',
        },
        {
          id: 'indexer-ws',
          name: 'wsUrl',
          type: 'text',
          label: 'WebSocket URL',
          placeholder: 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws',
          validation: { required: true, pattern: '^wss?://.+' },
          width: 'full',
        },
      ],
    },
  ];
}

/**
 * Validates a network service configuration for Midnight networks.
 */
export async function validateMidnightNetworkServiceConfig(
  serviceId: string,
  values: Record<string, unknown>
): Promise<boolean> {
  if (serviceId !== 'indexer') return true;
  try {
    const http = new URL(String(values.httpUrl || ''));
    const ws = new URL(String(values.wsUrl || ''));
    const httpOk = http.protocol === 'http:' || http.protocol === 'https:';
    const wsOk = ws.protocol === 'ws:' || ws.protocol === 'wss:';
    return Boolean(httpOk && wsOk && http.host && ws.host && http.pathname && ws.pathname);
  } catch {
    return false;
  }
}

/**
 * Tests a network service connection for Midnight networks.
 * Note: We only test the HTTP endpoint here. The WebSocket endpoint is validated
 * via URL format but not tested because GraphQL WebSocket endpoints require
 * specific subprotocols (graphql-ws or graphql-transport-ws) and a proper
 * GraphQL handshake that's complex to test. The Midnight SDK's
 * indexerPublicDataProvider handles WebSocket connections correctly when
 * actually used. HTTP is sufficient for validating connectivity since it's
 * what's used for GraphQL queries (WebSocket is mainly for subscriptions).
 */
export async function testMidnightNetworkServiceConnection(
  serviceId: string,
  values: Record<string, unknown>
): Promise<{ success: boolean; latency?: number; error?: string }> {
  if (serviceId !== 'indexer') return { success: true };
  const httpUrl = String(values.httpUrl || '');
  const wsUrl = String(values.wsUrl || '');

  if (!httpUrl) return { success: false, error: 'HTTP URL is required' };
  if (!wsUrl) return { success: false, error: 'WebSocket URL is required' };

  const start = performance.now();
  try {
    const res = await fetch(httpUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'query Q{__typename}' }),
    });
    const latency = Math.round(performance.now() - start);
    if (!res.ok) return { success: false, latency, error: `HTTP ${res.status}` };
    return { success: true, latency };
  } catch (e) {
    const latency = Math.round(performance.now() - start);
    return { success: false, latency, error: e instanceof Error ? e.message : 'Network error' };
  }
}
