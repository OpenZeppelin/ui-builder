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

import { buildRequiredInputSnapshot, requiredSnapshotsEqual } from '../requiredInputs';

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

describe('buildRequiredInputSnapshot', () => {
  test('returns null when formValues is null', () => {
    const adapter = makeAdapter([{ id: 'a', required: true }]);
    expect(buildRequiredInputSnapshot(adapter, null)).toBeNull();
  });

  test('returns null when formValues is undefined', () => {
    const adapter = makeAdapter([{ id: 'a', required: true }]);
    expect(buildRequiredInputSnapshot(adapter, undefined)).toBeNull();
  });

  test('returns null when adapter is null', () => {
    const values: FormValues = { a: 'value' };
    expect(buildRequiredInputSnapshot(null, values)).toBeNull();
  });

  test('returns null when adapter has no required fields', () => {
    const adapter = makeAdapter([
      { id: 'optional1', required: false },
      { id: 'optional2', required: false },
    ]);
    const values: FormValues = { optional1: 'value1', optional2: 'value2' };
    expect(buildRequiredInputSnapshot(adapter, values)).toBeNull();
  });

  test('returns null when adapter has no getContractDefinitionInputs method', () => {
    const adapter = {
      networkConfig: {} as unknown as ContractAdapter['networkConfig'],
    } as unknown as ContractAdapter;
    const values: FormValues = { a: 'value' };
    expect(buildRequiredInputSnapshot(adapter, values)).toBeNull();
  });

  test('builds snapshot with required fields only', () => {
    const adapter = makeAdapter([
      { id: 'contractAddress', required: true },
      { id: 'privateStateId', required: true },
      { id: 'optionalField', required: false },
    ]);
    const values: FormValues = {
      contractAddress: '0xabc',
      privateStateId: 'state-1',
      optionalField: 'ignored',
    };
    const snapshot = buildRequiredInputSnapshot(adapter, values);
    expect(snapshot).toEqual({
      contractAddress: '0xabc',
      privateStateId: 'state-1',
    });
  });

  test('normalizes string values by trimming whitespace', () => {
    const adapter = makeAdapter([{ id: 'address', required: true }]);
    const values: FormValues = { address: '  0x123  ' };
    const snapshot = buildRequiredInputSnapshot(adapter, values);
    expect(snapshot).toEqual({ address: '0x123' });
  });

  test('normalizes File objects to metadata', () => {
    const adapter = makeAdapter([{ id: 'file', required: true }]);
    const file = new File(['content'], 'test.zip', { type: 'application/zip' });
    const values: FormValues = { file };
    const snapshot = buildRequiredInputSnapshot(adapter, values);
    expect(snapshot).toEqual({
      file: {
        name: 'test.zip',
        size: file.size,
        lastModified: file.lastModified,
      },
    });
  });

  test('normalizes undefined to null', () => {
    const adapter = makeAdapter([{ id: 'field', required: true }]);
    const values: FormValues = { field: undefined };
    const snapshot = buildRequiredInputSnapshot(adapter, values);
    expect(snapshot).toEqual({ field: null });
  });

  test('preserves other types as-is', () => {
    const adapter = makeAdapter([
      { id: 'number', required: true },
      { id: 'boolean', required: true },
      { id: 'object', required: true },
    ]);
    const values: FormValues = {
      number: 42,
      boolean: true,
      object: { nested: 'value' },
    };
    const snapshot = buildRequiredInputSnapshot(adapter, values);
    expect(snapshot).toEqual({
      number: 42,
      boolean: true,
      object: { nested: 'value' },
    });
  });

  test('uses field.name when available, falls back to field.id', () => {
    const adapter = makeAdapter([
      { id: 'fieldId', name: 'fieldName', required: true },
      { id: 'noName', required: true },
    ]);
    const values: FormValues = {
      fieldName: 'value1',
      noName: 'value2',
    };
    const snapshot = buildRequiredInputSnapshot(adapter, values);
    expect(snapshot).toEqual({
      fieldName: 'value1',
      noName: 'value2',
    });
  });

  test('skips fields without name or id', () => {
    const adapter = makeAdapter([
      { id: '', name: '', required: true },
      { id: 'valid', required: true },
    ]);
    const values: FormValues = { valid: 'value' };
    const snapshot = buildRequiredInputSnapshot(adapter, values);
    expect(snapshot).toEqual({ valid: 'value' });
  });

  test('handles adapter throwing errors gracefully', () => {
    const badAdapter = {
      networkConfig: {} as unknown as ContractAdapter['networkConfig'],
      getContractDefinitionInputs: () => {
        throw new Error('boom');
      },
    } as unknown as ContractAdapter;
    const values: FormValues = { a: 'value' };
    expect(() => buildRequiredInputSnapshot(badAdapter, values)).not.toThrow();
    expect(buildRequiredInputSnapshot(badAdapter, values)).toBeNull();
  });
});

