/**
 * Unit tests for Stellar contract loading logic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  loadStellarContract,
  loadStellarContractFromAddress,
  loadStellarContractWithMetadata,
  transformStellarSpecToSchema,
} from '../../src/contract/loader';

// Mock the Stellar SDK
const mockContractClient = {
  spec: {
    funcs: vi.fn(),
  },
};

const mockFunc = {
  name: vi.fn(),
  inputs: vi.fn(),
  outputs: vi.fn(),
};

const mockInput = {
  name: vi.fn(),
  type: vi.fn(),
};

vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    StrKey: {
      isValidContract: vi.fn(),
    },
    contract: {
      Client: {
        from: vi.fn(),
      },
    },
  };
});

// Mock the logger
vi.mock('@openzeppelin/contracts-ui-builder-utils', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Stellar Contract Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadStellarContractFromAddress', () => {
    it('should load contract from network successfully', async () => {
      const { StrKey, contract } = await import('@stellar/stellar-sdk');

      // Mock valid contract address
      vi.mocked(StrKey.isValidContract).mockReturnValue(true);

      // Mock contract client creation
      vi.mocked(contract.Client.from).mockResolvedValue(mockContractClient);

      // Mock function spec
      mockFunc.name.mockReturnValue('get_balance');
      mockFunc.inputs.mockReturnValue([mockInput]);
      mockFunc.outputs.mockReturnValue([]);
      mockInput.name.mockReturnValue('account');
      // Mock a simple Address type for the input - need to properly structure the mock
      const StellarSdk = await import('@stellar/stellar-sdk');
      const mockScSpecType = {
        switch: vi.fn().mockReturnValue(StellarSdk.xdr.ScSpecType.scSpecTypeAddress()),
      };
      mockInput.type.mockReturnValue(mockScSpecType);

      mockContractClient.spec.funcs.mockReturnValue([mockFunc]);

      const result = await loadStellarContractFromAddress(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG',
        'https://soroban-testnet.stellar.org',
        'Test SDF Network ; September 2015'
      );

      expect(result).toEqual({
        name: 'Soroban Contract CDLZFC3S...',
        ecosystem: 'stellar',
        functions: [
          {
            id: 'get_balance_Address',
            name: 'get_balance',
            displayName: 'Get balance',
            description: 'Soroban function: get_balance',
            inputs: [
              {
                name: 'account',
                type: 'Address',
              },
            ],
            outputs: [],
            type: 'function',
            modifiesState: true,
            stateMutability: 'nonpayable',
          },
        ],
      });
    });

    it('should throw error for invalid contract address', async () => {
      const { StrKey } = await import('@stellar/stellar-sdk');
      vi.mocked(StrKey.isValidContract).mockReturnValue(false);

      await expect(
        loadStellarContractFromAddress('invalid_address', 'https://rpc.url', 'passphrase')
      ).rejects.toThrow('Invalid contract address: invalid_address');
    });

    it('should handle contract client creation failure', async () => {
      const { StrKey, contract } = await import('@stellar/stellar-sdk');
      vi.mocked(StrKey.isValidContract).mockReturnValue(true);
      vi.mocked(contract.Client.from).mockRejectedValue(new Error('Network error'));

      await expect(
        loadStellarContractFromAddress(
          'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG',
          'https://rpc.url',
          'passphrase'
        )
      ).rejects.toThrow('Failed to load contract: Network error');
    });

    it('should handle functions with outputs (view functions)', async () => {
      const { StrKey, contract } = await import('@stellar/stellar-sdk');
      vi.mocked(StrKey.isValidContract).mockReturnValue(true);
      vi.mocked(contract.Client.from).mockResolvedValue(mockContractClient);

      // Mock view function (has outputs, no inputs)
      mockFunc.name.mockReturnValue('get_balance');
      mockFunc.inputs.mockReturnValue([]);
      mockFunc.outputs.mockReturnValue([{}, {}]); // Two outputs

      mockContractClient.spec.funcs.mockReturnValue([mockFunc]);

      const result = await loadStellarContractFromAddress(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG',
        'https://rpc.url',
        'passphrase'
      );

      expect(result.functions[0].stateMutability).toBe('view');
      expect(result.functions[0].modifiesState).toBe(false);
      expect(result.functions[0].outputs).toHaveLength(2);
    });

    it('should handle function parsing errors gracefully', async () => {
      const { StrKey, contract } = await import('@stellar/stellar-sdk');
      vi.mocked(StrKey.isValidContract).mockReturnValue(true);
      vi.mocked(contract.Client.from).mockResolvedValue(mockContractClient);

      // Mock function that throws error during parsing
      const errorFunc = {
        name: vi.fn().mockImplementation(() => {
          throw new Error('Parse error');
        }),
        inputs: vi.fn(),
        outputs: vi.fn(),
      };

      mockContractClient.spec.funcs.mockReturnValue([errorFunc]);

      const result = await loadStellarContractFromAddress(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG',
        'https://rpc.url',
        'passphrase'
      );

      expect(result.functions[0]).toEqual({
        id: 'function_0',
        name: 'function_0',
        displayName: 'Function 0',
        description: 'Failed to parse function 0: Parse error',
        inputs: [],
        outputs: [],
        type: 'function',
        modifiesState: true,
        stateMutability: 'nonpayable',
      });
    });
  });

  describe('loadStellarContract', () => {
    it('should delegate to loadStellarContractFromAddress', async () => {
      const { StrKey, contract } = await import('@stellar/stellar-sdk');
      vi.mocked(StrKey.isValidContract).mockReturnValue(true);
      vi.mocked(contract.Client.from).mockResolvedValue(mockContractClient);
      mockContractClient.spec.funcs.mockReturnValue([]);

      const result = await loadStellarContract(
        { contractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG' },
        {
          sorobanRpcUrl: 'https://rpc.url',
          networkPassphrase: 'passphrase',
        }
      );

      expect(result.schema.ecosystem).toBe('stellar');
      expect(result.schema.functions).toEqual([]);
      expect(result.source).toBe('fetched');
    });
  });

  describe('loadStellarContractWithMetadata', () => {
    it('should return contract with metadata', async () => {
      const { StrKey, contract } = await import('@stellar/stellar-sdk');
      vi.mocked(StrKey.isValidContract).mockReturnValue(true);
      vi.mocked(contract.Client.from).mockResolvedValue(mockContractClient);
      mockContractClient.spec.funcs.mockReturnValue([]);

      const result = await loadStellarContractWithMetadata(
        { contractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG' },
        {
          sorobanRpcUrl: 'https://rpc.url',
          networkPassphrase: 'passphrase',
        }
      );

      expect(result.source).toBe('fetched');
      expect(result.metadata).toEqual({
        fetchedFrom: 'https://rpc.url',
        contractName: 'Soroban Contract CDLZFC3S...',
        fetchTimestamp: expect.any(Date),
      });
      expect(result.schema.address).toBe(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG'
      );
    });

    it('should handle errors gracefully', async () => {
      await expect(
        loadStellarContractWithMetadata(null as unknown as string, '', '')
      ).rejects.toThrow();
    });
  });

  describe('transformStellarSpecToSchema', () => {
    it('should transform spec to schema format', () => {
      const mockSpec = {
        name: 'TestContract',
        functions: [
          {
            id: 'test_func_unknown',
            name: 'test_func',
            displayName: 'Test func',
            description: 'Test function',
            inputs: [],
            outputs: [],
            type: 'function',
            modifiesState: false,
            stateMutability: 'view',
          },
        ],
      };

      const result = transformStellarSpecToSchema(mockSpec, 'CDLZFC3S');

      expect(result).toEqual({
        name: 'TestContract',
        ecosystem: 'stellar',
        functions: mockSpec.functions,
      });
    });

    it('should handle spec without name', () => {
      const mockSpec = {
        functions: [],
      };

      const result = transformStellarSpecToSchema(mockSpec, 'CDLZFC3S');

      expect(result.name).toBe('Soroban Contract CDLZFC3S...');
      expect(result.ecosystem).toBe('stellar');
      expect(result.functions).toEqual([]);
    });

    it('should handle spec without functions', () => {
      const mockSpec = {
        name: 'TestContract',
      };

      const result = transformStellarSpecToSchema(mockSpec, 'CDLZFC3S');

      expect(result.functions).toEqual([]);
    });
  });

  describe('Input/Output parameter handling', () => {
    it('should handle input parsing errors gracefully', async () => {
      const { StrKey, contract } = await import('@stellar/stellar-sdk');
      vi.mocked(StrKey.isValidContract).mockReturnValue(true);
      vi.mocked(contract.Client.from).mockResolvedValue(mockContractClient);

      // Mock function with input that throws error
      const errorInput = {
        name: vi.fn().mockImplementation(() => {
          throw new Error('Input parse error');
        }),
      };

      mockFunc.name.mockReturnValue('test_func');
      mockFunc.inputs.mockReturnValue([errorInput]);
      mockFunc.outputs.mockReturnValue([]);

      mockContractClient.spec.funcs.mockReturnValue([mockFunc]);

      const result = await loadStellarContractFromAddress(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG',
        'https://rpc.url',
        'passphrase'
      );

      expect(result.functions[0].inputs[0]).toEqual({
        name: 'param_0',
        type: 'unknown',
      });
    });

    it('should handle output parsing errors gracefully', async () => {
      const { StrKey, contract } = await import('@stellar/stellar-sdk');
      vi.mocked(StrKey.isValidContract).mockReturnValue(true);
      vi.mocked(contract.Client.from).mockResolvedValue(mockContractClient);

      mockFunc.name.mockReturnValue('test_func');
      mockFunc.inputs.mockReturnValue([]);
      mockFunc.outputs.mockReturnValue([{}, {}]); // Two outputs that will use fallback names

      mockContractClient.spec.funcs.mockReturnValue([mockFunc]);

      const result = await loadStellarContractFromAddress(
        'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCM2SG',
        'https://rpc.url',
        'passphrase'
      );

      expect(result.functions[0].outputs).toEqual([
        { name: 'result_0', type: 'unknown' },
        { name: 'result_1', type: 'unknown' },
      ]);
    });
  });
});
