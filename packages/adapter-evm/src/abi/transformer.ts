import type { AbiFunction, AbiStateMutability } from 'viem';

import type { ContractFunction, ContractSchema } from '@openzeppelin/transaction-form-types';

import type { AbiItem } from '../types';
import { formatInputName, formatMethodName } from '../utils';

/**
 * Transforms a standard ABI array into the ContractSchema format.
 * @param abi The ABI array to transform
 * @param contractName The name to use for the contract
 * @param address Optional contract address to include in the schema
 */
export function transformAbiToSchema(
  abi: AbiItem[],
  contractName: string,
  address?: string
): ContractSchema {
  console.info(`Transforming ABI to ContractSchema for: ${contractName}`);
  const contractSchema: ContractSchema = {
    ecosystem: 'evm',
    name: contractName,
    address,
    functions: abi
      .filter((item) => item.type === 'function')
      .map((item) => ({
        id: `${item.name}_${item.inputs?.map((i) => i.type).join('_') || ''}`,
        name: item.name || '',
        displayName: formatMethodName(item.name || ''), // Use imported util
        // Map inputs, including components
        inputs:
          item.inputs?.map((input) => ({
            name: input.name || '',
            type: input.type,
            displayName: formatInputName(input.name, input.type), // Use imported util
            ...(input.components ? { components: input.components } : {}),
          })) || [],
        // Map outputs, including components
        outputs:
          item.outputs?.map((output) => ({
            name: output.name || '',
            type: output.type,
            ...(output.components ? { components: output.components } : {}),
          })) || [],
        type: 'function', // Already filtered for functions
        stateMutability: item.stateMutability,
        modifiesState: !item.stateMutability || !['view', 'pure'].includes(item.stateMutability),
      })),
  };
  console.info(`Transformation complete. Found ${contractSchema.functions.length} functions.`);
  return contractSchema;
}

/**
 * Private helper to convert internal function details to viem AbiFunction format.
 */
export function createAbiFunctionItem(functionDetails: ContractFunction): AbiFunction {
  return {
    name: functionDetails.name,
    type: 'function',
    // Correctly map inputs, including components
    inputs: functionDetails.inputs.map((i) => ({
      name: i.name || '',
      type: i.type,
      ...(i.components && { components: i.components }),
    })),
    // Correctly map outputs, including components
    outputs:
      functionDetails.outputs?.map((o) => ({
        name: o.name || '',
        type: o.type,
        ...(o.components && { components: o.components }),
      })) || [],
    stateMutability: (functionDetails.stateMutability ?? 'view') as AbiStateMutability,
  };
}
