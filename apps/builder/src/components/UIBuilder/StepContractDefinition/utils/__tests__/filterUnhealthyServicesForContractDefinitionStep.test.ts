import { describe, expect, it } from 'vitest';

import type { ContractSchema } from '@openzeppelin/ui-types';

import type { ServiceHealthStatus } from '../../hooks/useNetworkServiceHealthCheck';
import {
  filterUnhealthyServicesForContractDefinitionStep,
  isSourcifyFetchedMetadata,
} from '../filterUnhealthyServicesForContractDefinitionStep';

const explorerUnhealthy: ServiceHealthStatus = {
  serviceId: 'explorer',
  serviceLabel: 'Block Explorer',
  isHealthy: false,
  error: 'API key is required',
};

const rpcUnhealthy: ServiceHealthStatus = {
  serviceId: 'rpc',
  serviceLabel: 'RPC',
  isHealthy: false,
  error: 'Connection refused',
};

const minimalSchema = { address: '0xabc' } as ContractSchema;

describe('isSourcifyFetchedMetadata', () => {
  it('returns true for sourcify URLs', () => {
    expect(isSourcifyFetchedMetadata({ fetchedFrom: 'https://repo.sourcify.dev/...' })).toBe(true);
    expect(isSourcifyFetchedMetadata({ fetchedFrom: 'Sourcify' })).toBe(true);
  });

  it('returns false for explorer or missing', () => {
    expect(isSourcifyFetchedMetadata({ fetchedFrom: 'https://etherscan.io/address/0x' })).toBe(
      false
    );
    expect(isSourcifyFetchedMetadata(null)).toBe(false);
    expect(isSourcifyFetchedMetadata({})).toBe(false);
  });
});

describe('filterUnhealthyServicesForContractDefinitionStep', () => {
  it('keeps non-explorer unhealthy services', () => {
    const out = filterUnhealthyServicesForContractDefinitionStep(
      [rpcUnhealthy, explorerUnhealthy],
      {
        contractSource: null,
        contractSchema: null,
        contractMetadata: null,
        contractDefinitionError: null,
        isContractLoading: false,
      }
    );
    expect(out).toEqual([rpcUnhealthy, explorerUnhealthy]);
  });

  it('hides explorer while contract is loading', () => {
    const out = filterUnhealthyServicesForContractDefinitionStep([explorerUnhealthy], {
      contractSource: null,
      contractSchema: null,
      contractMetadata: null,
      contractDefinitionError: null,
      isContractLoading: true,
    });
    expect(out).toEqual([]);
  });

  it('shows explorer when load failed', () => {
    const out = filterUnhealthyServicesForContractDefinitionStep([explorerUnhealthy], {
      contractSource: null,
      contractSchema: null,
      contractMetadata: null,
      contractDefinitionError: 'Contract not verified',
      isContractLoading: false,
    });
    expect(out).toEqual([explorerUnhealthy]);
  });

  it('hides explorer when manual ABI loaded successfully', () => {
    const out = filterUnhealthyServicesForContractDefinitionStep([explorerUnhealthy], {
      contractSource: 'manual',
      contractSchema: minimalSchema,
      contractMetadata: { verificationStatus: 'unknown' },
      contractDefinitionError: null,
      isContractLoading: false,
    });
    expect(out).toEqual([]);
  });

  it('hides explorer when fetch succeeded via Sourcify metadata', () => {
    const out = filterUnhealthyServicesForContractDefinitionStep([explorerUnhealthy], {
      contractSource: 'fetched',
      contractSchema: minimalSchema,
      contractMetadata: { fetchedFrom: 'https://repo.sourcify.dev/foo' },
      contractDefinitionError: null,
      isContractLoading: false,
    });
    expect(out).toEqual([]);
  });

  it('shows explorer when fetch succeeded from etherscan URL', () => {
    const out = filterUnhealthyServicesForContractDefinitionStep([explorerUnhealthy], {
      contractSource: 'fetched',
      contractSchema: minimalSchema,
      contractMetadata: { fetchedFrom: 'https://etherscan.io/address/0x' },
      contractDefinitionError: null,
      isContractLoading: false,
    });
    expect(out).toEqual([explorerUnhealthy]);
  });
});
