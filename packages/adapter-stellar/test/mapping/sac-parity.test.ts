import { describe, expect, it, vi } from 'vitest';

import type { ContractSchema } from '@openzeppelin/ui-builder-types';

// T010: Parity UX test: enum/struct fields present via metadata.specEntries

vi.mock('@stellar/stellar-sdk', async () => {
  const actual =
    await vi.importActual<typeof import('@stellar/stellar-sdk')>('@stellar/stellar-sdk');
  return {
    ...actual,
    Address: {
      fromString: vi.fn(() => true),
    },
    nativeToScVal: actual.nativeToScVal,
    BASE_FEE: actual.BASE_FEE,
    TransactionBuilder: actual.TransactionBuilder,
    Account: actual.Account,
    Contract: actual.Contract,
    Keypair: actual.Keypair,
    rpc: actual.rpc,
  };
});

const structFieldsMock = [{ name: 'nested', type: 'U32' }];

const enumMetadataMock = {
  name: 'DemoEnum',
  variants: [{ name: 'One', type: 'void' }],
  isUnitOnly: true,
};

const extractStructFields = vi.fn(() => structFieldsMock);
const extractEnumVariants = vi.fn(() => enumMetadataMock);

vi.mock('../../src/mapping/enum-metadata', async () => {
  const actual = await vi.importActual<typeof import('../../src/mapping/enum-metadata')>(
    '../../src/mapping/enum-metadata'
  );
  return {
    ...actual,
    isEnumType: vi.fn(() => true),
    extractEnumVariants,
  };
});

vi.mock('../../src/mapping/struct-fields', async () => {
  const actual = await vi.importActual<typeof import('../../src/mapping/struct-fields')>(
    '../../src/mapping/struct-fields'
  );
  return {
    ...actual,
    isStructType: vi.fn(() => true),
    extractStructFields,
  };
});

describe('mapping/sac-parity', () => {
  it('provides enum/struct field mapping using metadata.specEntries', async () => {
    const { generateStellarDefaultField } = await import('../../src/mapping/field-generator');

    const contractSchema: ContractSchema = {
      ecosystem: 'stellar',
      address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG',
      functions: [
        {
          id: 'demo_call',
          name: 'demo_call',
          displayName: 'Demo Call',
          inputs: [
            { name: 'choice', type: 'DemoEnum' },
            { name: 'payload', type: 'DemoStruct' },
          ],
          outputs: [],
          type: 'function',
          stateMutability: 'view',
          modifiesState: false,
        },
      ],
      metadata: {
        specEntries: [{} as unknown],
      },
    };

    const structField = generateStellarDefaultField(
      {
        name: 'payload',
        type: 'DemoStruct',
      },
      contractSchema
    );

    expect(structField.components).toEqual(structFieldsMock);
    expect(extractStructFields).toHaveBeenCalledWith(
      contractSchema.metadata.specEntries,
      'DemoStruct'
    );

    const enumField = generateStellarDefaultField(
      {
        name: 'choice',
        type: 'DemoEnum',
      },
      contractSchema
    );

    expect(enumField.enumMetadata).toEqual(enumMetadataMock);
    expect(extractEnumVariants).toHaveBeenCalledWith(
      contractSchema.metadata.specEntries,
      'DemoEnum'
    );
  });
});