describe('requiredSnapshotsEqual', () => {
  test('returns true for same reference', () => {
    const snapshot = { a: 'value' };
    expect(requiredSnapshotsEqual(snapshot, snapshot)).toBe(true);
  });

  test('returns true for both null', () => {
    expect(requiredSnapshotsEqual(null, null)).toBe(true);
  });

  test('returns false when one is null and other is not', () => {
    expect(requiredSnapshotsEqual(null, { a: 'value' })).toBe(false);
    expect(requiredSnapshotsEqual({ a: 'value' }, null)).toBe(false);
  });

  test('returns true for identical simple snapshots', () => {
    const a = { contractAddress: '0xabc', privateStateId: 'state-1' };
    const b = { contractAddress: '0xabc', privateStateId: 'state-1' };
    expect(requiredSnapshotsEqual(a, b)).toBe(true);
  });

  test('returns false for different values', () => {
    const a = { contractAddress: '0xabc' };
    const b = { contractAddress: '0xdef' };
    expect(requiredSnapshotsEqual(a, b)).toBe(false);
  });

  test('returns false for different number of keys', () => {
    const a = { contractAddress: '0xabc' };
    const b = { contractAddress: '0xabc', privateStateId: 'state-1' };
    expect(requiredSnapshotsEqual(a, b)).toBe(false);
  });

  test('compares keys regardless of order', () => {
    const a = { contractAddress: '0xabc', privateStateId: 'state-1' };
    const b = { privateStateId: 'state-1', contractAddress: '0xabc' };
    expect(requiredSnapshotsEqual(a, b)).toBe(true);
  });

  test('compares object values using JSON.stringify', () => {
    const a = { artifacts: { zip: 'base64data', size: 1024 } };
    const b = { artifacts: { zip: 'base64data', size: 1024 } };
    const c = { artifacts: { zip: 'base64data', size: 2048 } };
    expect(requiredSnapshotsEqual(a, b)).toBe(true);
    expect(requiredSnapshotsEqual(a, c)).toBe(false);
  });

  test('handles File metadata objects correctly', () => {
    const file1 = { name: 'test.zip', size: 1024, lastModified: 1234567890 };
    const file2 = { name: 'test.zip', size: 1024, lastModified: 1234567890 };
    const file3 = { name: 'other.zip', size: 1024, lastModified: 1234567890 };
    const a = { file: file1 };
    const b = { file: file2 };
    const c = { file: file3 };
    expect(requiredSnapshotsEqual(a, b)).toBe(true);
    expect(requiredSnapshotsEqual(a, c)).toBe(false);
  });

  test('handles mixed value types', () => {
    const a = {
      string: 'value',
      number: 42,
      boolean: true,
      object: { nested: 'data' },
      nullValue: null,
    };
    const b = {
      string: 'value',
      number: 42,
      boolean: true,
      object: { nested: 'data' },
      nullValue: null,
    };
    const c = {
      string: 'value',
      number: 42,
      boolean: false, // Different boolean
      object: { nested: 'data' },
      nullValue: null,
    };
    expect(requiredSnapshotsEqual(a, b)).toBe(true);
    expect(requiredSnapshotsEqual(a, c)).toBe(false);
  });

  test('handles empty snapshots', () => {
    expect(requiredSnapshotsEqual({}, {})).toBe(true);
  });

  test('case-sensitive string comparison', () => {
    const a = { address: '0xABC' };
    const b = { address: '0xabc' };
    expect(requiredSnapshotsEqual(a, b)).toBe(false);
  });

  test('handles trimmed vs untrimmed strings differently', () => {
    const a = { address: '0xabc' };
    const b = { address: '  0xabc  ' };
    expect(requiredSnapshotsEqual(a, b)).toBe(false);
  });

  test('real-world Midnight adapter scenario', () => {
    const adapter = makeAdapter([
      { id: 'contractAddress', required: true },
      { id: 'privateStateId', required: true },
      { id: 'contractArtifactsZip', required: true },
    ]);

    const initialValues: FormValues = {
      contractAddress: '020000d9cfd7ee1f3932a13d39e81b8445e90e0f1c5c18112e64af45564c5d150ecc',
      privateStateId: 'inputoutputtest_v1',
      contractArtifactsZip: new File(['zip content'], 'artifacts.zip'),
    };

    const snapshot1 = buildRequiredInputSnapshot(adapter, initialValues);
    expect(snapshot1).not.toBeNull();

    const changedValues: FormValues = {
      contractAddress: '020000d9cfd7ee1f3932a13d39e81b8445e90e0f1c5c18112e64af45564c5d150ecc',
      privateStateId: 'inputoutputtest_v2', // Changed
      contractArtifactsZip: new File(['zip content'], 'artifacts.zip'),
    };

    const snapshot2 = buildRequiredInputSnapshot(adapter, changedValues);
    expect(requiredSnapshotsEqual(snapshot1, snapshot2)).toBe(false);
  });
});
