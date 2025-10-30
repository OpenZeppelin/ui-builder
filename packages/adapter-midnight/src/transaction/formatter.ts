import type { ContractSchema, FormFieldType } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { parseMidnightInput } from '../transform';
import type { MidnightContractArtifacts, WriteContractParameters } from '../types';
import { isArrayType, isMaybeType, isVectorType } from '../utils/type-helpers';

// (shared helpers imported from ../utils/type-helpers)

/**
 * Formats transaction data for Midnight chains based on parsed inputs.
 *
 * @param contractSchema The contract schema.
 * @param functionId The ID of the function being called.
 * @param submittedInputs The raw data submitted from the form.
 * @param fields The fields of the form schema.
 * @param artifacts Optional contract artifacts needed for execution
 * @returns The formatted data payload suitable for signAndBroadcast.
 */
export function formatMidnightTransactionData(
  contractSchema: ContractSchema,
  functionId: string,
  submittedInputs: Record<string, unknown>,
  fields: FormFieldType[],
  artifacts?: MidnightContractArtifacts | null
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
      if (fieldConfig.hardcodedValue === undefined) {
        throw new Error(
          `Field '${fieldConfig.name}' is marked as hardcoded but has no hardcodedValue defined.`
        );
      }
      value = fieldConfig.hardcodedValue;
    } else if (fieldConfig.isHidden) {
      throw new Error(`Field '${fieldConfig.name}' cannot be hidden without being hardcoded.`);
    } else {
      // Handle optional (Maybe<T>) parameters: allow missing input → null
      const maybe =
        typeof expectedArg.type === 'string' ? isMaybeType(expectedArg.type) : { isMaybe: false };
      if (!(fieldConfig.name in submittedInputs)) {
        if (maybe.isMaybe) {
          value = null;
        } else {
          throw new Error(`Missing submitted input for required field: ${fieldConfig.name}`);
        }
      } else {
        value = submittedInputs[fieldConfig.name];
      }
    }
    orderedRawValues.push(value);
  }

  // --- Step 3: Parse/Transform Values using the imported parser --- //
  const transformedArgs = expectedArgs.map((param, index) => {
    let valueToParse = orderedRawValues[index];
    const fieldConfig = fields.find((f) => f.name === param.name);

    // Enum normalization: convert chain-agnostic enum value to Midnight enum number
    function normalizeEnum(
      value: unknown,
      enumMeta?: {
        name: string;
        variants: Array<{ name: string; type: 'void' | 'tuple' | 'integer'; value?: number }>;
      }
    ): unknown {
      if (!enumMeta) return value;
      if (value && typeof value === 'object' && 'tag' in (value as Record<string, unknown>)) {
        const tag = (value as { tag?: string }).tag;
        const variant = enumMeta.variants.find((v) => v.name === tag);
        if (variant) {
          if (variant.type === 'integer' && typeof variant.value === 'number') return variant.value;
          // Fallback: use index if numeric not provided
          const idx = enumMeta.variants.findIndex((v) => v.name === tag);
          return idx >= 0 ? idx : value;
        }
      }
      if (typeof value === 'string') {
        const variant = enumMeta.variants.find((v) => v.name === value);
        if (variant) {
          if (variant.type === 'integer' && typeof variant.value === 'number') return variant.value;
          const idx = enumMeta.variants.findIndex((v) => v.name === value);
          return idx >= 0 ? idx : value;
        }
      }
      return value;
    }

    // If the parameter type is Array<T> and the raw value is already an array, pass through
    if (typeof param.type === 'string') {
      const arr = isArrayType(param.type);
      const vec = isVectorType(param.type);
      if ((arr.isArray || vec.isVector) && Array.isArray(valueToParse)) {
        // Normalize enums inside arrays when elementType is enum
        if (
          fieldConfig &&
          fieldConfig.type === 'array' &&
          fieldConfig.elementType === 'enum' &&
          fieldConfig.elementFieldConfig?.enumMetadata
        ) {
          valueToParse = (valueToParse as unknown[]).map((item) =>
            normalizeEnum(item, fieldConfig.elementFieldConfig?.enumMetadata)
          );
        }
      }
    }

    // Normalize single enum
    if (fieldConfig && fieldConfig.type === 'enum' && fieldConfig.enumMetadata) {
      valueToParse = normalizeEnum(valueToParse, fieldConfig.enumMetadata);
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
    transactionOptions: {
      // Pass artifacts for execution (will be extracted by adapter's signAndBroadcast)
      _artifacts: artifacts
        ? {
            privateStateId: artifacts.privateStateId,
            contractModule: artifacts.contractModule,
            witnessCode: artifacts.witnessCode,
            verifierKeys: artifacts.verifierKeys,
          }
        : undefined,
    },
  };

  return paramsForSignAndBroadcast;
}
