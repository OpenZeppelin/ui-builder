import type { ContractSchema } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import type { MidnightContractArtifacts, WriteContractParameters } from '../types';
import { isPureCircuit } from '../utils/circuit-type-utils';
import { evaluateWitnessCode } from './witness-evaluator';

const SYSTEM_LOG_TAG = 'PureCircuitExecutor';

/**
 * Executes a pure circuit locally without blockchain interaction
 *
 * Pure circuits run entirely client-side and return results immediately.
 * They don't require wallet connection or transaction submission.
 *
 * @param transactionData - The transaction data containing function name and args
 * @param contractSchema - The contract schema to find function details
 * @param artifacts - Contract artifacts containing contract module
 * @returns The execution result formatted for display
 */
export async function executePureCircuit(
  transactionData: WriteContractParameters,
  contractSchema: ContractSchema,
  artifacts: MidnightContractArtifacts
): Promise<unknown> {
  const { functionName, args } = transactionData;

  logger.info(SYSTEM_LOG_TAG, `Executing pure circuit: ${functionName}`, {
    argsLength: args.length,
  });

  // Step 1: Verify function is actually a pure circuit
  const functionDetails = contractSchema.functions.find((fn) => fn.id === functionName);
  if (!functionDetails) {
    throw new Error(`Function ${functionName} not found in contract schema`);
  }

  if (!isPureCircuit(functionDetails)) {
    throw new Error(
      `Function ${functionName} is not a pure circuit. Pure circuits must have stateMutability === 'pure'`
    );
  }

  // Step 2: Evaluate witness code
  logger.debug(SYSTEM_LOG_TAG, 'Step 1: Evaluating witness code');
  const witnessCode = artifacts.witnessCode || '';
  const baseWitnesses = evaluateWitnessCode(witnessCode);

  // Step 3: Load and inject compact-runtime
  logger.debug(SYSTEM_LOG_TAG, 'Step 2: Loading compact-runtime');
  const runtimeNs = await import('@midnight-ntwrk/compact-runtime');
  const compactRuntime = (runtimeNs as Record<string, unknown>)?.default ?? runtimeNs;

  // Step 4: Evaluate contract module to get exports (pureCircuits is exported, not on instance)
  // Reuse the same evaluation logic as evaluateContractModule but extract exports
  logger.debug(SYSTEM_LOG_TAG, 'Step 3: Evaluating contract module for exports');
  const contractModule = artifacts.contractModule || '';
  if (!contractModule) {
    throw new Error('Contract module is required for pure circuit execution');
  }

  // Pre-process the contract module to fix multi-line statement issues (same as evaluateContractModule)
  let processedModule = contractModule;
  processedModule = processedModule.replace(/\n\s*\./g, '.');
  processedModule = processedModule.replace(/\n\s*\[/g, '[');

  // Create sandbox exactly like evaluateContractModule
  const moduleExports = {};
  const sandbox = {
    module: { exports: moduleExports },
    exports: moduleExports,
    require: function (id: string) {
      logger.debug(SYSTEM_LOG_TAG, `Contract requires module: ${id}`);
      if (id === '@midnight-ntwrk/compact-runtime') {
        return compactRuntime;
      }
      if (globalThis.require) {
        const result = globalThis.require(id);
        logger.debug(SYSTEM_LOG_TAG, `Module ${id} loaded:`, result ? 'success' : 'null/undefined');
        return result;
      }
      throw new Error('require is not available for module: ' + id);
    },
    process: {
      env: { NODE_ENV: 'production' },
      version: 'v16.0.0',
      versions: {
        node: '16.0.0',
        v8: '9.0.0',
        modules: '93',
      },
      platform: 'browser',
      arch: 'wasm32',
      release: {
        name: 'node',
        lts: 'Gallium',
      },
    },
    global: globalThis,
    globalThis: globalThis,
    __dirname: '/',
    __filename: '/contract.cjs',
    console: console,
    Buffer: globalThis.Buffer || {
      from: (data: string | Uint8Array, encoding?: string) => {
        let uint8Array: Uint8Array;
        if (typeof data === 'string') {
          if (encoding === 'hex') {
            const bytes = [];
            for (let i = 0; i < data.length; i += 2) {
              bytes.push(parseInt(data.substring(i, i + 2), 16));
            }
            uint8Array = new Uint8Array(bytes);
          } else {
            uint8Array = new TextEncoder().encode(data);
          }
        } else {
          uint8Array = new Uint8Array(data as Uint8Array);
        }
        (uint8Array as Uint8Array & { toString(encoding?: string): string }).toString = (
          encoding?: string
        ) => {
          if (encoding === 'hex') {
            return Array.from(uint8Array)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('');
          }
          return new TextDecoder().decode(uint8Array);
        };
        return uint8Array;
      },
      alloc: (size: number) => new Uint8Array(size),
      isBuffer: (obj: unknown) => obj instanceof Uint8Array,
    },
    witnesses: baseWitnesses,
  };

  // Evaluate to get exports (same pattern as evaluateContractModule)
  const evaluator = new Function(
    ...Object.keys(sandbox),
    processedModule + '\nreturn module.exports;'
  );
  const contractExports = evaluator(...Object.values(sandbox)) as Record<string, unknown>;

  logger.debug(
    SYSTEM_LOG_TAG,
    `Contract exports keys: ${contractExports ? Object.keys(contractExports).join(', ') : 'null'}`
  );

  // Step 5: Get pure circuits from exports
  const pureCircuits = contractExports.pureCircuits as Record<string, unknown> | undefined;

  if (!pureCircuits) {
    logger.error(SYSTEM_LOG_TAG, 'Available exports:', Object.keys(contractExports));
    throw new Error(
      'Contract module does not export pureCircuits. Available exports: ' +
        Object.keys(contractExports).join(', ')
    );
  }

  logger.debug(
    SYSTEM_LOG_TAG,
    `Found pureCircuits with ${Object.keys(pureCircuits).length} circuits: ${Object.keys(pureCircuits).join(', ')}`
  );

  const circuitFunction = pureCircuits[functionName] as
    | ((...args: unknown[]) => unknown)
    | undefined;

  if (!circuitFunction || typeof circuitFunction !== 'function') {
    logger.error(
      SYSTEM_LOG_TAG,
      `Available pure circuits: ${Object.keys(pureCircuits).join(', ')}`
    );
    throw new Error(
      `Pure circuit ${functionName} not found or is not a function. Available: ${Object.keys(pureCircuits).join(', ')}`
    );
  }

  // Step 6: Execute the pure circuit
  logger.debug(
    SYSTEM_LOG_TAG,
    `Step 4: Executing pure circuit ${functionName} with ${args.length} arguments`
  );
  try {
    const result = circuitFunction(...args);
    logger.info(SYSTEM_LOG_TAG, `Pure circuit execution complete: ${functionName}`);
    return result;
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, `Pure circuit execution failed: ${functionName}`, error);
    throw new Error(
      `Pure circuit execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
