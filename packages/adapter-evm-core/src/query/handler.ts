import { isAddress } from 'viem';

import type { ContractSchema, FunctionParameter } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { createAbiFunctionItem } from '../abi/transformer';
import { parseEvmInput } from '../transform/input-parser';
import type { EvmCompatibleNetworkConfig } from '../types/network';
import { createEvmPublicClient } from '../utils/public-client';
import { isEvmViewFunction } from './view-checker';

/**
 * Core logic for querying an EVM view function.
 * This is a stateless version that accepts an RPC URL directly.
 *
 * @param contractAddress - Address of the contract.
 * @param functionId - ID of the function to query.
 * @param params - Raw parameters for the function call.
 * @param schema - Contract schema with function definitions.
 * @param rpcUrl - RPC URL to use for the query.
 * @param networkConfig - Optional EVM-compatible network configuration for chain metadata (works with any ecosystem).
 * @returns The decoded result of the view function call.
 */
export async function queryEvmViewFunction(
  contractAddress: string,
  functionId: string,
  params: unknown[],
  schema: ContractSchema,
  rpcUrl: string,
  networkConfig?: EvmCompatibleNetworkConfig
): Promise<unknown> {
  logger.info(
    'queryEvmViewFunction',
    `Querying view function: ${functionId} on ${contractAddress}`,
    { params }
  );

  try {
    // --- Validate Address --- //
    if (!contractAddress || !isAddress(contractAddress)) {
      throw new Error(`Invalid contract address provided: ${contractAddress}`);
    }

    // --- Get Function Details --- //
    const functionDetails = schema.functions.find((fn) => fn.id === functionId);
    if (!functionDetails) {
      throw new Error(`Function with ID ${functionId} not found in contract schema.`);
    }
    if (!isEvmViewFunction(functionDetails)) {
      throw new Error(`Function ${functionDetails.name} is not a view function.`);
    }

    // --- Parse Input Parameters --- //
    const expectedInputs: readonly FunctionParameter[] = functionDetails.inputs;
    if (params.length !== expectedInputs.length) {
      throw new Error(
        `Incorrect number of parameters provided for ${functionDetails.name}. Expected ${expectedInputs.length}, got ${params.length}.`
      );
    }
    const args = expectedInputs.map((inputParam: FunctionParameter, index: number) => {
      let rawValue = params[index];
      // If the ABI parameter type is an array and the incoming raw value is an actual array,
      // stringify it to align with parseEvmInput expectations for top-level arrays.
      if (
        typeof inputParam.type === 'string' &&
        inputParam.type.endsWith('[]') &&
        Array.isArray(rawValue)
      ) {
        rawValue = JSON.stringify(rawValue);
      }
      return parseEvmInput(inputParam, rawValue, false);
    });
    logger.debug('queryEvmViewFunction', 'Parsed Args for readContract:', args);

    // --- Create Public Client --- //
    const publicClient = createEvmPublicClient(rpcUrl, networkConfig?.viemChain);

    // --- Construct ABI Item --- //
    const functionAbiItem = createAbiFunctionItem(functionDetails);

    logger.debug(
      'queryEvmViewFunction',
      `[Query ${functionDetails.name}] Calling readContract with ABI:`,
      functionAbiItem,
      'Args:',
      args
    );

    // --- Call readContract --- //
    let decodedResult: unknown;
    try {
      decodedResult = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [functionAbiItem],
        functionName: functionDetails.name,
        args: args,
      });
    } catch (readError) {
      logger.error(
        'queryEvmViewFunction',
        `[Query ${functionDetails.name}] publicClient.readContract specific error:`,
        readError
      );
      throw new Error(
        `Viem readContract failed for ${functionDetails.name}: ${(readError as Error).message}`
      );
    }

    logger.debug(
      'queryEvmViewFunction',
      `[Query ${functionDetails.name}] Raw decoded result:`,
      decodedResult
    );

    return decodedResult;
  } catch (error) {
    const errorMessage = `Failed to query view function ${functionId}: ${(error as Error).message}`;
    logger.error('queryEvmViewFunction', errorMessage, {
      contractAddress,
      functionId,
      params,
      error,
    });
    throw new Error(errorMessage);
  }
}
