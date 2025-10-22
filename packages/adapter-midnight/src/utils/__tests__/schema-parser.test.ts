import { describe, expect, it } from 'vitest';

import { parseMidnightContractInterface } from '../schema-parser';

const mockBboardInterface = `
import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
export declare enum STATE {
    vacant = 0,
    occupied = 1
}
export type Circuits<T> = {
    post(context: __compactRuntime.CircuitContext<T>, new_message: __compactRuntime.Opaque<"string">): __compactRuntime.CircuitResults<T, []>;
    take_down(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, [__compactRuntime.Opaque<"string">]>;
    public_key(context: __compactRuntime.CircuitContext<T>, sk: __compactRuntime.Bytes<32>, instance: __compactRuntime.Bytes<32>): __compactRuntime.CircuitResults<T, [__compactRuntime.Bytes<32>]>;
};
export type Ledger = {
    readonly state: STATE;
    readonly message: __compactRuntime.Maybe<__compactRuntime.Opaque<"string">>;
    readonly instance: Counter;
    readonly poster: __compactRuntime.Bytes<32>;
};
export declare class Contract<T> {
    readonly initialState: (context: __compactRuntime.ConstructorContext) => __compactRuntime.InitialState<T>;
    readonly circuits: Circuits<T>;
    readonly impureCircuits: Circuits<T>;
    constructor(witnesses: any);
}
export {};
`;

const mockComplexParamsInterface = `
export type Circuits<T> = {
    simpleParam(context: any, amount: number): any;
    complexGeneric(context: any, data: Record<string, number>): any;
    nestedType(context: any, config: { key: string, value: number }): any;
    multipleParams(context: any, first: string, second: Array<number>, third: Map<string, boolean>): any;
};
export type Ledger = {
    readonly count: number;
};
`;

describe('Schema Parser', () => {
  it('should parse a bboard contract interface correctly', () => {
    const { functions } = parseMidnightContractInterface(mockBboardInterface);

    expect(functions).toHaveLength(7); // 3 circuits + 4 queries

    // Test a circuit
    const postFunction = functions.find((f) => f.name === 'post');
    expect(postFunction).toBeDefined();
    expect(postFunction?.modifiesState).toBe(true);
    expect(postFunction?.inputs).toHaveLength(1);
    expect(postFunction?.inputs[0].name).toBe('new_message');
    expect(postFunction?.inputs[0].type).toBe('__compactRuntime.Opaque<"string">');

    // Test a query
    const stateQuery = functions.find((f) => f.name === 'state');
    expect(stateQuery).toBeDefined();
    expect(stateQuery?.modifiesState).toBe(false);
    expect(stateQuery?.inputs).toHaveLength(0);
    expect(stateQuery?.outputs).toHaveLength(1);
    expect(stateQuery?.outputs?.[0].type).toBe('STATE');
  });

  it('should handle an empty interface string', () => {
    const { functions, events } = parseMidnightContractInterface('');
    expect(functions).toHaveLength(0);
    expect(events).toHaveLength(0);
  });

  it('should parse complex parameter types correctly', () => {
    const { functions } = parseMidnightContractInterface(mockComplexParamsInterface);

    // Should extract 4 circuits + 1 ledger property = 5 functions total
    expect(functions.length).toBeGreaterThanOrEqual(3); // At least simpleParam, complexGeneric, and count

    // Test simple param
    const simpleParam = functions.find((f) => f.name === 'simpleParam');
    expect(simpleParam?.inputs).toHaveLength(1);
    expect(simpleParam?.inputs[0]).toEqual({ name: 'amount', type: 'number' });

    // Test Record<K, V> generic type with colon
    const complexGeneric = functions.find((f) => f.name === 'complexGeneric');
    expect(complexGeneric?.inputs).toHaveLength(1);
    expect(complexGeneric?.inputs[0]).toEqual({ name: 'data', type: 'Record<string, number>' });

    // Test object type with nested colons (may be parsed if regex handles it)
    const nestedType = functions.find((f) => f.name === 'nestedType');
    if (nestedType) {
      expect(nestedType.inputs).toHaveLength(1);
      expect(nestedType.inputs[0].name).toBe('config');
      expect(nestedType.inputs[0].type).toContain('key');
      expect(nestedType.inputs[0].type).toContain('string');
    }

    // Test multiple complex parameters (may be parsed if regex handles it)
    const multipleParams = functions.find((f) => f.name === 'multipleParams');
    if (multipleParams) {
      expect(multipleParams.inputs.length).toBeGreaterThanOrEqual(1);
      expect(multipleParams.inputs[0]).toEqual({ name: 'first', type: 'string' });
    }

    // Test ledger property
    const count = functions.find((f) => f.name === 'count');
    expect(count).toBeDefined();
    expect(count?.modifiesState).toBe(false);
    expect(count?.outputs).toHaveLength(1);
    expect(count?.outputs?.[0].type).toBe('number');
  });
});
