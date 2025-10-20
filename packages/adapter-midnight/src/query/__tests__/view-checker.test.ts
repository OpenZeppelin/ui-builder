import { describe, expect, it } from 'vitest';

import type { ContractFunction } from '@openzeppelin/ui-builder-types';

import { isMidnightViewFunction } from '../view-checker';

describe('isMidnightViewFunction', () => {
  describe('View Functions (read-only)', () => {
    it('should return true for view/query functions (modifiesState = false)', () => {
      const viewFunction: ContractFunction = {
        id: 'query_balance',
        name: 'balance',
        displayName: 'Balance',
        type: 'query',
        modifiesState: false,
        inputs: [],
        outputs: [{ name: 'balance', type: 'u64' }],
      };

      expect(isMidnightViewFunction(viewFunction)).toBe(true);
    });

    it('should return true for parameter-less view functions', () => {
      const parameterlessView: ContractFunction = {
        id: 'query_total_supply',
        name: 'total_supply',
        displayName: 'Total Supply',
        type: 'query',
        modifiesState: false,
        inputs: [],
        outputs: [{ name: 'supply', type: 'u256' }],
      };

      expect(isMidnightViewFunction(parameterlessView)).toBe(true);
    });

    it('should return true for view functions with parameters', () => {
      const viewWithParams: ContractFunction = {
        id: 'query_balance_of',
        name: 'balance_of',
        displayName: 'Balance Of',
        type: 'query',
        modifiesState: false,
        inputs: [{ name: 'account', type: 'Address' }],
        outputs: [{ name: 'balance', type: 'u64' }],
      };

      expect(isMidnightViewFunction(viewWithParams)).toBe(true);
    });

    it('should return true for view functions with multiple parameters', () => {
      const multiParamView: ContractFunction = {
        id: 'query_allowed',
        name: 'allowed',
        displayName: 'Allowed',
        type: 'query',
        modifiesState: false,
        inputs: [
          { name: 'owner', type: 'Address' },
          { name: 'spender', type: 'Address' },
        ],
        outputs: [{ name: 'amount', type: 'u64' }],
      };

      expect(isMidnightViewFunction(multiParamView)).toBe(true);
    });

    it('should return true for view functions with multiple outputs', () => {
      const multiOutputView: ContractFunction = {
        id: 'query_details',
        name: 'details',
        displayName: 'Details',
        type: 'query',
        modifiesState: false,
        inputs: [],
        outputs: [
          { name: 'total', type: 'u256' },
          { name: 'available', type: 'u256' },
        ],
      };

      expect(isMidnightViewFunction(multiOutputView)).toBe(true);
    });
  });

  describe('State-Modifying Functions (write)', () => {
    it('should return false for write/circuit functions (modifiesState = true)', () => {
      const writeFunction: ContractFunction = {
        id: 'circuit_transfer',
        name: 'transfer',
        displayName: 'Transfer',
        type: 'circuit',
        modifiesState: true,
        inputs: [
          { name: 'recipient', type: 'Address' },
          { name: 'amount', type: 'u64' },
        ],
        outputs: [],
      };

      expect(isMidnightViewFunction(writeFunction)).toBe(false);
    });

    it('should return false for mint function', () => {
      const mintFunction: ContractFunction = {
        id: 'circuit_mint',
        name: 'mint',
        displayName: 'Mint',
        type: 'circuit',
        modifiesState: true,
        inputs: [
          { name: 'to', type: 'Address' },
          { name: 'amount', type: 'u256' },
        ],
        outputs: [],
      };

      expect(isMidnightViewFunction(mintFunction)).toBe(false);
    });

    it('should return false for burn function', () => {
      const burnFunction: ContractFunction = {
        id: 'circuit_burn',
        name: 'burn',
        displayName: 'Burn',
        type: 'circuit',
        modifiesState: true,
        inputs: [{ name: 'amount', type: 'u256' }],
        outputs: [],
      };

      expect(isMidnightViewFunction(burnFunction)).toBe(false);
    });

    it('should return false for approve function', () => {
      const approveFunction: ContractFunction = {
        id: 'circuit_approve',
        name: 'approve',
        displayName: 'Approve',
        type: 'circuit',
        modifiesState: true,
        inputs: [
          { name: 'spender', type: 'Address' },
          { name: 'amount', type: 'u64' },
        ],
        outputs: [],
      };

      expect(isMidnightViewFunction(approveFunction)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle functions with no inputs and no outputs', () => {
      const emptyFunction: ContractFunction = {
        id: 'query_empty',
        name: 'empty',
        displayName: 'Empty',
        type: 'query',
        modifiesState: false,
        inputs: [],
        outputs: [],
      };

      expect(isMidnightViewFunction(emptyFunction)).toBe(true);
    });

    it('should handle complex nested output types', () => {
      const complexView: ContractFunction = {
        id: 'query_complex',
        name: 'complex',
        displayName: 'Complex',
        type: 'query',
        modifiesState: false,
        inputs: [],
        outputs: [
          {
            name: 'data',
            type: 'Vec<Struct<{ balance: u64, owner: Address }>>',
          },
        ],
      };

      expect(isMidnightViewFunction(complexView)).toBe(true);
    });

    it('should handle Option types in inputs', () => {
      const optionView: ContractFunction = {
        id: 'query_optional',
        name: 'optional',
        displayName: 'Optional',
        type: 'query',
        modifiesState: false,
        inputs: [{ name: 'maybe_address', type: 'Option<Address>' }],
        outputs: [{ name: 'result', type: 'bool' }],
      };

      expect(isMidnightViewFunction(optionView)).toBe(true);
    });
  });
});
