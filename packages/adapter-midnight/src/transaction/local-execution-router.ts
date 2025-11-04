import type { ContractSchema, TransactionStatusUpdate } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import type { MidnightContractArtifacts, WriteContractParameters } from '../types';
import { isPureCircuit } from '../utils/circuit-type-utils';
import { parseMidnightContractInterface } from '../utils/schema-parser';
import { executePureCircuit } from './pure-circuit-executor';

const SYSTEM_LOG_TAG = 'local-execution-router';

/**
 * Gets contract schema from artifacts by parsing the contract definition
 *
 * @param artifacts - Contract artifacts containing contract definition
 * @returns Contract schema parsed from artifacts
 */
async function getContractSchemaFromArtifacts(
  artifacts: MidnightContractArtifacts
): Promise<ContractSchema> {
  if (!artifacts.contractDefinition) {
    throw new Error('Contract definition is required for local execution');
  }

  const parsed = parseMidnightContractInterface(artifacts.contractDefinition);

  return {
    name: 'MidnightContract',
    ecosystem: 'midnight',
    address: artifacts.contractAddress || '',
    functions: parsed.functions,
    events: parsed.events,
    metadata: parsed.metadata,
  };
}

/**
 * Gets function details from artifacts by parsing the contract definition
 *
 * @param artifacts - Contract artifacts containing contract definition
 * @param functionName - Name of the function to find
 * @returns Function details if found, null otherwise
 */
async function getFunctionFromArtifacts(
  artifacts: MidnightContractArtifacts,
  functionName: string
): Promise<ContractSchema['functions'][0] | null> {
  if (!artifacts.contractDefinition) {
    return null;
  }
  const { functions } = parseMidnightContractInterface(artifacts.contractDefinition);
  return functions.find((fn) => fn.id === functionName || fn.name === functionName) || null;
}

/**
 * Executes a function locally if it can execute locally (e.g., pure circuits)
 *
 * This function handles the complete lifecycle of local execution:
 * - Validates that the function can execute locally
 * - Gets contract schema from artifacts
 * - Executes the function locally
 * - Handles status updates and errors
 *
 * @param transactionData - The transaction data containing function name and args
 * @param artifacts - Contract artifacts
 * @param onStatusChange - Callback for status updates
 * @returns Transaction hash and result if execution was local, null otherwise
 */
export async function executeLocallyIfPossible(
  transactionData: WriteContractParameters,
  artifacts: MidnightContractArtifacts | null,
  onStatusChange: (status: string, details: TransactionStatusUpdate) => void
): Promise<{ txHash: string; result?: unknown } | null> {
  if (!artifacts || !transactionData.functionName) {
    return null;
  }

  const functionDetails = await getFunctionFromArtifacts(artifacts, transactionData.functionName);

  if (!functionDetails || !isPureCircuit(functionDetails)) {
    return null;
  }

  logger.info(SYSTEM_LOG_TAG, `Function ${transactionData.functionName} can execute locally`);

  // Get contract schema from artifacts
  const contractSchema = await getContractSchemaFromArtifacts(artifacts);

  onStatusChange('pendingSignature', {
    title: 'Executing Locally',
    message: 'Function is executing locally without blockchain interaction...',
  });

  try {
    const result = await executePureCircuit(transactionData, contractSchema, artifacts);

    onStatusChange('success', {
      title: 'Execution Complete',
      message: 'Function executed successfully.',
    });

    // Return a placeholder txHash for local execution
    return {
      txHash: `local_execution_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      result,
    };
  } catch (error) {
    onStatusChange('error', {
      title: 'Execution Failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
    throw error;
  }
}
