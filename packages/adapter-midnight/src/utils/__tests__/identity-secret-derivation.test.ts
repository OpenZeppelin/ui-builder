import { describe, expect, it } from 'vitest';

import type { MidnightContractArtifacts } from '../../types';
import { deriveIdentitySecretPropertyName } from '../identity-secret-derivation';

function makeArtifacts(partial: Partial<MidnightContractArtifacts>): MidnightContractArtifacts {
  return {
    contractAddress:
      partial.contractAddress ??
      '0200326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6',
    privateStateId: partial.privateStateId ?? 'test-state',
    contractDefinition: partial.contractDefinition ?? '',
    contractModule: partial.contractModule ?? '',
    witnessCode: partial.witnessCode,
    verifierKeys: partial.verifierKeys,
    originalZipData: partial.originalZipData,
    trimmedZipBase64: partial.trimmedZipBase64,
  };
}

describe('deriveIdentitySecretPropertyName', () => {
  it('derives from .d.ts when there is a single Uint8Array field (non-nullable)', () => {
    const dts = `
      export type BBoardPrivateState = {
        readonly secretKey: Uint8Array;
      };
    `;
    const artifacts = makeArtifacts({ contractDefinition: dts });
    const result = deriveIdentitySecretPropertyName(artifacts);
    expect(result).toBe('secretKey');
  });

  it('derives from .d.ts when there is a single Uint8Array | null field', () => {
    const dts = `
      export type SimpleVotePrivateState = {
        readonly organizerSecretKey: Uint8Array | null;
        readonly hasVoted: boolean;
      };
    `;
    const artifacts = makeArtifacts({ contractDefinition: dts });
    const result = deriveIdentitySecretPropertyName(artifacts);
    expect(result).toBe('organizerSecretKey');
  });

  it('falls back to witnesses usage when multiple candidates exist in .d.ts', () => {
    const dts = `
      export type AdminState = {
        readonly ownerKey: Uint8Array | null;
        readonly adminKey: Uint8Array | null;
      };
    `;
    const witnesses = `
      export const witnesses = {
        local_sk: ({ privateState }) => [privateState, privateState.ownerKey],
      };
    `;
    const artifacts = makeArtifacts({ contractDefinition: dts, witnessCode: witnesses });
    const result = deriveIdentitySecretPropertyName(artifacts);
    expect(result).toBe('ownerKey');
  });

  it('derives from witnesses when no .d.ts private state is available', () => {
    const witnesses = `
      export const witnesses = {
        local_secret_key: ({ privateState }) => [privateState, privateState.secretKey],
      };
    `;
    const artifacts = makeArtifacts({ contractDefinition: '', witnessCode: witnesses });
    const result = deriveIdentitySecretPropertyName(artifacts);
    expect(result).toBe('secretKey');
  });

  it('returns undefined when nothing can be derived', () => {
    const dts = `
      export type Foo = { readonly x: number }
    `;
    const witnesses = `
      export const witnesses = {};
    `;
    const artifacts = makeArtifacts({ contractDefinition: dts, witnessCode: witnesses });
    const result = deriveIdentitySecretPropertyName(artifacts);
    expect(result).toBeUndefined();
  });
});
