import { describe, expect, it } from 'vitest';

import type { FormFieldType } from '@openzeppelin/ui-builder-types';

import { buildConfigurationObject } from '../configBuilder';

type BuilderState = Parameters<typeof buildConfigurationObject>[0];

// Minimal mock of the builder store state shape actually used by buildConfigurationObject
function makeState(overrides: Partial<BuilderState> = {}): BuilderState {
  return {
    selectedEcosystem: 'evm',
    selectedNetworkConfigId: 'mainnet',
    selectedFunction: 'transfer',
    contractState: { address: '0xabc' },
    formConfig: {
      functionId: 'transfer',
      title: 'Test UI',
      fields: [] as FormFieldType[],
    },
    ...overrides,
  } as BuilderState;
}

function makeField(partial?: Partial<FormFieldType>): FormFieldType {
  const base: FormFieldType = {
    id: 'id-1',
    name: 'amount',
    label: 'Amount',
    type: 'number',
    placeholder: 'Enter amount',
    helperText: '',
    defaultValue: 0,
    validation: { required: true },
    options: undefined,
    width: 'full',
    visibleWhen: undefined,
    originalParameterType: undefined,
    isHidden: false,
    isHardcoded: false,
    hardcodedValue: undefined,
    readOnly: false,
    components: undefined,
    elementType: undefined,
    elementFieldConfig: undefined,
    enumMetadata: undefined,
    mapMetadata: undefined,
  };
  return { ...base, ...(partial || {}) } as FormFieldType;
}

describe('configBuilder sanitize behavior', () => {
  it('removes function properties deeply', () => {
    const field = makeField({
      // @ts-expect-error test
      transforms: () => {},
      elementFieldConfig: {
        transform: () => {},
        type: 'number',
        validation: { required: true },
        placeholder: 'x',
      } as unknown as FormFieldType,
    });

    const state = makeState({
      formConfig: {
        functionId: 'fn',
        title: 'Test',
        fields: [field],
      } as unknown as BuilderState['formConfig'],
    });

    const cfg = buildConfigurationObject(state, 'Title');
    const saved = cfg.formConfig.fields[0] as unknown as Record<string, unknown>;

    expect(typeof saved.transforms).toBe('undefined');
    const elemCfg = (saved.elementFieldConfig ?? {}) as unknown as Record<string, unknown>;
    expect(typeof elemCfg.transform).toBe('undefined');
  });

  it('strips symbol values and preserves primitives', () => {
    const sym = Symbol('x');
    const field = makeField({
      components: sym as unknown as never,
      defaultValue: 42,
    });

    const state = makeState({
      formConfig: {
        functionId: 'fn',
        title: 'Test',
        fields: [field],
      } as unknown as BuilderState['formConfig'],
    });

    const cfg = buildConfigurationObject(state, 'Title');
    const saved = cfg.formConfig.fields[0] as unknown as Record<string, unknown>;

    expect(saved.components).toBeUndefined();
    expect(saved.defaultValue).toBe(42);
  });

  it('sanitizes arrays of nested objects', () => {
    const field = makeField({
      type: 'array',
      elementType: 'text',
      hardcodedValue: [{ bad: () => {} }, { ok: 'v' }],
    });

    const cfg = buildConfigurationObject(
      makeState({
        formConfig: {
          functionId: 'fn',
          title: 'Test',
          fields: [field],
        } as unknown as BuilderState['formConfig'],
      }),
      'Title'
    );

    const savedField = cfg.formConfig.fields[0] as unknown as Record<string, unknown>;
    const hv = (savedField.hardcodedValue as unknown[]) || [];
    expect(Array.isArray(hv)).toBe(true);
    expect(hv.length).toBe(2);
    expect('bad' in (hv[0] as unknown as Record<string, unknown>)).toBe(false);
    expect((hv[1] as unknown as Record<string, unknown>).ok).toBe('v');
  });

  it('does not mutate the original field object', () => {
    const field = makeField({ visibleWhen: (() => true) as never });
    const original = JSON.parse(JSON.stringify(field));

    buildConfigurationObject(
      makeState({
        formConfig: {
          functionId: 'fn',
          title: 'Test',
          fields: [field],
        } as unknown as BuilderState['formConfig'],
      }),
      'Title'
    );

    expect(field).toMatchObject(original);
  });
});
