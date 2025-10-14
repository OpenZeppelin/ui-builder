/**
 * Unit tests for Midnight contract artifacts utility functions
 */
import { describe, expect, it } from 'vitest';

import { validateAndConvertMidnightArtifacts } from '../artifacts';

describe('validateAndConvertMidnightArtifacts', () => {
  const validArtifacts = {
    contractAddress: 'ct1q8ej4px2k3z9x5y6w7v8u9t0r1s2q3p4o5n6m7l8k9j0h1g2f3e4d5c6b7a8z9x0',
    privateStateId: 'my-unique-state-id',
    contractDefinition: 'export interface MyContract { test(): Promise<void>; }',
  };

  it('should return valid artifacts object as-is', () => {
    const result = validateAndConvertMidnightArtifacts(validArtifacts);

    expect(result).toBe(validArtifacts);
  });

  it('should return artifacts with all properties', () => {
    const artifacts = {
      ...validArtifacts,
      contractModule: 'module.exports = {};',
      witnessCode: 'export const witnesses = {};',
    };

    const result = validateAndConvertMidnightArtifacts(artifacts);

    expect(result).toBe(artifacts);
  });

  it('should throw error for string input', () => {
    const address = 'ct1q8ej4px2k3z9x5y6w7v8u9t0r1s2q3p4o5n6m7l8k9j0h1g2f3e4d5c6b7a8z9x0';

    expect(() => validateAndConvertMidnightArtifacts(address)).toThrow(
      'Midnight adapter requires contract artifacts object, not just an address string.'
    );
  });

  it('should throw error for artifacts missing contractAddress', () => {
    const invalidArtifacts = {
      privateStateId: 'my-unique-state-id',
      contractDefinition: 'export interface MyContract { test(): Promise<void>; }',
    };

    expect(() => validateAndConvertMidnightArtifacts(invalidArtifacts)).toThrow(
      'Invalid contract artifacts provided. Expected an object with contractAddress, privateStateId, and contractDefinition properties.'
    );
  });

  it('should throw error for artifacts missing privateStateId', () => {
    const invalidArtifacts = {
      contractAddress: 'ct1q8ej4px2k3z9x5y6w7v8u9t0r1s2q3p4o5n6m7l8k9j0h1g2f3e4d5c6b7a8z9x0',
      contractDefinition: 'export interface MyContract { test(): Promise<void>; }',
    };

    expect(() => validateAndConvertMidnightArtifacts(invalidArtifacts)).toThrow(
      'Invalid contract artifacts provided. Expected an object with contractAddress, privateStateId, and contractDefinition properties.'
    );
  });

  it('should throw error for artifacts missing contractDefinition', () => {
    const invalidArtifacts = {
      contractAddress: 'ct1q8ej4px2k3z9x5y6w7v8u9t0r1s2q3p4o5n6m7l8k9j0h1g2f3e4d5c6b7a8z9x0',
      privateStateId: 'my-unique-state-id',
    };

    expect(() => validateAndConvertMidnightArtifacts(invalidArtifacts)).toThrow(
      'Invalid contract artifacts provided. Expected an object with contractAddress, privateStateId, and contractDefinition properties.'
    );
  });

  it('should throw error for artifacts with non-string contractAddress', () => {
    const invalidArtifacts = {
      contractAddress: 123,
      privateStateId: 'my-unique-state-id',
      contractDefinition: 'export interface MyContract { test(): Promise<void>; }',
    };

    expect(() => validateAndConvertMidnightArtifacts(invalidArtifacts)).toThrow(
      'Invalid contract artifacts provided. Expected an object with contractAddress, privateStateId, and contractDefinition properties.'
    );
  });

  it('should throw error for artifacts with non-string privateStateId', () => {
    const invalidArtifacts = {
      contractAddress: 'ct1q8ej4px2k3z9x5y6w7v8u9t0r1s2q3p4o5n6m7l8k9j0h1g2f3e4d5c6b7a8z9x0',
      privateStateId: 123,
      contractDefinition: 'export interface MyContract { test(): Promise<void>; }',
    };

    expect(() => validateAndConvertMidnightArtifacts(invalidArtifacts)).toThrow(
      'Invalid contract artifacts provided. Expected an object with contractAddress, privateStateId, and contractDefinition properties.'
    );
  });

  it('should throw error for artifacts with non-string contractDefinition', () => {
    const invalidArtifacts = {
      contractAddress: 'ct1q8ej4px2k3z9x5y6w7v8u9t0r1s2q3p4o5n6m7l8k9j0h1g2f3e4d5c6b7a8z9x0',
      privateStateId: 'my-unique-state-id',
      contractDefinition: 123,
    };

    expect(() => validateAndConvertMidnightArtifacts(invalidArtifacts)).toThrow(
      'Invalid contract artifacts provided. Expected an object with contractAddress, privateStateId, and contractDefinition properties.'
    );
  });

  it('should accept artifacts with extra properties', () => {
    const artifacts = {
      ...validArtifacts,
      extraProperty: 'should be ignored',
    };

    const result = validateAndConvertMidnightArtifacts(artifacts);

    expect(result).toEqual(artifacts);
  });
});
