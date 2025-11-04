import { describe, expect, test } from 'vitest';

import type {
  ContractAdapter,
  ContractFunction,
  ContractSchema,
  FormFieldType,
  FormValues,
  FunctionParameter,
  RelayerDetailsRich,
} from '@openzeppelin/ui-builder-types';

import {
  getMissingRequiredContractInputs,
  hasMissingRequiredContractInputs,
} from '../contractInputs';

function makeAdapter(
  fields: Array<Partial<FormFieldType> & { id: string; name?: string; required?: boolean }>
): ContractAdapter {
  const inputs: FormFieldType[] = fields.map((f) => ({
    id: f.id,
    name: f.name ?? f.id,
    label: f.name ?? f.id,
    type: 'text',
    validation: { required: f.required ?? false },
  })) as FormFieldType[];

  return {
    // Minimal stub for tests; only methods used by util need to exist
    networkConfig: {} as unknown as ContractAdapter['networkConfig'],
    initialAppServiceKitName: 'custom',
    loadContract: async () => ({
      name: 'x',
      ecosystem: 'evm',
      address: '0x',
      functions: [],
      events: [],
    }),
    getWritableFunctions: (s: ContractSchema): ContractFunction[] => s.functions,
    mapParameterTypeToFieldType: () => 'text',
    getCompatibleFieldTypes: () => ['text'],
    generateDefaultField: (p: FunctionParameter) => ({
      id: p.name,
      name: p.name,
      label: p.name,
      type: 'text',
      validation: {},
    }),
    signAndBroadcast: async () => ({ txHash: '0x' }),
    isValidAddress: () => true,
    getSupportedExecutionMethods: async () => [],
    validateExecutionConfig: async () => true,
    isViewFunction: () => true,
    queryViewFunction: async () => ({}),
    formatFunctionResult: () => '',
    getExplorerUrl: () => null,
    getAvailableUiKits: async () => [],
    getRelayers: async () => [],
    getRelayer: async () => ({}) as unknown as RelayerDetailsRich,
    getContractDefinitionInputs: () => inputs,
  } as unknown as ContractAdapter;
}

describe('contractInputs utils', () => {
  test('returns empty when no required inputs', () => {
    const adapter = makeAdapter([{ id: 'a' }, { id: 'b' }]);
    const values: FormValues = { a: '', b: '' };
    expect(getMissingRequiredContractInputs(adapter, values)).toEqual([]);
    expect(hasMissingRequiredContractInputs(adapter, values)).toBe(false);
  });

  test('detects missing required string fields', () => {
    const adapter = makeAdapter([
      { id: 'contractAddress', required: true },
      { id: 'contractDefinition', required: true },
      { id: 'optionalX', required: false },
    ]);
    const values: FormValues = { contractAddress: '  ', optionalX: 'ok' };
    expect(getMissingRequiredContractInputs(adapter, values)).toEqual([
      'contractAddress',
      'contractDefinition',
    ]);
    expect(hasMissingRequiredContractInputs(adapter, values)).toBe(true);
  });

  test('passes when all required have non-empty values', () => {
    const adapter = makeAdapter([
      { id: 'contractAddress', required: true },
      { id: 'contractDefinition', required: true },
      { id: 'privateStateId', required: true },
    ]);
    const values: FormValues = {
      contractAddress: '0xabc',
      contractDefinition: '{ }',
      privateStateId: 'state-1',
    };
    expect(getMissingRequiredContractInputs(adapter, values)).toEqual([]);
    expect(hasMissingRequiredContractInputs(adapter, values)).toBe(false);
  });

  test('tolerates adapters throwing/invalid inputs', () => {
    const badAdapter = {
      networkConfig: {} as unknown as ContractAdapter['networkConfig'],
      initialAppServiceKitName: 'custom',
      getContractDefinitionInputs: () => {
        throw new Error('boom');
      },
    } as unknown as ContractAdapter;
    expect(getMissingRequiredContractInputs(badAdapter, {})).toEqual([]);
    expect(hasMissingRequiredContractInputs(badAdapter, {})).toBe(false);
  });
});
