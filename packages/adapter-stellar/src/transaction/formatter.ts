import { Address, xdr } from '@stellar/stellar-sdk';

import type {
  ContractSchema,
  EnumValue,
  FormFieldType,
  FunctionParameter,
} from '@openzeppelin/ui-builder-types';
import { isEnumValue } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { extractEnumVariants, isEnumType } from '../mapping/enum-metadata';
import { parseStellarInput } from '../transform';
import { isLikelyEnumType } from '../utils/type-detection';

/**
 * Stellar transaction data structure that will be passed to signAndBroadcast
 */
export interface StellarTransactionData {
  contractAddress: string;
  functionName: string;
  args: unknown[];
  argTypes: string[]; // Parameter types for nativeToScVal type hints
  argSchema?: FunctionParameter[]; // Full parameter schema with struct field info
  transactionOptions: Record<string, unknown>;
}

/**
 * Recursively enriches a parameter with enum metadata from specEntries.
 * This ensures enum types get the metadata they need for proper ScVal conversion.
 */
function enrichParameterWithEnumMetadata(
  param: FunctionParameter,
  specEntries: xdr.ScSpecEntry[] | undefined
): FunctionParameter {
  if (!specEntries) {
    return param;
  }

  const enriched: FunctionParameter = { ...param };

  // Add enum metadata if this is an enum type
  if (isLikelyEnumType(param.type) && isEnumType(specEntries, param.type)) {
    const enumMetadata = extractEnumVariants(specEntries, param.type);
    if (enumMetadata) {
      enriched.enumMetadata = enumMetadata;
    }
  }

  // For Vec<EnumType>, extract the element type's enum metadata
  const vecMatch = param.type.match(/^Vec<([^>]+)>$/);
  if (vecMatch) {
    const elementType = vecMatch[1];
    if (isLikelyEnumType(elementType) && isEnumType(specEntries, elementType)) {
      const enumMetadata = extractEnumVariants(specEntries, elementType);
      if (enumMetadata) {
        enriched.enumMetadata = enumMetadata;
      }
    }
  }

  // Recursively process components for struct types
  if (enriched.components && enriched.components.length > 0) {
    enriched.components = enriched.components.map((component) =>
      enrichParameterWithEnumMetadata(component, specEntries)
    );
  }

  return enriched;
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
      // FIX: If hardcoded value is undefined but we have submitted input, use submitted input instead
      // This handles cases where fields were incorrectly saved with undefined hardcoded values
      if (fieldConfig.hardcodedValue === undefined && fieldConfig.name in submittedInputs) {
        logger.warn(
          'formatStellarTransactionData',
          `Field '${fieldConfig.name}' is hardcoded with undefined value but has submitted input. Using submitted input instead.`
        );
        value = submittedInputs[fieldConfig.name];
      } else {
        value = fieldConfig.hardcodedValue;
      }
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
                if (!expectedType) {
                  return rawValue;
                }
                const processedValue = parseStellarInput(rawValue, expectedType);
                // Keep SorobanArgumentValue wrapper for primitive payloads to satisfy tests and simple paths.
                // For complex payloads (structs/tuples/maps/vec/enums), return raw values and let valueToScVal handle serialization.
                const isPrimitivePayload =
                  expectedType === 'Bool' ||
                  expectedType === 'ScString' ||
                  expectedType === 'ScSymbol' ||
                  expectedType === 'Address' ||
                  expectedType === 'Bytes' ||
                  /^BytesN<\d+>$/.test(expectedType) ||
                  expectedType === 'U8' ||
                  expectedType === 'U16' ||
                  expectedType === 'U32' ||
                  expectedType === 'U64' ||
                  expectedType === 'U128' ||
                  expectedType === 'U256' ||
                  expectedType === 'I8' ||
                  expectedType === 'I16' ||
                  expectedType === 'I32' ||
                  expectedType === 'I64' ||
                  expectedType === 'I128' ||
                  expectedType === 'I256';

                if (isPrimitivePayload) {
                  return { type: expectedType, value: processedValue };
                }
                return processedValue;
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
  const fieldByName = new Map<string, FormFieldType>();
  fields.forEach((field) => fieldByName.set(field.name, field));

  // Extract specEntries from contract metadata for enum enrichment
  const specEntries = contractSchema.metadata?.specEntries as xdr.ScSpecEntry[] | undefined;

  const argSchemaWithComponents = functionDetails.inputs.map((param) => {
    const field = fieldByName.get(param.name);

    // Build enhanced schema with components and enum metadata from the field
    const enhanced: FunctionParameter = { ...param };

    // Prefer existing components from param, otherwise use field components
    if (param.components && param.components.length > 0) {
      enhanced.components = param.components;
    } else if (field?.components && field.components.length > 0) {
      enhanced.components = field.components;
    }

    // Add enum metadata from field if available
    if (field?.enumMetadata) {
      enhanced.enumMetadata = field.enumMetadata;
    }

    // For array fields, check if elementFieldConfig has enum metadata or components
    // This is needed for Vec<EnumType> or Vec<StructType>
    if (param.type.startsWith('Vec<') && field?.elementFieldConfig) {
      if (field.elementFieldConfig.enumMetadata) {
        enhanced.enumMetadata = field.elementFieldConfig.enumMetadata;
      }
      if (field.elementFieldConfig.components) {
        enhanced.components = field.elementFieldConfig.components;
      }
    }

    // For struct fields, enrich the components with enum metadata from nested fields
    if (enhanced.components && enhanced.components.length > 0) {
      enhanced.components = enhanced.components.map((component) => {
        // Build the nested field name (e.g., "complex_struct.base_asset")
        const nestedFieldName = `${param.name}.${component.name}`;
        const nestedField = fieldByName.get(nestedFieldName);

        if (nestedField) {
          const enrichedComponent: FunctionParameter = { ...component };

          // Add enum metadata from nested field
          if (nestedField.enumMetadata) {
            enrichedComponent.enumMetadata = nestedField.enumMetadata;
          }

          // Add components from nested field
          if (nestedField.components) {
            enrichedComponent.components = nestedField.components;
          }

          // For nested array fields, extract elementFieldConfig metadata
          if (component.type.startsWith('Vec<') && nestedField.elementFieldConfig) {
            if (nestedField.elementFieldConfig.enumMetadata) {
              enrichedComponent.enumMetadata = nestedField.elementFieldConfig.enumMetadata;
            }
            if (nestedField.elementFieldConfig.components) {
              enrichedComponent.components = nestedField.elementFieldConfig.components;
            }
          }

          return enrichedComponent;
        }

        return component;
      });
    }

    // Use specEntries to enrich with enum metadata for any enum types that weren't in the fields
    // This handles nested enums in structs where the nested fields aren't in the fields array
    const finalEnhanced = enrichParameterWithEnumMetadata(enhanced, specEntries);

    return finalEnhanced;
  });

  const stellarTransactionData: StellarTransactionData = {
    contractAddress: contractSchema.address,
    functionName: functionDetails.name,
    args: transformedArgs,
    argTypes: functionDetails.inputs.map((param) => param.type), // Include parameter types for ScVal conversion
    argSchema: argSchemaWithComponents, // Include full parameter schema with struct/tuple field definitions
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
