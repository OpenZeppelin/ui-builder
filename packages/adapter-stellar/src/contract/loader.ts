import * as StellarSdk from '@stellar/stellar-sdk';
import { xdr } from '@stellar/stellar-sdk';

import type {
  ContractFunction,
  ContractSchema,
  FormValues,
  FunctionParameter,
  StellarNetworkConfig,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { getStellarExplorerAddressUrl } from '../explorer';
import { extractSorobanTypeFromScSpec } from '../utils/type-detection';

/**
 * Load a Stellar contract using the official Stellar SDK approach
 * Based on the patterns from the official Stellar laboratory
 */
export async function loadStellarContractFromAddress(
  contractAddress: string,
  rpcUrl: string,
  networkPassphrase: string
): Promise<ContractSchema> {
  logger.info('loadStellarContractFromAddress', 'Loading contract:', {
    contractAddress,
    rpcUrl,
    networkPassphrase,
  });

  try {
    // Validate contract address
    if (!StellarSdk.StrKey.isValidContract(contractAddress)) {
      throw new Error(`Invalid contract address: ${contractAddress}`);
    }

    // Create contract client using the official Stellar SDK approach
    const contractClient = await StellarSdk.contract.Client.from({
      contractId: contractAddress,
      networkPassphrase,
      rpcUrl,
    });

    logger.info('loadStellarContractFromAddress', 'Contract client created successfully');

    // Extract functions using the official laboratory approach
    const functions = extractFunctionsFromSpec(contractClient.spec, contractAddress);

    logger.info(
      'loadStellarContractFromAddress',
      `Successfully extracted ${functions.length} functions`
    );

    // Get spec entries - try different approaches to access them
    let specEntries: xdr.ScSpecEntry[] = [];
    try {
      // Access spec entries from the spec object

      // Try to access spec entries through different possible properties/methods
      if (contractClient.spec && typeof contractClient.spec === 'object') {
        const spec = contractClient.spec as unknown as Record<string, unknown>;

        // Try common property names
        if (Array.isArray(spec.entries)) {
          specEntries = spec.entries as xdr.ScSpecEntry[];
        } else if (Array.isArray(spec._entries)) {
          specEntries = spec._entries as xdr.ScSpecEntry[];
        } else if (Array.isArray(spec.specEntries)) {
          specEntries = spec.specEntries as xdr.ScSpecEntry[];
        } else if (typeof spec.entries === 'function') {
          // Maybe it's a method after all, but with different signature
          try {
            specEntries = (spec.entries as () => xdr.ScSpecEntry[])();
          } catch (e) {
            logger.warn('loadStellarContractFromAddress', 'entries() method failed:', e);
          }
        }

        logger.info('loadStellarContractFromAddress', `Found ${specEntries.length} spec entries`);
      }
    } catch (specError) {
      logger.warn('loadStellarContractFromAddress', 'Could not extract spec entries:', specError);
    }

    return {
      name: `Soroban Contract ${contractAddress.slice(0, 8)}...`,
      ecosystem: 'stellar',
      functions,
      metadata: {
        specEntries,
      },
    };
  } catch (error) {
    logger.error('loadStellarContractFromAddress', 'Failed to load contract:', error);
    throw new Error(`Failed to load contract: ${(error as Error).message}`);
  }
}

/**
 * Extract functions from contract spec using the official Stellar laboratory approach
 */
function extractFunctionsFromSpec(
  spec: StellarSdk.contract.Spec,
  _contractAddress: string
): ContractFunction[] {
  try {
    // Get all functions using the official SDK method
    const specFunctions = spec.funcs();

    logger.info('extractFunctionsFromSpec', `Found ${specFunctions.length} functions in spec`);

    return specFunctions.map((func, index) => {
      try {
        // Extract function name using the official SDK method
        const functionName = func.name().toString();

        logger.info('extractFunctionsFromSpec', `Processing function: ${functionName}`);

        // Get function inputs and outputs using the official SDK methods
        const inputs: FunctionParameter[] = func.inputs().map((input, inputIndex) => {
          try {
            const inputName = input.name().toString();
            const inputType = extractSorobanTypeFromScSpec(input.type());

            if (inputType === 'unknown') {
              logger.warn(
                'extractFunctionsFromSpec',
                `Unknown type for parameter "${inputName}" in function "${functionName}"`
              );
            }

            return {
              name: inputName || `param_${inputIndex}`,
              type: inputType,
            };
          } catch (error) {
            logger.warn('extractFunctionsFromSpec', `Failed to parse input ${inputIndex}:`, error);
            return {
              name: `param_${inputIndex}`,
              type: 'unknown',
            };
          }
        });

        const outputs: FunctionParameter[] = func.outputs().map((output, outputIndex) => {
          try {
            // Outputs are ScSpecTypeDef objects, they don't have names, only types
            const outputType = extractSorobanTypeFromScSpec(output);

            return {
              name: `result_${outputIndex}`,
              type: outputType,
            };
          } catch (error) {
            logger.warn(
              'extractFunctionsFromSpec',
              `Failed to parse output ${outputIndex}:`,
              error
            );
            return {
              name: `result_${outputIndex}`,
              type: 'unknown',
            };
          }
        });

        // Determine if function is read-only (view function)
        // In Soroban, this is typically determined by whether the function modifies state
        const readonly = outputs.length > 0 && inputs.length === 0; // Simple heuristic

        // Generate a unique ID for the function
        const functionId = `${functionName}_${inputs.map((i) => i.type).join('_')}`;

        return {
          id: functionId,
          name: functionName,
          displayName:
            functionName.charAt(0).toUpperCase() + functionName.slice(1).replace(/_/g, ' '),
          description: `Soroban function: ${functionName}`,
          inputs,
          outputs,
          type: 'function',
          modifiesState: !readonly,
          stateMutability: readonly ? 'view' : 'nonpayable',
        };
      } catch (error) {
        logger.error('extractFunctionsFromSpec', `Failed to process function ${index}:`, error);

        // Return a basic function entry for failed parsing
        return {
          id: `function_${index}`,
          name: `function_${index}`,
          displayName: `Function ${index}`,
          description: `Failed to parse function ${index}: ${(error as Error).message}`,
          inputs: [],
          outputs: [],
          type: 'function',
          modifiesState: true,
          stateMutability: 'nonpayable',
        };
      }
    });
  } catch (error) {
    logger.error('extractFunctionsFromSpec', 'Failed to extract functions from spec:', error);
    throw new Error(`Failed to extract functions: ${(error as Error).message}`);
  }
}

/**
 * Enhanced result type for Stellar contract loading with metadata
 */
export interface StellarContractLoadResult {
  schema: ContractSchema;
  source: 'fetched' | 'manual';
  contractDefinitionOriginal?: string;
  metadata?: {
    fetchedFrom?: string;
    contractName?: string;
    fetchTimestamp?: Date;
    definitionHash?: string;
  };
}

/**
 * Load Stellar contract with basic metadata
 */
export async function loadStellarContract(
  artifacts: FormValues,
  networkConfig: StellarNetworkConfig
): Promise<StellarContractLoadResult> {
  if (typeof artifacts.contractAddress !== 'string') {
    throw new Error('A contract address must be provided.');
  }

  const schema = await loadStellarContractFromAddress(
    artifacts.contractAddress,
    networkConfig.sorobanRpcUrl,
    networkConfig.networkPassphrase
  );

  const schemaWithAddress = { ...schema, address: artifacts.contractAddress };

  return {
    schema: schemaWithAddress,
    source: 'fetched',
    contractDefinitionOriginal: JSON.stringify(schemaWithAddress),
    metadata: {
      fetchedFrom:
        getStellarExplorerAddressUrl(artifacts.contractAddress, networkConfig) ||
        networkConfig.sorobanRpcUrl,
      contractName: schema.name,
      fetchTimestamp: new Date(),
    },
  };
}

/**
 * Load Stellar contract with extended metadata
 */
export async function loadStellarContractWithMetadata(
  artifacts: FormValues,
  networkConfig: StellarNetworkConfig
): Promise<StellarContractLoadResult> {
  if (typeof artifacts.contractAddress !== 'string') {
    throw new Error('A contract address must be provided.');
  }

  try {
    const contractData = await loadStellarContractFromAddress(
      artifacts.contractAddress,
      networkConfig.sorobanRpcUrl,
      networkConfig.networkPassphrase
    );

    const schema = {
      ...contractData,
      address: artifacts.contractAddress,
    };

    return {
      schema,
      source: 'fetched',
      contractDefinitionOriginal: JSON.stringify(schema),
      metadata: {
        fetchedFrom:
          getStellarExplorerAddressUrl(artifacts.contractAddress, networkConfig) ||
          networkConfig.sorobanRpcUrl,
        contractName: schema.name,
        fetchTimestamp: new Date(),
      },
    };
  } catch (error) {
    // Check if this is a network/connection error
    const errorMessage = (error as Error).message || '';
    if (errorMessage.includes('Failed to load contract')) {
      throw new Error(
        `Contract at ${artifacts.contractAddress} could not be loaded from the network. ` +
          `Please verify the contract ID is correct and the network is accessible.`
      );
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Transform Stellar contract spec to our internal schema format.
 *
 * This function is intentionally minimal at the moment and primarily used by
 * tests. The production load path derives function metadata using the
 * Stellar SDK via `loadStellarContractFromAddress`/`extractFunctionsFromSpec`.
 * A full spec-to-schema converter (with robust type mapping for inputs/outputs
 * and state mutability inference) is planned under the upcoming
 * "Type Mapping and Data Transformation" work in
 * `.agent-os/specs/2025-08-20-stellar-adapter-integration/tasks.md`.
 */
export function transformStellarSpecToSchema(
  contractSpec: Record<string, unknown>,
  contractAddress: string,
  ecosystem: 'stellar' = 'stellar'
): ContractSchema {
  logger.info('transformStellarSpecToSchema', 'Transforming Stellar spec to schema format');

  const schema: ContractSchema = {
    name: (contractSpec.name as string) || `Soroban Contract ${contractAddress.slice(0, 8)}...`,
    ecosystem,
    functions: (contractSpec.functions as ContractFunction[]) || [],
  };

  logger.info('transformStellarSpecToSchema', 'Generated schema:', {
    name: schema.name,
    ecosystem: schema.ecosystem,
    functionCount: Array.isArray(schema.functions) ? schema.functions.length : 0,
  });

  return schema;
}
