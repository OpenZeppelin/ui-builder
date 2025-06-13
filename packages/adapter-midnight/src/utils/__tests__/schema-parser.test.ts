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
});
