import { Address, xdr } from '@stellar/stellar-sdk';

import type {
  ContractSchema,
  EnumValue,
  FormFieldType,
} from '@openzeppelin/contracts-ui-builder-types';
import { isEnumValue } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { extractEnumVariants, isEnumType } from '../mapping/enum-metadata';
import { parseStellarInput } from '../transform';

/**
 * Stellar transaction data structure that will be passed to signAndBroadcast
 */
export interface StellarTransactionData {
  contractAddress: string;
  functionName: string;
  args: unknown[];
  argTypes: string[]; // Parameter types for nativeToScVal type hints
  transactionOptions: Record<string, unknown>;
}

/**
 * Formats transaction data for Stellar chains based on parsed inputs.
 *
 * @param contractSchema The contract schema.
 * @param functionId The ID of the function being called.
 * @param submittedInputs The raw data submitted from the form.
 * @param fields The fields of the form schema.
 * @returns The formatted data payload suitable for signAndBroadcast.
 */
export function formatStellarTransactionData(
  contractSchema: ContractSchema,
  functionId: string,
  submittedInputs: Record<string, unknown>,
  fields: FormFieldType[]
): StellarTransactionData {
  logger.info(
    'formatStellarTransactionData',
    `Formatting Stellar transaction data for function: ${functionId}`
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

    // Handle enum values - process payload types using enum metadata
    if (isEnumValue(valueToParse)) {
      const specEntries = contractSchema.metadata?.specEntries as xdr.ScSpecEntry[] | undefined;
      if (specEntries && isEnumType(specEntries, param.type)) {
        const enumMetadata = extractEnumVariants(specEntries, param.type);
        const enumValue = valueToParse as EnumValue;
        if (enumMetadata && enumValue.values) {
          // Find the variant metadata for the selected tag
          const selectedVariant = enumMetadata.variants.find((v) => v.name === enumValue.tag);
          if (selectedVariant && selectedVariant.payloadTypes) {
            // Process each payload value according to its expected type
            const processedValues = enumValue.values.map(
              (rawValue: unknown, payloadIndex: number) => {
                const expectedType = selectedVariant.payloadTypes![payloadIndex];
                if (expectedType) {
                  // Use parseStellarInput to convert the raw value to the proper type
                  const processedValue = parseStellarInput(rawValue, expectedType);
                  // Create SorobanArgumentValue structure for getScValFromArg
                  return {
                    type: expectedType,
                    value: processedValue,
                  };
                }
                return rawValue;
              }
            );
            // Return the enum with processed payload values
            valueToParse = { ...enumValue, values: processedValues };
          }
        }
      }
    }

    // Handle array parameters - if the value is already an array and the type expects it,
    // we can pass it directly. The Stellar input parser will handle the conversion.
    if (
      typeof param.type === 'string' &&
      param.type.startsWith('Vec<') &&
      Array.isArray(valueToParse)
    ) {
      // For Vec types, pass array as-is to parseStellarInput
      return parseStellarInput(valueToParse, param.type);
    }

    return parseStellarInput(valueToParse, param.type);
  });

  // --- Step 4: Validate Contract Address --- //
  if (!contractSchema.address) {
    throw new Error('Contract address is missing or invalid in the provided schema.');
  }

  try {
    Address.fromString(contractSchema.address);
  } catch {
    throw new Error('Contract address is missing or invalid in the provided schema.');
  }

  // --- Step 5: Prepare Return Object --- //
  const stellarTransactionData: StellarTransactionData = {
    contractAddress: contractSchema.address,
    functionName: functionDetails.name,
    args: transformedArgs,
    argTypes: functionDetails.inputs.map((param) => param.type), // Include parameter types for ScVal conversion
    transactionOptions: {
      // Add any Stellar-specific transaction options here
      // For example: fee, timeout, memo, etc.
    },
  };

  logger.debug(
    'formatStellarTransactionData',
    'Formatted transaction data:',
    stellarTransactionData
  );

  return stellarTransactionData;
}
