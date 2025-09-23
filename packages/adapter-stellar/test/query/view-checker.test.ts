/**
 * Unit tests for Stellar view function checking logic.
 */
import { describe, expect, it } from 'vitest';

import type { ContractFunction, ContractSchema } from '@openzeppelin/ui-builder-types';

import { getStellarWritableFunctions, isStellarViewFunction } from '../../src/query/view-checker';

describe('Stellar View Function Checker', () => {
  describe('isStellarViewFunction', () => {
    it('should return true for view functions', () => {
      const viewFunction: ContractFunction = {
        id: 'get_balance_',
        name: 'get_balance',
        displayName: 'Get Balance',
        inputs: [],
        outputs: [{ name: 'balance', type: 'i128', displayName: 'Balance' }],
        type: 'function',
        stateMutability: 'view',
        modifiesState: false,
      };
      expect(isStellarViewFunction(viewFunction)).toBe(true);
    });

    it('should return true for pure functions', () => {
      const pureFunction: ContractFunction = {
        id: 'calculate_',
        name: 'calculate',
        displayName: 'Calculate',
        inputs: [{ name: 'x', type: 'u32', displayName: 'X' }],
        outputs: [{ name: 'result', type: 'u32', displayName: 'Result' }],
        type: 'function',
        stateMutability: 'pure',
        modifiesState: false,
      };
      expect(isStellarViewFunction(pureFunction)).toBe(true);
    });

    it('should return false for payable functions', () => {
      const payableFunction: ContractFunction = {
        id: 'transfer_address_u64',
        name: 'transfer',
        displayName: 'Transfer',
        inputs: [
          { name: 'to', type: 'Address', displayName: 'To' },
          { name: 'amount', type: 'u64', displayName: 'Amount' },
        ],
        outputs: [],
        type: 'function',
        stateMutability: 'payable',
        modifiesState: true,
      };
      expect(isStellarViewFunction(payableFunction)).toBe(false);
    });

    it('should return false for nonpayable functions', () => {
      const nonpayableFunction: ContractFunction = {
        id: 'set_admin_address',
        name: 'set_admin',
        displayName: 'Set Admin',
        inputs: [{ name: 'admin', type: 'Address', displayName: 'Admin' }],
        outputs: [],
        type: 'function',
        stateMutability: 'nonpayable',
        modifiesState: true,
      };
      expect(isStellarViewFunction(nonpayableFunction)).toBe(false);
    });

    it('should return false for functions without stateMutability', () => {
      const functionWithoutStateMutability: ContractFunction = {
        id: 'unknown_function_',
        name: 'unknown_function',
        displayName: 'Unknown Function',
        inputs: [],
        outputs: [],
        type: 'function',
        // stateMutability is undefined
        modifiesState: true,
      };
      expect(isStellarViewFunction(functionWithoutStateMutability)).toBe(false);
    });

    it('should handle functions based on modifiesState when stateMutability is missing', () => {
      const readOnlyFunction: ContractFunction = {
        id: 'read_only_',
        name: 'read_only',
        displayName: 'Read Only',
        inputs: [],
        outputs: [{ name: 'value', type: 'u32', displayName: 'Value' }],
        type: 'function',
        // stateMutability is undefined
        modifiesState: false,
      };
      expect(isStellarViewFunction(readOnlyFunction)).toBe(true);
    });
  });

  describe('getStellarWritableFunctions', () => {
    const mockContractSchema: ContractSchema = {
      ecosystem: 'stellar',
      name: 'TestContract',
      address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG',
      functions: [
        {
          id: 'get_balance_',
          name: 'get_balance',
          displayName: 'Get Balance',
          inputs: [],
          outputs: [{ name: 'balance', type: 'i128', displayName: 'Balance' }],
          type: 'function',
          stateMutability: 'view',
          modifiesState: false,
        },
        {
          id: 'transfer_address_u64',
          name: 'transfer',
          displayName: 'Transfer',
          inputs: [
            { name: 'to', type: 'Address', displayName: 'To' },
            { name: 'amount', type: 'u64', displayName: 'Amount' },
          ],
          outputs: [],
          type: 'function',
          stateMutability: 'nonpayable',
          modifiesState: true,
        },
        {
          id: 'calculate_u32',
          name: 'calculate',
          displayName: 'Calculate',
          inputs: [{ name: 'x', type: 'u32', displayName: 'X' }],
          outputs: [{ name: 'result', type: 'u32', displayName: 'Result' }],
          type: 'function',
          stateMutability: 'pure',
          modifiesState: false,
        },
        {
          id: 'set_admin_address',
          name: 'set_admin',
          displayName: 'Set Admin',
          inputs: [{ name: 'admin', type: 'Address', displayName: 'Admin' }],
          outputs: [],
          type: 'function',
          stateMutability: 'nonpayable',
          modifiesState: true,
        },
      ],
    };

    it('should return only writable functions', () => {
      const writableFunctions = getStellarWritableFunctions(mockContractSchema);
      expect(writableFunctions).toHaveLength(2);
      expect(writableFunctions[0].name).toBe('transfer');
      expect(writableFunctions[1].name).toBe('set_admin');
    });

    it('should return empty array for contract with only view functions', () => {
      const viewOnlySchema: ContractSchema = {
        ecosystem: 'stellar',
        name: 'ViewOnlyContract',
        address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG',
        functions: [
          {
            id: 'get_balance_',
            name: 'get_balance',
            displayName: 'Get Balance',
            inputs: [],
            outputs: [{ name: 'balance', type: 'i128', displayName: 'Balance' }],
            type: 'function',
            stateMutability: 'view',
            modifiesState: false,
          },
          {
            id: 'calculate_u32',
            name: 'calculate',
            displayName: 'Calculate',
            inputs: [{ name: 'x', type: 'u32', displayName: 'X' }],
            outputs: [{ name: 'result', type: 'u32', displayName: 'Result' }],
            type: 'function',
            stateMutability: 'pure',
            modifiesState: false,
          },
        ],
      };
      const writableFunctions = getStellarWritableFunctions(viewOnlySchema);
      expect(writableFunctions).toHaveLength(0);
    });

    it('should return all functions for contract with only writable functions', () => {
      const writableOnlySchema: ContractSchema = {
        ecosystem: 'stellar',
        name: 'WritableOnlyContract',
        address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG',
        functions: [
          {
            id: 'transfer_address_u64',
            name: 'transfer',
            displayName: 'Transfer',
            inputs: [
              { name: 'to', type: 'Address', displayName: 'To' },
              { name: 'amount', type: 'u64', displayName: 'Amount' },
            ],
            outputs: [],
            type: 'function',
            stateMutability: 'nonpayable',
            modifiesState: true,
          },
          {
            id: 'set_admin_address',
            name: 'set_admin',
            displayName: 'Set Admin',
            inputs: [{ name: 'admin', type: 'Address', displayName: 'Admin' }],
            outputs: [],
            type: 'function',
            stateMutability: 'nonpayable',
            modifiesState: true,
          },
        ],
      };
      const writableFunctions = getStellarWritableFunctions(writableOnlySchema);
      expect(writableFunctions).toHaveLength(2);
      expect(writableFunctions[0].name).toBe('transfer');
      expect(writableFunctions[1].name).toBe('set_admin');
    });

    it('should handle empty functions array', () => {
      const emptySchema: ContractSchema = {
        ecosystem: 'stellar',
        name: 'EmptyContract',
        address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG',
        functions: [],
      };
      const writableFunctions = getStellarWritableFunctions(emptySchema);
      expect(writableFunctions).toHaveLength(0);
    });
  });
});
