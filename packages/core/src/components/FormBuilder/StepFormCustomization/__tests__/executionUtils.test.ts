import { describe, expect, it } from 'vitest';

import { ExecutionMethodType } from '@openzeppelin/transaction-form-types';

import { ensureCompleteConfig } from '../utils/executionUtils';

describe('ensureCompleteConfig', () => {
  it('should return undefined for null or undefined input', () => {
    expect(ensureCompleteConfig(null)).toBeUndefined();
    expect(ensureCompleteConfig(undefined)).toBeUndefined();
  });

  it('should return undefined if method is missing', () => {
    expect(ensureCompleteConfig({})).toBeUndefined();
  });

  it('should return undefined for unknown method types', () => {
    expect(ensureCompleteConfig({ method: 'unknown' as ExecutionMethodType })).toBeUndefined();
  });

  it('should create default EOA config (allowAny: true)', () => {
    const result = ensureCompleteConfig({ method: 'eoa' });
    expect(result).toEqual({
      method: 'eoa',
      allowAny: true,
      specificAddress: undefined,
    });
  });

  it('should respect allowAny: false for EOA config', () => {
    const result = ensureCompleteConfig({ method: 'eoa', allowAny: false });
    expect(result).toEqual({
      method: 'eoa',
      allowAny: false,
      specificAddress: undefined,
    });
  });

  it('should include specificAddress for EOA config', () => {
    const address = '0x123';
    const result = ensureCompleteConfig({
      method: 'eoa',
      allowAny: false,
      specificAddress: address,
    });
    expect(result).toEqual({
      method: 'eoa',
      allowAny: false,
      specificAddress: address,
    });
  });

  it('should return basic relayer config', () => {
    const result = ensureCompleteConfig({ method: 'relayer' });
    expect(result).toEqual({
      method: 'relayer',
      serviceUrl: '',
      relayer: {},
      transactionOptions: { speed: 'fast' },
    });
  });

  it('should return basic multisig config', () => {
    const result = ensureCompleteConfig({ method: 'multisig' });
    expect(result).toEqual({ method: 'multisig' });
  });
});
