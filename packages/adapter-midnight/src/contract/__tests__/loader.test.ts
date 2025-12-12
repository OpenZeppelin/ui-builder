import { describe, expect, it } from 'vitest';

import type { MidnightContractArtifacts } from '../../types/artifacts';
import { loadMidnightContract, loadMidnightContractWithMetadata } from '../loader';

const mockInterface = `
export type Circuits<T> = {
  post(context: any, new_message: string): any;
};
export declare class Contract<T> {
  readonly circuits: Circuits<T>;
}`;

describe('Midnight contract loader', () => {
  it('loadMidnightContract returns schema and metadata with definitionHash', async () => {
    const artifacts: MidnightContractArtifacts = {
      contractAddress: 'ct1qexampleaddress',
      contractDefinition: mockInterface,
      contractModule: 'module.exports = {}',
      witnessCode: 'export const witnesses = {}',
    };

    const result = await loadMidnightContract(artifacts);
    expect(result.schema).toBeDefined();
    expect(result.schema.ecosystem).toBe('midnight');
    expect(result.schema.address).toBe(artifacts.contractAddress);
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.definitionHash).toBeDefined();
    expect(result.contractDefinitionOriginal).toBe(artifacts.contractDefinition);
  });

  it('loadMidnightContractWithMetadata includes artifacts when provided', async () => {
    const artifacts: MidnightContractArtifacts = {
      contractAddress: 'ct1qexampleaddress2',
      privateStateId: 'state-2',
      contractDefinition: mockInterface,
      contractModule: 'module.exports = {}',
      witnessCode: 'export const witnesses = {}',
    };

    const result = await loadMidnightContractWithMetadata(artifacts);
    expect(result.contractDefinitionArtifacts).toBeDefined();
    expect(result.contractDefinitionArtifacts).toMatchObject({
      privateStateId: 'state-2',
      contractModule: 'module.exports = {}',
      witnessCode: 'export const witnesses = {}',
    });
  });

  it('loadMidnightContractWithMetadata omits artifacts when none provided', async () => {
    const artifacts: MidnightContractArtifacts = {
      contractAddress: 'ct1qexampleaddress3',
      contractDefinition: mockInterface,
      contractModule: '',
      witnessCode: '',
    };

    const result = await loadMidnightContractWithMetadata(artifacts);
    expect(result.contractDefinitionArtifacts).toBeUndefined();
  });
});
