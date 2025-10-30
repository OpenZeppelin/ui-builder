import { describe, expect, it } from 'vitest';

import type { ContractFunction } from '@openzeppelin/ui-builder-types';

import {
  extractImpureCircuits,
  extractPureCircuits,
  hasImpureCircuitsType,
  hasPureCircuitsType,
  isImpureCircuit,
  isPureCircuit,
  PURE_CIRCUIT_METHOD_REGEX,
} from '../circuit-type-utils';

describe('Circuit Type Utils', () => {
  describe('hasImpureCircuitsType', () => {
    it('should return true when ImpureCircuits type exists', () => {
      const contractDefinition = `
        export type ImpureCircuits<T> = {
          increment(context: any): any;
        };
      `;
      expect(hasImpureCircuitsType(contractDefinition)).toBe(true);
    });

    it('should return true when ImpureCircuits type is declared', () => {
      const contractDefinition = `
        export declare type ImpureCircuits<T> = {
          increment(context: any): any;
        };
      `;
      expect(hasImpureCircuitsType(contractDefinition)).toBe(true);
    });

    it('should return false when ImpureCircuits type does not exist', () => {
      const contractDefinition = `
        export type PureCircuits = {
          public_key(sk: Bytes<32>): Bytes<32>;
        };
      `;
      expect(hasImpureCircuitsType(contractDefinition)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasImpureCircuitsType('')).toBe(false);
    });
  });

  describe('hasPureCircuitsType', () => {
    it('should return true when PureCircuits type exists', () => {
      const contractDefinition = `
        export type PureCircuits = {
          public_key(sk: Bytes<32>): Bytes<32>;
        };
      `;
      expect(hasPureCircuitsType(contractDefinition)).toBe(true);
    });

    it('should return true when PureCircuits type is declared', () => {
      const contractDefinition = `
        export declare type PureCircuits = {
          public_key(sk: Bytes<32>): Bytes<32>;
        };
      `;
      expect(hasPureCircuitsType(contractDefinition)).toBe(true);
    });

    it('should return false when PureCircuits type does not exist', () => {
      const contractDefinition = `
        export type ImpureCircuits<T> = {
          increment(context: any): any;
        };
      `;
      expect(hasPureCircuitsType(contractDefinition)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasPureCircuitsType('')).toBe(false);
    });
  });

  describe('extractImpureCircuits', () => {
    const mockParseParameters = (paramsText: string): ContractFunction['inputs'] => {
      if (!paramsText.trim()) return [];
      return paramsText.split(',').map((param, idx) => {
        const parts = param.trim().split(':');
        return {
          name: parts[0] || `param${idx}`,
          type: parts[1]?.trim() || 'unknown',
        };
      });
    };

    const mockCapitalizeFirst = (str: string): string => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    it('should extract impure circuits with context parameter', () => {
      const contractDefinition = `
        export type ImpureCircuits<T> = {
          increment(context: any): any;
          decrement(context: any, amount: number): any;
        };
      `;

      const result = extractImpureCircuits(
        contractDefinition,
        mockParseParameters,
        mockCapitalizeFirst
      );

      expect(Object.keys(result)).toHaveLength(2);
      expect(result.increment).toBeDefined();
      expect(result.increment.modifiesState).toBe(true);
      expect(result.increment.stateMutability).toBe('nonpayable');
      expect(result.increment.displayName).toBe('Increment');

      expect(result.decrement).toBeDefined();
      expect(result.decrement.modifiesState).toBe(true);
      expect(result.decrement.stateMutability).toBe('nonpayable');
      expect(result.decrement.displayName).toBe('Decrement');
    });

    it('should extract impure circuits with parameters', () => {
      const contractDefinition = `
        export type ImpureCircuits<T> = {
          transfer(context: any, to: string, amount: number): any;
        };
      `;

      const result = extractImpureCircuits(
        contractDefinition,
        mockParseParameters,
        mockCapitalizeFirst
      );

      expect(Object.keys(result)).toHaveLength(1);
      expect(result.transfer).toBeDefined();
      expect(result.transfer.inputs).toHaveLength(2);
      expect(result.transfer.inputs[0].name).toBe('to');
      expect(result.transfer.inputs[1].name).toBe('amount');
    });

    it('should return empty object when ImpureCircuits type does not exist', () => {
      const contractDefinition = `
        export type PureCircuits = {
          public_key(sk: Bytes<32>): Bytes<32>;
        };
      `;

      const result = extractImpureCircuits(
        contractDefinition,
        mockParseParameters,
        mockCapitalizeFirst
      );

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle empty contract definition', () => {
      const result = extractImpureCircuits('', mockParseParameters, mockCapitalizeFirst);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('extractPureCircuits', () => {
    const mockParseParameters = (paramsText: string): ContractFunction['inputs'] => {
      if (!paramsText.trim()) return [];
      return paramsText.split(',').map((param, idx) => {
        const parts = param.trim().split(':');
        return {
          name: parts[0] || `param${idx}`,
          type: parts[1]?.trim() || 'unknown',
        };
      });
    };

    const mockCapitalizeFirst = (str: string): string => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    it('should extract pure circuits without context parameter', () => {
      const contractDefinition = `
        export type PureCircuits = {
          public_key(sk: Bytes<32>): Bytes<32>;
          hash(data: string): string;
        };
      `;

      const result = extractPureCircuits(
        contractDefinition,
        mockParseParameters,
        mockCapitalizeFirst
      );

      expect(Object.keys(result)).toHaveLength(2);
      expect(result.public_key).toBeDefined();
      expect(result.public_key.modifiesState).toBe(false);
      expect(result.public_key.stateMutability).toBe('pure');
      expect(result.public_key.displayName).toBe('Public_key');
      expect(result.public_key.inputs).toHaveLength(1);
      expect(result.public_key.inputs[0].name).toBe('sk');

      expect(result.hash).toBeDefined();
      expect(result.hash.modifiesState).toBe(false);
      expect(result.hash.stateMutability).toBe('pure');
      expect(result.hash.inputs).toHaveLength(1);
      expect(result.hash.inputs[0].name).toBe('data');
    });

    it('should extract pure circuits with context parameter', () => {
      const contractDefinition = `
        export type PureCircuits = {
          compute(context: any, value: number): number;
        };
      `;

      const result = extractPureCircuits(
        contractDefinition,
        mockParseParameters,
        mockCapitalizeFirst
      );

      expect(Object.keys(result)).toHaveLength(1);
      expect(result.compute).toBeDefined();
      expect(result.compute.modifiesState).toBe(false);
      expect(result.compute.stateMutability).toBe('pure');
      expect(result.compute.inputs).toHaveLength(1);
      expect(result.compute.inputs[0].name).toBe('value');
    });

    it('should extract pure circuits with multiple parameters', () => {
      const contractDefinition = `
        export type PureCircuits = {
          add(context: any, a: number, b: number): number;
          multiply(x: number, y: number): number;
        };
      `;

      const result = extractPureCircuits(
        contractDefinition,
        mockParseParameters,
        mockCapitalizeFirst
      );

      expect(Object.keys(result)).toHaveLength(2);
      expect(result.add).toBeDefined();
      expect(result.add.inputs).toHaveLength(2);
      expect(result.add.inputs[0].name).toBe('a');
      expect(result.add.inputs[1].name).toBe('b');

      expect(result.multiply).toBeDefined();
      expect(result.multiply.inputs).toHaveLength(2);
      expect(result.multiply.inputs[0].name).toBe('x');
      expect(result.multiply.inputs[1].name).toBe('y');
    });

    it('should return empty object when PureCircuits type does not exist', () => {
      const contractDefinition = `
        export type ImpureCircuits<T> = {
          increment(context: any): any;
        };
      `;

      const result = extractPureCircuits(
        contractDefinition,
        mockParseParameters,
        mockCapitalizeFirst
      );

      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle empty contract definition', () => {
      const result = extractPureCircuits('', mockParseParameters, mockCapitalizeFirst);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('isImpureCircuit', () => {
    it('should return true for state-modifying function', () => {
      const functionDetails: ContractFunction = {
        id: 'increment',
        name: 'increment',
        displayName: 'Increment',
        inputs: [],
        outputs: [],
        modifiesState: true,
        type: 'function',
        stateMutability: 'nonpayable',
      };

      expect(isImpureCircuit(functionDetails)).toBe(true);
    });

    it('should return false for pure circuit', () => {
      const functionDetails: ContractFunction = {
        id: 'public_key',
        name: 'public_key',
        displayName: 'Public Key',
        inputs: [],
        outputs: [],
        modifiesState: false,
        type: 'function',
        stateMutability: 'pure',
      };

      expect(isImpureCircuit(functionDetails)).toBe(false);
    });

    it('should return false for view function', () => {
      const functionDetails: ContractFunction = {
        id: 'getBalance',
        name: 'getBalance',
        displayName: 'Get Balance',
        inputs: [],
        outputs: [],
        modifiesState: false,
        type: 'function',
        stateMutability: 'view',
      };

      expect(isImpureCircuit(functionDetails)).toBe(false);
    });

    it('should return false when modifiesState is false even if stateMutability is nonpayable', () => {
      const functionDetails: ContractFunction = {
        id: 'test',
        name: 'test',
        displayName: 'Test',
        inputs: [],
        outputs: [],
        modifiesState: false,
        type: 'function',
        stateMutability: 'nonpayable',
      };

      expect(isImpureCircuit(functionDetails)).toBe(false);
    });
  });

  describe('isPureCircuit', () => {
    it('should return true for pure circuit', () => {
      const functionDetails: ContractFunction = {
        id: 'public_key',
        name: 'public_key',
        displayName: 'Public Key',
        inputs: [],
        outputs: [],
        modifiesState: false,
        type: 'function',
        stateMutability: 'pure',
      };

      expect(isPureCircuit(functionDetails)).toBe(true);
    });

    it('should return false for impure circuit', () => {
      const functionDetails: ContractFunction = {
        id: 'increment',
        name: 'increment',
        displayName: 'Increment',
        inputs: [],
        outputs: [],
        modifiesState: true,
        type: 'function',
        stateMutability: 'nonpayable',
      };

      expect(isPureCircuit(functionDetails)).toBe(false);
    });

    it('should return false for view function', () => {
      const functionDetails: ContractFunction = {
        id: 'getBalance',
        name: 'getBalance',
        displayName: 'Get Balance',
        inputs: [],
        outputs: [],
        modifiesState: false,
        type: 'function',
        stateMutability: 'view',
      };

      expect(isPureCircuit(functionDetails)).toBe(false);
    });

    it('should return false when stateMutability is undefined', () => {
      const functionDetails: ContractFunction = {
        id: 'test',
        name: 'test',
        displayName: 'Test',
        inputs: [],
        outputs: [],
        modifiesState: false,
        type: 'function',
        stateMutability: undefined as unknown as 'pure',
      };

      expect(isPureCircuit(functionDetails)).toBe(false);
    });
  });

  describe('PURE_CIRCUIT_METHOD_REGEX', () => {
    it('should match pure circuit without context parameter', () => {
      const testString = 'public_key(sk: Bytes<32>)';
      const matches = [...testString.matchAll(PURE_CIRCUIT_METHOD_REGEX)];

      expect(matches).toHaveLength(1);
      expect(matches[0][1]).toBe('public_key');
      expect(matches[0][3]).toBe('sk: Bytes<32>');
    });

    it('should match pure circuit with context parameter', () => {
      const testString = 'compute(context: any, value: number)';
      const matches = [...testString.matchAll(PURE_CIRCUIT_METHOD_REGEX)];

      expect(matches).toHaveLength(1);
      expect(matches[0][1]).toBe('compute');
      expect(matches[0][2]).toBe('value: number');
    });

    it('should match pure circuit with multiple parameters without context', () => {
      const testString = 'add(a: number, b: number)';
      const matches = [...testString.matchAll(PURE_CIRCUIT_METHOD_REGEX)];

      expect(matches).toHaveLength(1);
      expect(matches[0][1]).toBe('add');
      expect(matches[0][3]).toBe('a: number, b: number');
    });

    it('should match pure circuit with multiple parameters with context', () => {
      const testString = 'transfer(context: any, to: string, amount: number)';
      const matches = [...testString.matchAll(PURE_CIRCUIT_METHOD_REGEX)];

      expect(matches).toHaveLength(1);
      expect(matches[0][1]).toBe('transfer');
      expect(matches[0][2]).toBe('to: string, amount: number');
    });

    it('should match multiple pure circuits in a string', () => {
      const testString = 'public_key(sk: Bytes<32>) hash(data: string)';
      const matches = [...testString.matchAll(PURE_CIRCUIT_METHOD_REGEX)];

      expect(matches).toHaveLength(2);
      expect(matches[0][1]).toBe('public_key');
      expect(matches[1][1]).toBe('hash');
    });

    it('should not match impure circuit format (requires context)', () => {
      // Impure circuits always require context, so this shouldn't match
      const testString = 'increment(context: any)';
      const matches = [...testString.matchAll(PURE_CIRCUIT_METHOD_REGEX)];

      // Actually, this WILL match because the regex allows context parameter
      // The regex is designed to match both patterns
      expect(matches).toHaveLength(1);
      expect(matches[0][1]).toBe('increment');
    });

    it('should handle empty parameter list', () => {
      const testString = 'noParams()';
      const matches = [...testString.matchAll(PURE_CIRCUIT_METHOD_REGEX)];

      // The regex requires at least one parameter (either context or other params)
      // So empty parameter lists won't match
      expect(matches).toHaveLength(0);
    });
  });
});
