import { isAddress } from 'viem';
import type { Abi } from 'viem';

import type { ContractSchema, FormFieldType } from '@openzeppelin/transaction-form-types';

import { createAbiFunctionItem } from '../abi';
import { parseEvmInput } from '../transform';

// Define structure locally or import from shared types
interface WriteContractParameters {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args: unknown[];
  value?: bigint;
}

/**
 * Formats transaction data for EVM chains based on parsed inputs.
 *
 * @param contractSchema The contract schema.
 * @param functionId The ID of the function being called.
 * @param submittedInputs The raw data submitted from the form.
 * @param allFieldsConfig The configuration for all fields.
 * @returns The formatted data payload suitable for signAndBroadcast.
 */
export function formatEvmTransactionData(
  contractSchema: ContractSchema,
  functionId: string,
  submittedInputs: Record<string, unknown>,
  allFieldsConfig: FormFieldType[]
): WriteContractParameters {
  console.log(`Formatting EVM transaction data for function: ${functionId}`);

  // --- Step 1: Determine Argument Order --- //
  const functionDetails = contractSchema.functions.find((fn) => fn.id === functionId);
  if (!functionDetails) {
    throw new Error(`Function definition for ${functionId} not found in provided contract schema.`);
  }
  const expectedArgs = functionDetails.inputs;

  // --- Step 2: Iterate and Select Values --- //
  const orderedRawValues: unknown[] = [];
  for (const expectedArg of expectedArgs) {
    const fieldConfig = allFieldsConfig.find((field) => field.name === expectedArg.name);
    if (!fieldConfig) {
      throw new Error(`Configuration missing for argument: ${expectedArg.name}`);
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
    const rawValue = orderedRawValues[index];
    return parseEvmInput(param, rawValue, false);
  });

  // --- Step 4 & 5: Prepare Return Object --- //
  const isPayable = functionDetails.stateMutability === 'payable';
  let transactionValue = 0n; // Use BigInt zero
  if (isPayable) {
    console.warn('Payable function detected, but sending 0 ETH. Implement value input.');
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
