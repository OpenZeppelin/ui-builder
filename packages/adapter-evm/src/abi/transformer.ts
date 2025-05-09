import type { AbiFunction, AbiParameter, AbiStateMutability } from 'viem';

import type {
  ContractFunction,
  ContractSchema,
  FunctionParameter,
} from '@openzeppelin/transaction-form-types';

import type { AbiItem } from '../types';
import { formatInputName, formatMethodName } from '../utils';

/**
 * Transforms a standard ABI array (typically from an EVM-compatible chain)
 * into the project's internal `ContractSchema` format.
 * This schema is used by the form builder and renderer to represent contract interactions
 * in a chain-agnostic way (though this specific transformer is for EVM ABIs).
 *
 * @param abi The raw ABI array (e.g., parsed from a JSON ABI file or fetched from Etherscan).
 *            It's expected to be an array of `AbiItem` (from viem types or a compatible structure).
 * @param contractName A name to assign to the contract within the schema. This might be derived
 *                     from a file name, user input, or a default if not otherwise available.
 * @param address Optional address of the deployed contract. If provided, it's included in the schema.
 * @returns A `ContractSchema` object representing the contract's interface.
 */
export function transformAbiToSchema(
  abi: readonly AbiItem[],
  contractName: string,
  address?: string
): ContractSchema {
  console.info(`Transforming ABI to ContractSchema for: ${contractName}`);
  const functions: ContractFunction[] = [];

  for (const item of abi) {
    // We are only interested in 'function' type items from the ABI
    // to map them to our ContractFunction interface.
    if (item.type === 'function') {
      // After confirming item.type is 'function', we can safely cast it to AbiFunction
      // to access function-specific properties like `stateMutability`, `inputs`, `outputs`.
      const abiFunctionItem = item as AbiFunction;
      functions.push({
        // Generate a unique ID for the function within the schema.
        // This often combines name and input types to handle overloads.
        id: `${abiFunctionItem.name}_${abiFunctionItem.inputs?.map((i) => i.type).join('_') || ''}`,
        name: abiFunctionItem.name || '', // Fallback for unnamed functions (though rare).
        displayName: formatMethodName(abiFunctionItem.name || ''), // Create a more readable name for UI.
        // Recursively map ABI inputs and outputs to our FunctionParameter structure.
        // This ensures that any non-standard properties (like 'internalType') are stripped.
        inputs: mapAbiParametersToSchemaParameters(abiFunctionItem.inputs),
        outputs: mapAbiParametersToSchemaParameters(abiFunctionItem.outputs),
        type: 'function', // Explicitly set, as we filtered for this type.
        stateMutability: abiFunctionItem.stateMutability, // Preserve EVM-specific state mutability.
        // Determine if the function modifies blockchain state based on its `stateMutability`.
        // This is a crucial piece of information for the UI (e.g., to differentiate read vs. write calls).
        modifiesState:
          !abiFunctionItem.stateMutability || // If undefined, assume it modifies state (safer default)
          !['view', 'pure'].includes(abiFunctionItem.stateMutability),
      });
    }
  }

  const contractSchema: ContractSchema = {
    ecosystem: 'evm', // This transformer is specific to EVM.
    name: contractName,
    address,
    functions,
  };
  console.info(`Transformation complete. Found ${contractSchema.functions.length} functions.`);
  return contractSchema;
}

/**
 * Recursively maps an array of ABI parameters (from viem's `AbiParameter` type or compatible)
 * to an array of `FunctionParameter` objects, which is our internal representation.
 * This function is crucial for stripping any properties not defined in `FunctionParameter`
 * (e.g., `internalType` from the raw ABI) and for handling nested components (structs/tuples).
 *
 * @param abiParams An array of ABI parameter objects. Can be undefined (e.g., if a function has no inputs/outputs).
 * @returns An array of `FunctionParameter` objects, or an empty array if `abiParams` is undefined.
 */
function mapAbiParametersToSchemaParameters(
  abiParams: readonly AbiParameter[] | undefined
): FunctionParameter[] {
  if (!abiParams) {
    return [];
  }
  return abiParams.map((param): FunctionParameter => {
    // Create the base FunctionParameter object, picking only defined properties.
    const schemaParam: FunctionParameter = {
      name: param.name || '', // Ensure name is a string, fallback if undefined in ABI.
      type: param.type, // The raw type string from the ABI (e.g., 'uint256', 'address', 'tuple').
      displayName: formatInputName(param.name || '', param.type), // Generate a user-friendly name.
      // `description` is not a standard part of an ABI parameter, so it's not mapped here.
      // It can be added later by the user in the form builder UI.
    };
    // Check for nested components (structs/tuples).
    // `param.type.startsWith('tuple')` checks if it's a tuple or tuple array.
    // `'components' in param` is a type guard for discriminated unions.
    // `param.components && param.components.length > 0` ensures components exist and are not empty.
    if (
      param.type.startsWith('tuple') &&
      'components' in param && // Type guard for discriminated union (AbiParameter)
      param.components &&
      param.components.length > 0
    ) {
      // If components exist, recursively call this function to map them.
      // This ensures that nested structures also conform to `FunctionParameter` and strip extra fields.
      // Cast `param.components` because TypeScript might not fully infer its type after the `in` check within the map.
      schemaParam.components = mapAbiParametersToSchemaParameters(
        param.components as readonly AbiParameter[]
      );
    }
    return schemaParam;
  });
}

/**
 * Helper function to convert one of our internal `FunctionParameter` objects
 * back into a format compatible with viem's `AbiParameter` type.
 * This is primarily used by `createAbiFunctionItem` when constructing an `AbiFunction`
 * for interactions with viem or other ABI-consuming libraries.
 * It ensures that only properties expected by `AbiParameter` are included.
 *
 * @param param The internal `FunctionParameter` object.
 * @returns An `AbiParameter` object compatible with viem.
 */
function mapSchemaParameterToAbiParameter(param: FunctionParameter): AbiParameter {
  // Handle tuple types specifically, as `AbiParameter` for tuples requires a `components` array.
  if (param.type.startsWith('tuple') && param.components && param.components.length > 0) {
    return {
      name: param.name || undefined, // ABI parameter names can be undefined (e.g., for return values).
      type: param.type as `tuple${string}`, // Cast to satisfy viem's specific tuple type string.
      // Recursively map nested components back to AbiParameter format.
      components: param.components.map(mapSchemaParameterToAbiParameter),
    };
  }
  // For non-tuple types, return a simpler AbiParameter structure.
  return {
    name: param.name || undefined,
    type: param.type,
    // `internalType` is not part of our `FunctionParameter` model, so it's not added back here.
    // Other ABI-specific fields like `indexed` (for events) are also not relevant here as
    // this function is focused on function parameters for `AbiFunction`.
  };
}

/**
 * Private helper to convert internal `ContractFunction` details (our model)
 * back into a viem `AbiFunction` object.
 * This is useful when interacting with libraries like viem that expect a standard ABI format.
 * Ensures that the generated AbiFunction conforms to viem's type definitions.
 *
 * @param functionDetails The `ContractFunction` object from our internal schema.
 * @returns An `AbiFunction` object.
 */
export function createAbiFunctionItem(functionDetails: ContractFunction): AbiFunction {
  return {
    name: functionDetails.name,
    type: 'function',
    inputs: functionDetails.inputs.map(mapSchemaParameterToAbiParameter),
    outputs: functionDetails.outputs?.map(mapSchemaParameterToAbiParameter) || [],
    stateMutability: (functionDetails.stateMutability ?? 'view') as AbiStateMutability,
  };
}
