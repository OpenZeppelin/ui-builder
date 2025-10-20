import type { ContractSchema, FormFieldType } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { parseMidnightInput } from '../transform';
import type { WriteContractParameters } from '../types';

/**
 * Formats transaction data for Midnight chains based on parsed inputs.
 *
 * @param contractSchema The contract schema.
 * @param functionId The ID of the function being called.
 * @param submittedInputs The raw data submitted from the form.
 * @param fields The fields of the form schema.
 * @returns The formatted data payload suitable for signAndBroadcast.
 */
export function formatMidnightTransactionData(
  contractSchema: ContractSchema,
  functionId: string,
  submittedInputs: Record<string, unknown>,
  fields: FormFieldType[]
): WriteContractParameters {
  logger.info(
    'formatMidnightTransactionData',
    `Formatting Midnight transaction data for function: ${functionId}`
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

    // If the parameter type is an array and the raw value is an array,
    // pass it as-is to the parser for proper handling
    if (
      typeof param.type === 'string' &&
      param.type.includes('[]') &&
      Array.isArray(valueToParse)
    ) {
      // Parser will handle array conversion
    }

    return parseMidnightInput(valueToParse, param.type);
  });

  // --- Step 4 & 5: Prepare Return Object --- //
  if (!contractSchema.address) {
    throw new Error('Contract address is missing or invalid in the provided schema.');
  }

  const paramsForSignAndBroadcast: WriteContractParameters = {
    contractAddress: contractSchema.address,
    functionName: functionDetails.name,
    args: transformedArgs,
    argTypes: functionDetails.inputs.map((param) => param.type),
    transactionOptions: {},
  };

  return paramsForSignAndBroadcast;
}
