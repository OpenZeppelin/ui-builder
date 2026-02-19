/**
 * @vitest-environment jsdom
 *
 * Tests for useNetworkServiceHealthCheck hook.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ContractAdapter, NetworkConfig, NetworkServiceForm } from '@openzeppelin/ui-types';

import { useNetworkServiceHealthCheck } from '../hooks/useNetworkServiceHealthCheck';

// Mock @openzeppelin/ui-utils to avoid heavy dependency loading during tests.
// Vitest hoists vi.mock calls to the top of the file automatically.
vi.mock('@openzeppelin/ui-utils', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    configure: vi.fn(),
  },
  userNetworkServiceConfigService: {
    get: vi.fn().mockReturnValue(null),
  },
  filterEnabledServiceForms: (forms: NetworkServiceForm[]) => forms,
}));

// Helper to create mock network config
function createMockNetworkConfig(): NetworkConfig {
  return {
    id: 'ethereum',
    exportConstName: 'ethereum',
    name: 'Ethereum',
    ecosystem: 'evm',
    network: 'mainnet',
    type: 'mainnet',
    isTestnet: false,
  } as NetworkConfig;
}

// Helper to create mock service forms
function createMockServiceForms(): NetworkServiceForm[] {
  return [
    {
      id: 'rpc',
      label: 'RPC Provider',
      supportsConnectionTest: true,
      fields: [
        {
          id: 'rpcUrl',
          name: 'rpcUrl',
          type: 'text',
          label: 'RPC URL',
          validation: { required: false },
        },
      ],
    },
  ];
}

// Helper to create mock adapter
function createMockAdapter(): Partial<ContractAdapter> {
  return {
    networkConfig: createMockNetworkConfig(),
    getNetworkServiceForms: vi.fn().mockReturnValue(createMockServiceForms()),
    getDefaultServiceConfig: vi.fn().mockImplementation((serviceId: string) => {
      if (serviceId === 'rpc') return { rpcUrl: 'https://eth.llamarpc.com' };
      return null;
    }),
    testNetworkServiceConnection: vi.fn().mockResolvedValue({
      success: true,
      latency: 150,
    }),
  };
}

describe('useNetworkServiceHealthCheck', () => {
  it('should return empty state when adapter is null', () => {
    const { result } = renderHook(() => useNetworkServiceHealthCheck(null, null));

    expect(result.current.isChecking).toBe(false);
    expect(result.current.hasUnhealthyServices).toBe(false);
    expect(result.current.unhealthyServices).toEqual([]);
    expect(result.current.allStatuses).toEqual([]);
  });

  it('should report healthy services correctly', async () => {
    const mockAdapter = createMockAdapter();

    const { result } = renderHook(() =>
      useNetworkServiceHealthCheck(mockAdapter as ContractAdapter, createMockNetworkConfig())
    );

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
      expect(result.current.allStatuses.length).toBeGreaterThan(0);
    });

    expect(result.current.hasUnhealthyServices).toBe(false);
    expect(result.current.unhealthyServices).toEqual([]);
  });

  it('should report unhealthy services correctly', async () => {
    const mockAdapter = createMockAdapter();
    mockAdapter.testNetworkServiceConnection = vi.fn().mockResolvedValue({
      success: false,
      error: 'Connection timeout',
    });

    const { result } = renderHook(() =>
      useNetworkServiceHealthCheck(mockAdapter as ContractAdapter, createMockNetworkConfig())
    );

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
      expect(result.current.allStatuses.length).toBeGreaterThan(0);
    });

    expect(result.current.hasUnhealthyServices).toBe(true);
    expect(result.current.unhealthyServices.length).toBeGreaterThan(0);
  });

  it('should handle exceptions during health check gracefully', async () => {
    const mockAdapter = createMockAdapter();
    mockAdapter.testNetworkServiceConnection = vi
      .fn()
      .mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() =>
      useNetworkServiceHealthCheck(mockAdapter as ContractAdapter, createMockNetworkConfig())
    );

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
      expect(result.current.allStatuses.length).toBeGreaterThan(0);
    });

    expect(result.current.hasUnhealthyServices).toBe(true);
    const rpcStatus = result.current.allStatuses.find((s) => s.serviceId === 'rpc');
    expect(rpcStatus?.isHealthy).toBe(false);
    expect(rpcStatus?.error).toBe('Network failure');
  });
});
