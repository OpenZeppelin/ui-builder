import { Contract } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';

import type { ContractSchema, FormFieldType } from '@openzeppelin/ui-types';

import { loadStellarContractFromAddress } from '../../src/contract/loader';
import { formatStellarTransactionData } from '../../src/transaction/formatter';
import { valueToScVal } from '../../src/transform/parsers/scval-converter';

// Real deployed contract address from the soroban-examples
const REAL_CONTRACT_ADDRESS = 'CAKQRPNF7NC34CIDCLXE47Q35DYJHBYHCJRVP5QHT6ESGFGAZB7TRFDP';

const TESTNET_CONFIG = {
  name: 'testnet',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  friendbotUrl: 'https://friendbot.stellar.org',
};

describe.skip('ComplexStruct with Real Contract Integration', () => {
  let contractSchema: ContractSchema;

  it('should load real contract and extract specEntries', async () => {
    contractSchema = await loadStellarContractFromAddress(REAL_CONTRACT_ADDRESS, TESTNET_CONFIG);

    // Add the address to the schema (loader doesn't set it)
    contractSchema.address = REAL_CONTRACT_ADDRESS;

    expect(contractSchema).toBeDefined();
    expect(contractSchema.metadata?.specEntries).toBeDefined();
    expect(Array.isArray(contractSchema.metadata?.specEntries)).toBe(true);

    // Find the complex_struct function
    const complexStructFn = contractSchema.functions.find((f) => f.name === 'complex_struct');
    expect(complexStructFn).toBeDefined();
    expect(complexStructFn?.inputs).toHaveLength(1);
    expect(complexStructFn?.inputs[0].type).toBe('ComplexStruct');
    expect(complexStructFn?.inputs[0].components).toBeDefined();
    expect(complexStructFn?.inputs[0].components).toHaveLength(8);
  }, 30000); // 30 second timeout for network call

  it('should successfully convert complex_struct with real specEntries', async () => {
    // Skip if contract wasn't loaded (e.g., network issue)
    if (!contractSchema) {
      contractSchema = await loadStellarContractFromAddress(REAL_CONTRACT_ADDRESS, TESTNET_CONFIG);
      contractSchema.address = REAL_CONTRACT_ADDRESS;
    }

    // Step 1: Find the complex_struct function
    const functionId = contractSchema.functions.find((f) => f.name === 'complex_struct')?.id;
    expect(functionId).toBeDefined();

    // Step 2: Simulate form submission with the EXACT data from the UI
    const submittedInputs = {
      config: {
        a32: 123123,
        a64: 1241312,
        admin: REAL_CONTRACT_ADDRESS,
        assets_vec: [
          { tag: 'Stellar', values: [REAL_CONTRACT_ADDRESS] },
          { tag: 'Other', values: ['asdasd'] },
        ],
        b32: 1123,
        base_asset: { tag: 'Stellar', values: [REAL_CONTRACT_ADDRESS] },
        c32: 123123,
        complex_enum3: { tag: 'Some', values: [REAL_CONTRACT_ADDRESS, '12312312'] },
      },
    };

    // Step 3: The fields array would have just the single object field
    // (the nested fields are rendered by ObjectField but not in this array)
    const fields: FormFieldType[] = [
      {
        id: 'field-config',
        name: 'config',
        label: 'Config',
        type: 'object',
        validation: {},
        components: contractSchema.functions.find((f) => f.id === functionId)?.inputs[0].components,
      },
    ];

    // Step 4: Format transaction data (THIS is where enum metadata should be extracted from specEntries)
    const transactionData = formatStellarTransactionData(
      contractSchema,
      functionId!,
      submittedInputs,
      fields
    );

    // Step 5: Verify argSchema has enum metadata for all enum fields
    const argSchema = transactionData.argSchema?.[0];
    expect(argSchema).toBeDefined();
    expect(argSchema?.components).toBeDefined();

    const baseAssetComp = argSchema?.components?.find((c) => c.name === 'base_asset');
    expect(baseAssetComp?.enumMetadata).toBeDefined();
    expect(baseAssetComp?.enumMetadata?.name).toBe('ComplexEnum2');
    expect(baseAssetComp?.enumMetadata?.variants).toHaveLength(2);

    const complexEnum3Comp = argSchema?.components?.find((c) => c.name === 'complex_enum3');
    expect(complexEnum3Comp?.enumMetadata).toBeDefined();
    expect(complexEnum3Comp?.enumMetadata?.name).toBe('ComplexEnum3');
    expect(complexEnum3Comp?.enumMetadata?.variants).toHaveLength(2);
    // Verify tuple flattening worked
    const someVariant = complexEnum3Comp?.enumMetadata?.variants.find((v) => v.name === 'Some');
    expect(someVariant?.payloadTypes).toEqual(['Address', 'I128']);

    const assetsVecComp = argSchema?.components?.find((c) => c.name === 'assets_vec');
    expect(assetsVecComp?.enumMetadata).toBeDefined();
    expect(assetsVecComp?.enumMetadata?.name).toBe('ComplexEnum2');

    // Step 6: Convert to ScVal
    const scValArgs = transactionData.args.map((arg, index) => {
      const argType = transactionData.argTypes[index];
      const argSchemaForArg = transactionData.argSchema?.[index];
      return valueToScVal(arg, argType, argSchemaForArg);
    });

    expect(scValArgs).toHaveLength(1);
    const structScVal = scValArgs[0];
    expect(structScVal.switch().name).toBe('scvMap');

    // Step 7: Verify enum fields are properly converted
    const structMap = structScVal.map();
    expect(structMap.length).toBe(8);

    const fieldMap = new Map(structMap.map((e) => [e.key().sym().toString(), e.val()]));

    // Verify base_asset enum
    const baseAssetScVal = fieldMap.get('base_asset');
    expect(baseAssetScVal?.switch().name).toBe('scvVec');
    const baseAssetVec = baseAssetScVal!.vec();
    expect(baseAssetVec[0].switch().name).toBe('scvSymbol');
    expect(baseAssetVec[0].sym().toString()).toBe('Stellar');
    expect(baseAssetVec[1].switch().name).toBe('scvAddress'); // ← Must be Address, not String!

    // Verify complex_enum3
    const complexEnum3ScVal = fieldMap.get('complex_enum3');
    expect(complexEnum3ScVal?.switch().name).toBe('scvVec');
    const complexEnum3Vec = complexEnum3ScVal!.vec();
    expect(complexEnum3Vec).toHaveLength(3); // Symbol + Address + I128
    expect(complexEnum3Vec[0].switch().name).toBe('scvSymbol');
    expect(complexEnum3Vec[1].switch().name).toBe('scvAddress'); // ← Must be Address, not String!
    expect(complexEnum3Vec[2].switch().name).toBe('scvI128'); // ← Must be I128, not String!

    // Verify assets_vec array
    const assetsVecScVal = fieldMap.get('assets_vec');
    expect(assetsVecScVal?.switch().name).toBe('scvVec');
    const assetsVecArray = assetsVecScVal!.vec();
    expect(assetsVecArray).toHaveLength(2);

    // Each array element must be a proper enum ScVec
    const firstEnum = assetsVecArray[0];
    expect(firstEnum.switch().name).toBe('scvVec');
    const firstEnumVec = firstEnum.vec();
    expect(firstEnumVec[0].switch().name).toBe('scvSymbol');
    expect(firstEnumVec[0].sym().toString()).toBe('Stellar');
    expect(firstEnumVec[1].switch().name).toBe('scvAddress'); // ← Must be Address, not String!

    // Step 8: Verify we can create a valid contract call
    const contract = new Contract(REAL_CONTRACT_ADDRESS);
    expect(() => {
      contract.call('complex_struct', ...scValArgs);
    }).not.toThrow();
  }, 30000); // 30 second timeout
});
