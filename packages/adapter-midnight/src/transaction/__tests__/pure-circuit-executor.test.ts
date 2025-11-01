import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContractSchema } from '@openzeppelin/ui-builder-types';

import type { MidnightContractArtifacts, WriteContractParameters } from '../../types';
import * as circuitTypeUtils from '../../utils/circuit-type-utils';
import { executePureCircuit } from '../pure-circuit-executor';
import * as witnessEvaluator from '../witness-evaluator';

// Mock dependencies
vi.mock('../witness-evaluator');
vi.mock('../../utils/circuit-type-utils');
vi.mock('@midnight-ntwrk/compact-runtime', () => ({
  default: { versionString: '1.0.0' },
  versionString: '1.0.0',
}));
vi.mock('@openzeppelin/ui-builder-utils', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('executePureCircuit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(witnessEvaluator.evaluateWitnessCode).mockReturnValue({ witness1: () => {} });
    vi.mocked(circuitTypeUtils.isPureCircuit).mockReturnValue(true);
  });

  const createMockContractSchema = (functionName: string): ContractSchema => ({
    name: 'TestContract',
    ecosystem: 'midnight',
    address: '0200test',
    functions: [
      {
        id: functionName,
        name: functionName,
        displayName: functionName.charAt(0).toUpperCase() + functionName.slice(1),
        inputs: [],
        outputs: [],
        modifiesState: false,
        type: 'function',
        stateMutability: 'pure',
      },
    ],
    events: [],
    metadata: {},
  });

  const createMockArtifacts = (contractModule: string): MidnightContractArtifacts => ({
    contractModule,
    contractDefinition: 'export type PureCircuits = { testCircuit(): any; };',
    contractAddress: '0200test',
    witnessCode: 'module.exports = { witness1: () => {} };',
    privateStateId: 'test-state',
  });

  const createMockTransactionData = (functionName: string): WriteContractParameters => ({
    functionName,
    contractAddress: '0200test',
    args: [1, 2, 3],
    argTypes: ['number', 'number', 'number'],
    transactionOptions: {},
  });

  describe('successful execution', () => {
    it('should execute a pure circuit successfully', async () => {
      const functionName = 'testCircuit';
      const expectedResult = { result: 'success' };

      const contractModule = `
        module.exports = {
          pureCircuits: {
            ${functionName}: function(a, b, c) {
              return { result: 'success' };
            }
          }
        };
      `;

      const artifacts = createMockArtifacts(contractModule);
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      const result = await executePureCircuit(transactionData, schema, artifacts);

      expect(result).toEqual(expectedResult);
    });

    it('should handle pure circuit with parameters', async () => {
      const functionName = 'computeWithValue';
      const expectedResult = 42;

      const contractModule = `
        module.exports = {
          pureCircuits: {
            ${functionName}: function(value) {
              return value * 2;
            }
          }
        };
      `;

      const artifacts = createMockArtifacts(contractModule);
      const schema: ContractSchema = {
        ...createMockContractSchema(functionName),
        functions: [
          {
            id: functionName,
            name: functionName,
            displayName: 'ComputeWithValue',
            inputs: [{ name: 'value', type: 'number' }],
            outputs: [],
            modifiesState: false,
            type: 'function',
            stateMutability: 'pure',
          },
        ],
      };
      const transactionData: WriteContractParameters = {
        functionName,
        contractAddress: '0200test',
        args: [21],
        argTypes: ['number'],
        transactionOptions: {},
      };

      const result = await executePureCircuit(transactionData, schema, artifacts);

      expect(result).toBe(expectedResult);
    });

    it('should process multi-line module code correctly', async () => {
      const functionName = 'testCircuit';
      const expectedResult = 'success';

      const contractModule = `
        module.exports = {
          pureCircuits: {
            ${functionName}: function() {
              return 'success';
            }
          }
        };
      `.replace(/\n\s*\./g, '.');

      const artifacts = createMockArtifacts(contractModule);
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      const result = await executePureCircuit(transactionData, schema, artifacts);

      expect(result).toBe(expectedResult);
    });

    it('should pass correct arguments to pure circuit function', async () => {
      const functionName = 'testCircuit';

      const contractModule = `
        module.exports = {
          pureCircuits: {
            ${functionName}: function(a, b, c) {
              return { received: [a, b, c] };
            }
          }
        };
      `;

      const artifacts = createMockArtifacts(contractModule);
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      const result = (await executePureCircuit(transactionData, schema, artifacts)) as {
        received: unknown[];
      };

      expect(result.received).toEqual([1, 2, 3]);
    });
  });

  describe('validation errors', () => {
    it('should throw error if function not found in schema', async () => {
      const functionName = 'nonExistent';
      const contractModule = `module.exports = { pureCircuits: { ${functionName}: () => {} } };`;
      const artifacts = createMockArtifacts(contractModule);
      const schema = createMockContractSchema('differentFunction');
      const transactionData = createMockTransactionData(functionName);

      await expect(executePureCircuit(transactionData, schema, artifacts)).rejects.toThrow(
        `Function ${functionName} not found in contract schema`
      );
    });

    it('should throw error if function is not a pure circuit', async () => {
      const functionName = 'testCircuit';
      const contractModule = `module.exports = { pureCircuits: { ${functionName}: () => {} } };`;
      const artifacts = createMockArtifacts(contractModule);
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      vi.mocked(circuitTypeUtils.isPureCircuit).mockReturnValueOnce(false);

      await expect(executePureCircuit(transactionData, schema, artifacts)).rejects.toThrow(
        `Function ${functionName} is not a pure circuit`
      );
    });

    it('should throw error if contract module is missing', async () => {
      const functionName = 'testCircuit';
      const artifacts: MidnightContractArtifacts = {
        ...createMockArtifacts(''),
        contractModule: '',
      };
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      await expect(executePureCircuit(transactionData, schema, artifacts)).rejects.toThrow(
        'Contract module is required for pure circuit execution'
      );
    });

    it('should throw error if contract module does not export pureCircuits', async () => {
      const functionName = 'testCircuit';
      const contractModule = `module.exports = { otherExport: {} };`;
      const artifacts = createMockArtifacts(contractModule);
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      await expect(executePureCircuit(transactionData, schema, artifacts)).rejects.toThrow(
        'Contract module does not export pureCircuits'
      );
    });

    it('should throw error if pure circuit function not found in exports', async () => {
      const functionName = 'nonExistent';
      const contractModule = `module.exports = { pureCircuits: { otherCircuit: () => {} } };`;
      const artifacts = createMockArtifacts(contractModule);
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      await expect(executePureCircuit(transactionData, schema, artifacts)).rejects.toThrow(
        `Pure circuit ${functionName} not found or is not a function`
      );
    });

    it('should throw error if pure circuit export is not a function', async () => {
      const functionName = 'testCircuit';
      const contractModule = `module.exports = { pureCircuits: { ${functionName}: 'not a function' } };`;
      const artifacts = createMockArtifacts(contractModule);
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      await expect(executePureCircuit(transactionData, schema, artifacts)).rejects.toThrow(
        `Pure circuit ${functionName} not found or is not a function`
      );
    });
  });

  describe('execution errors', () => {
    it('should throw error if pure circuit execution throws', async () => {
      const functionName = 'testCircuit';
      const errorMessage = 'Circuit execution failed';

      const contractModule = `
        module.exports = {
          pureCircuits: {
            ${functionName}: function() {
              throw new Error('${errorMessage}');
            }
          }
        };
      `;

      const artifacts = createMockArtifacts(contractModule);
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      await expect(executePureCircuit(transactionData, schema, artifacts)).rejects.toThrow(
        `Pure circuit execution failed: ${errorMessage}`
      );
    });

    it('should handle unknown errors during execution', async () => {
      const functionName = 'testCircuit';

      const contractModule = `
        module.exports = {
          pureCircuits: {
            ${functionName}: function() {
              throw 'String error';
            }
          }
        };
      `;

      const artifacts = createMockArtifacts(contractModule);
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      await expect(executePureCircuit(transactionData, schema, artifacts)).rejects.toThrow(
        'Pure circuit execution failed: Unknown error'
      );
    });
  });

  describe('module evaluation', () => {
    it('should correctly evaluate module exports', async () => {
      const functionName = 'testCircuit';
      const expectedResult = 'exported result';

      const contractModule = `
        module.exports = {
          pureCircuits: {
            ${functionName}: () => '${expectedResult}'
          },
          otherExport: 'ignored'
        };
      `;

      const artifacts = createMockArtifacts(contractModule);
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      const result = await executePureCircuit(transactionData, schema, artifacts);

      expect(result).toBe(expectedResult);
    });

    it('should handle module with require statements', async () => {
      const functionName = 'testCircuit';
      const expectedResult = 'runtime loaded';

      const contractModule = `
        const runtime = require('@midnight-ntwrk/compact-runtime');
        module.exports = {
          pureCircuits: {
            ${functionName}: () => '${expectedResult}'
          }
        };
      `;

      const artifacts = createMockArtifacts(contractModule);
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      const result = await executePureCircuit(transactionData, schema, artifacts);

      expect(result).toBe(expectedResult);
    });
  });

  describe('witness code evaluation', () => {
    it('should evaluate witness code before executing circuit', async () => {
      const functionName = 'testCircuit';
      const mockWitnesses = { witness1: () => {}, witness2: () => {} };

      vi.mocked(witnessEvaluator.evaluateWitnessCode).mockReturnValueOnce(mockWitnesses);

      const contractModule = `module.exports = { pureCircuits: { ${functionName}: () => 'success' } };`;
      const artifacts = createMockArtifacts(contractModule);
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      await executePureCircuit(transactionData, schema, artifacts);

      expect(witnessEvaluator.evaluateWitnessCode).toHaveBeenCalledWith(artifacts.witnessCode);
    });

    it('should handle missing witness code', async () => {
      const functionName = 'testCircuit';
      const contractModule = `module.exports = { pureCircuits: { ${functionName}: () => 'success' } };`;
      const artifacts: MidnightContractArtifacts = {
        ...createMockArtifacts(contractModule),
        witnessCode: '',
      };
      const schema = createMockContractSchema(functionName);
      const transactionData = createMockTransactionData(functionName);

      vi.mocked(witnessEvaluator.evaluateWitnessCode).mockReturnValueOnce({});

      await executePureCircuit(transactionData, schema, artifacts);

      expect(witnessEvaluator.evaluateWitnessCode).toHaveBeenCalledWith('');
    });
  });
});
