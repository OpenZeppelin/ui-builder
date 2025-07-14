/**
 * Unit tests for ABI transformation logic.
 */
import type { AbiFunction } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import type { ContractFunction, ContractSchema } from '@openzeppelin/contracts-ui-builder-types';

import type { AbiItem } from '../../types';
// Adjust path as necessary
import { createAbiFunctionItem, transformAbiToSchema } from '../transformer';

// Mock utility functions as their specific formatting is not under test here
vi.mock('../../utils', () => ({
  formatMethodName: vi.fn((name: string) => `formatted_${name}`),
  formatInputName: vi.fn(
    (name: string | undefined, type: string) => `${name ? `formatted_${name}` : `param_${type}`}`
  ),
}));

describe('ABI Transformer', () => {
  describe('transformAbiToSchema', () => {
    const mockContractName = 'TestContract';
    const mockContractAddress = '0x1234567890123456789012345678901234567890';

    it('should transform an empty ABI to an empty functions array', () => {
      const abi: readonly AbiItem[] = [];
      const expectedSchema: ContractSchema = {
        ecosystem: 'evm',
        name: mockContractName,
        address: undefined,
        functions: [],
      };
      expect(transformAbiToSchema(abi, mockContractName)).toEqual(expectedSchema);
    });

    it('should transform a simple function correctly', () => {
      const abi: readonly AbiItem[] = [
        {
          type: 'function',
          name: 'myFunction',
          inputs: [],
          outputs: [],
          stateMutability: 'nonpayable',
        },
      ];
      const result = transformAbiToSchema(abi, mockContractName, mockContractAddress);
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0]).toEqual(
        expect.objectContaining({
          name: 'myFunction',
          displayName: 'formatted_myFunction',
          inputs: [],
          outputs: [],
          stateMutability: 'nonpayable',
          modifiesState: true,
          type: 'function',
        })
      );
      expect(result.ecosystem).toBe('evm');
      expect(result.name).toBe(mockContractName);
      expect(result.address).toBe(mockContractAddress);
    });

    it('should handle different stateMutability values', () => {
      const abi: readonly AbiItem[] = [
        { type: 'function', name: 'viewFunc', inputs: [], outputs: [], stateMutability: 'view' },
        { type: 'function', name: 'pureFunc', inputs: [], outputs: [], stateMutability: 'pure' },
        {
          type: 'function',
          name: 'payableFunc',
          inputs: [],
          outputs: [],
          stateMutability: 'payable',
        },
        {
          type: 'function',
          name: 'nonPayableFunc',
          inputs: [],
          outputs: [],
          stateMutability: 'nonpayable',
        },
      ];
      const result = transformAbiToSchema(abi, mockContractName);
      expect(result.functions[0]).toHaveProperty('modifiesState', false);
      expect(result.functions[1]).toHaveProperty('modifiesState', false);
      expect(result.functions[2]).toHaveProperty('modifiesState', true);
      expect(result.functions[3]).toHaveProperty('modifiesState', true);
    });

    it('should correctly map input and output parameters', () => {
      const abi: readonly AbiItem[] = [
        {
          type: 'function',
          name: 'transfer',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: 'success', type: 'bool' }],
          stateMutability: 'nonpayable',
        },
      ];
      const result = transformAbiToSchema(abi, mockContractName);
      const func = result.functions[0];
      expect(func.inputs).toHaveLength(2);
      expect(func.inputs[0]).toEqual({ name: 'to', type: 'address', displayName: 'formatted_to' });
      expect(func.inputs[1]).toEqual({
        name: 'amount',
        type: 'uint256',
        displayName: 'formatted_amount',
      });
      expect(func.outputs).toBeDefined();
      expect(func.outputs).toHaveLength(1);
      if (func.outputs) {
        expect(func.outputs[0]).toEqual({
          name: 'success',
          type: 'bool',
          displayName: 'formatted_success',
        });
      }
    });

    it('should strip internalType and other non-standard properties from parameters', () => {
      const abi: readonly AbiItem[] = [
        {
          type: 'function',
          name: 'complexCall',
          inputs: [
            {
              name: 'param1',
              type: 'address',
              internalType: 'contract IERC20', // This should be stripped
              extraProperty: 'shouldBeGone', // This should be stripped
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any, // Cast the input object to allow extra property for the test
          ],
          outputs: [],
          stateMutability: 'view',
        },
      ];
      const result = transformAbiToSchema(abi, mockContractName);
      const funcInput = result.functions[0].inputs[0];
      expect(funcInput).toEqual({
        name: 'param1',
        type: 'address',
        displayName: 'formatted_param1',
      });
      expect(funcInput).not.toHaveProperty('internalType');
      expect(funcInput).not.toHaveProperty('extraProperty');
    });

    it('should handle tuple inputs and strip internalType from components', () => {
      const abi: readonly AbiItem[] = [
        {
          type: 'function',
          name: 'processStruct',
          inputs: [
            {
              name: 'myStruct',
              type: 'tuple',
              components: [
                { name: 'field1', type: 'uint256', internalType: 'uint256_internal' },
                { name: 'field2', type: 'address', internalType: 'address_internal' },
              ],
            },
          ],
          outputs: [],
          stateMutability: 'nonpayable',
        },
      ];
      const result = transformAbiToSchema(abi, mockContractName);
      const structInput = result.functions[0].inputs[0];
      expect(structInput.type).toBe('tuple');
      expect(structInput.components).toBeDefined();
      expect(structInput.components).toHaveLength(2);
      if (structInput.components) {
        expect(structInput.components[0]).toEqual({
          name: 'field1',
          type: 'uint256',
          displayName: 'formatted_field1',
        });
        expect(structInput.components[0]).not.toHaveProperty('internalType');
        expect(structInput.components[1]).toEqual({
          name: 'field2',
          type: 'address',
          displayName: 'formatted_field2',
        });
        expect(structInput.components[1]).not.toHaveProperty('internalType');
      }
    });

    it('should generate a unique ID for functions, considering overloads', () => {
      const abi: readonly AbiItem[] = [
        {
          type: 'function',
          name: 'overloadedFunc',
          inputs: [{ name: 'a', type: 'uint256' }],
          outputs: [],
          stateMutability: 'view',
        },
        {
          type: 'function',
          name: 'overloadedFunc',
          inputs: [{ name: 'a', type: 'string' }],
          outputs: [],
          stateMutability: 'view',
        },
      ];
      const result = transformAbiToSchema(abi, mockContractName);
      expect(result.functions[0].id).toBe('overloadedFunc_uint256');
      expect(result.functions[1].id).toBe('overloadedFunc_string');
    });

    it('should handle missing names for functions and parameters gracefully', () => {
      // Define the parameter with undefined name separately to test handling
      const paramWithoutName = { name: undefined, type: 'bool' };
      const abi: readonly AbiItem[] = [
        {
          type: 'function',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: undefined as any, // Simulate missing function name - intentional 'any' for test
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - Deliberately passing possibly invalid input type for robustness test
          inputs: [paramWithoutName], // Use the defined object, ignoring TS error for test
          outputs: [],
          stateMutability: 'view',
        },
      ];
      const result = transformAbiToSchema(abi, mockContractName);
      expect(result.functions[0].name).toBe('');
      expect(result.functions[0].displayName).toBe('formatted_');
      expect(result.functions[0].inputs[0].name).toBe('');
      expect(result.functions[0].inputs[0].displayName).toBe('param_bool');
    });
  });

  describe('createAbiFunctionItem', () => {
    it('should convert a simple ContractFunction to AbiFunction', () => {
      const contractFunc: ContractFunction = {
        id: 'test_func_',
        name: 'testFunc',
        displayName: 'Test Func',
        inputs: [],
        outputs: [],
        type: 'function',
        stateMutability: 'view',
        modifiesState: false,
      };
      const expectedAbiFunc: AbiFunction = {
        name: 'testFunc',
        type: 'function',
        inputs: [],
        outputs: [],
        stateMutability: 'view',
      };
      expect(createAbiFunctionItem(contractFunc)).toEqual(expectedAbiFunc);
    });

    it('should convert ContractFunction with inputs and outputs', () => {
      const contractFunc: ContractFunction = {
        id: 'transfer_address_uint256',
        name: 'transfer',
        displayName: 'Transfer',
        inputs: [
          { name: 'to', type: 'address', displayName: 'To' },
          { name: 'amount', type: 'uint256', displayName: 'Amount' },
        ],
        outputs: [{ name: 'success', type: 'bool', displayName: 'Success' }],
        type: 'function',
        stateMutability: 'nonpayable',
        modifiesState: true,
      };
      const expectedAbiFunc: AbiFunction = {
        name: 'transfer',
        type: 'function',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: 'success', type: 'bool' }],
        stateMutability: 'nonpayable',
      };
      expect(createAbiFunctionItem(contractFunc)).toEqual(expectedAbiFunc);
    });

    it('should convert ContractFunction with tuple components', () => {
      const contractFunc: ContractFunction = {
        id: 'structFunc_tuple',
        name: 'structFunc',
        displayName: 'Struct Func',
        inputs: [
          {
            name: 'myStruct',
            type: 'tuple',
            displayName: 'My Struct',
            components: [
              { name: 'field1', type: 'uint256', displayName: 'Field 1' },
              { name: 'field2', type: 'address', displayName: 'Field 2' },
            ],
          },
        ],
        outputs: [],
        type: 'function',
        stateMutability: 'pure',
        modifiesState: false,
      };
      const expectedAbiFunc: AbiFunction = {
        name: 'structFunc',
        type: 'function',
        inputs: [
          {
            name: 'myStruct',
            type: 'tuple',
            components: [
              { name: 'field1', type: 'uint256' },
              { name: 'field2', type: 'address' },
            ],
          },
        ],
        outputs: [],
        stateMutability: 'pure',
      };
      expect(createAbiFunctionItem(contractFunc)).toEqual(expectedAbiFunc);
    });

    it('should default stateMutability to view if undefined in ContractFunction', () => {
      const contractFunc: ContractFunction = {
        id: 'anotherFunc_',
        name: 'anotherFunc',
        displayName: 'Another Func',
        inputs: [],
        outputs: [],
        type: 'function',
        // stateMutability is undefined
        modifiesState: false,
      };
      const result = createAbiFunctionItem(contractFunc);
      expect(result.stateMutability).toBe('view');
    });
  });
});
