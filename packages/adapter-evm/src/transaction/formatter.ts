import { isAddress } from 'viem';

import type { ContractSchema, FormFieldType } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { createAbiFunctionItem } from '../abi';
import { parseEvmInput } from '../transform';
import type { WriteContractParameters } from '../types';

/**
 * Formats transaction data for EVM chains based on parsed inputs.
 *
 * @param contractSchema The contract schema.
 * @param functionId The ID of the function being called.
 * @param submittedInputs The raw data submitted from the form.
 * @param fields The fields of the form schema.
 * @returns The formatted data payload suitable for signAndBroadcast.
 */
export function formatEvmTransactionData(
  contractSchema: ContractSchema,
  functionId: string,
  submittedInputs: Record<string, unknown>,
  fields: FormFieldType[]
): WriteContractParameters {
  logger.info(
    'formatEvmTransactionData',
    `Formatting EVM transaction data for function: ${functionId}`
  );

  // --- Step 1: Determine Argument Order --- //
  const functionDetails = contractSchema.functions.find((fn) => fn.id === functionId);
  if (!functionDetails) {
    throw new Error(`Function definition for ${functionId} not found in provided contract schema.`);
  }
  const expectedArgs = functionDetails.inputs;

  // --- Step 2: Iterate and Select Values --- //
  const orderedRawValues: unknown[] = [];
  for (const expectedArg of expectedArgs) {
    const fieldConfig = fields.find((field: FormFieldType) => field.name === expectedArg.name);
    if (!fieldConfig) {
      throw new Error(`Configuration missing for argument: ${expectedArg.name} in provided fields`);
    }
    let value: unknown;
    if (fieldConfig.isHardcoded) {
      value = fieldConfig.hardcodedValue;
    } else if (fieldConfig.isHidden) {
      throw new Error(`Field '${fieldConfig.name}' cannot be hidden without being hardcoded.`);
    } else {
      if (!(fieldConfig.name in submittedInputs)) {
        throw new Error(`Missing submitted input for required field: ${fieldConfig.name}`);
      }
      value = submittedInputs[fieldConfig.name];
    }
    orderedRawValues.push(value);
  }

  // --- Step 3: Parse/Transform Values using the imported parser --- //
  const transformedArgs = expectedArgs.map((param, index) => {
    let valueToParse = orderedRawValues[index];

    // If the ABI parameter type is an array (e.g., 'tuple[]', 'address[]') and
    // the raw value from the form/runtime is an array (not already a string),
    // stringify it for parseEvmInput which expects JSON at the top-level.
    if (
      typeof param.type === 'string' &&
      param.type.endsWith('[]') &&
      Array.isArray(valueToParse)
    ) {
      valueToParse = JSON.stringify(valueToParse);
    }

    return parseEvmInput(param, valueToParse, false);
  });

  // --- Step 4 & 5: Prepare Return Object --- //
  const isPayable = functionDetails.stateMutability === 'payable';
  let transactionValue = 0n; // Use BigInt zero
  if (isPayable) {
    logger.warn(
      'formatEvmTransactionData',
      'Payable function detected, but sending 0 ETH. Implement value input.'
    );
    // TODO: Read value from submittedInputs or config when payable input is implemented
  }

  const functionAbiItem = createAbiFunctionItem(functionDetails);

  if (!contractSchema.address || !isAddress(contractSchema.address)) {
    throw new Error('Contract address is missing or invalid in the provided schema.');
  }

  const paramsForSignAndBroadcast: WriteContractParameters = {
    address: contractSchema.address,
    abi: [functionAbiItem],
    functionName: functionDetails.name,
    args: transformedArgs,
    value: transactionValue, // Pass BigInt value
  };
  return paramsForSignAndBroadcast;
}
