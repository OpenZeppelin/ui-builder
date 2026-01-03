import * as StellarSdk from '@stellar/stellar-sdk';
import { xdr } from '@stellar/stellar-sdk';

import type {
  ContractFunction,
  ContractSchema,
  FunctionParameter,
  StellarNetworkConfig,
} from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { getStellarExplorerAddressUrl } from '../configuration/explorer';
import { extractStructFields, isStructType } from '../mapping/struct-fields';
import { checkStellarFunctionStateMutability } from '../query/handler';
import { getSacSpecArtifacts } from '../sac/spec-cache';
import type { StellarContractArtifacts } from '../types/artifacts';
import { extractSorobanTypeFromScSpec } from '../utils/type-detection';
import { getStellarContractType } from './type';

/**
 * Load a Stellar contract using the official Stellar SDK approach
 * Based on the patterns from the official Stellar laboratory
 */
export async function loadStellarContractFromAddress(
  contractAddress: string,
  networkConfig: StellarNetworkConfig
): Promise<ContractSchema> {
  logger.info('loadStellarContractFromAddress', 'Loading contract:', {
    contractAddress,
    network: networkConfig.name,
    rpcUrl: networkConfig.sorobanRpcUrl,
    networkPassphrase: networkConfig.networkPassphrase,
  });

  try {
    // Validate contract address
    if (!StellarSdk.StrKey.isValidContract(contractAddress)) {
      throw new Error(`Invalid contract address: ${contractAddress}`);
    }

    // Special-case: detect SAC and construct spec locally
    try {
      const execType = await getStellarContractType(contractAddress, networkConfig);

      if (execType === 'contractExecutableStellarAsset') {
        const { base64Entries, specEntries } = await getSacSpecArtifacts();
        const spec = new StellarSdk.contract.Spec(base64Entries);

        const functions = await extractFunctionsFromSpec(
          spec,
          contractAddress,
          specEntries,
          networkConfig
        );

        return {
          name: `Stellar Asset Contract ${contractAddress.slice(0, 8)}...`,
          ecosystem: 'stellar',
          functions,
          metadata: {
            specEntries,
          },
        };
      }
    } catch (e) {
      // If detection path fails unexpectedly, fall back to SDK client path below
      logger.warn(
        'loadStellarContractFromAddress',
        'SAC detection failed, falling back to regular client:',
        e
      );
    }

    // Create contract client using the official Stellar SDK approach
    // Laboratory note: some contracts may be missing Wasm/definition retrievable via RPC.
    // In that case the SDK can throw an internal error like
    // "Cannot destructure property 'length'...". Detect and surface an explicit error.
    let contractClient: StellarSdk.contract.Client;
    try {
      contractClient = await StellarSdk.contract.Client.from({
        contractId: contractAddress,
        networkPassphrase: networkConfig.networkPassphrase,
        rpcUrl: networkConfig.sorobanRpcUrl,
      });
    } catch (e) {
      const message = (e as Error)?.message || String(e);
      if (message.includes("Cannot destructure property 'length'")) {
        const friendly =
          'Unable to fetch contract metadata from RPC. The contract appears to have no published Wasm/definition on this network.';
        logger.error('loadStellarContractFromAddress', friendly);
        throw new Error(`NO_WASM: ${friendly}`);
      }
      throw e;
    }

    logger.info('loadStellarContractFromAddress', 'Contract client created successfully');

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

        // Try the method directly on spec if it has the method
        if (specEntries.length === 0 && typeof spec.entries === 'function') {
          try {
            specEntries = (spec.entries as () => xdr.ScSpecEntry[])();
          } catch (e) {
            logger.warn('loadStellarContractFromAddress', 'direct entries() method failed:', e);
          }
        }

        logger.info('loadStellarContractFromAddress', `Found ${specEntries.length} spec entries`);
      }
    } catch (specError) {
      logger.warn('loadStellarContractFromAddress', 'Could not extract spec entries:', specError);
    }

    // Extract functions using the official laboratory approach with spec entries for struct extraction
    const functions = await extractFunctionsFromSpec(
      contractClient.spec,
      contractAddress,
      specEntries,
      networkConfig
    );

    logger.info(
      'loadStellarContractFromAddress',
      `Successfully extracted ${functions.length} functions`
    );

    return {
      name: `Soroban Contract ${contractAddress.slice(0, 8)}...`,
      ecosystem: 'stellar',
      functions,
      metadata: {
        specEntries,
      },
    };
  } catch (error) {
    const msg = (error as Error)?.message || String(error);
    // Preserve explicit NO_WASM error so downstream can surface it to the user
    if (msg.startsWith('NO_WASM:')) {
      logger.error('loadStellarContractFromAddress', msg);
      throw new Error(msg);
    }
    logger.error('loadStellarContractFromAddress', 'Failed to load contract:', error);
    throw new Error(`Failed to load contract: ${msg}`);
  }
}

/**
 * Extract functions from contract spec using the official Stellar laboratory approach
 * with simulation-based state mutability detection
 */
async function extractFunctionsFromSpec(
  spec: StellarSdk.contract.Spec,
  contractAddress: string,
  specEntries?: xdr.ScSpecEntry[],
  networkConfig?: StellarNetworkConfig
): Promise<ContractFunction[]> {
  try {
    // Get all functions using the official SDK method
    const specFunctions = spec.funcs();

    logger.info('extractFunctionsFromSpec', `Found ${specFunctions.length} functions in spec`);

    return await Promise.all(
      specFunctions.map(async (func, index) => {
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

              // Check if this is a struct type and extract components
              let components: FunctionParameter[] | undefined;
              if (specEntries && specEntries.length > 0 && isStructType(specEntries, inputType)) {
                const structFields = extractStructFields(specEntries, inputType);
                if (structFields && structFields.length > 0) {
                  components = structFields;
                  logger.debug(
                    'extractFunctionsFromSpec',
                    `Extracted ${structFields.length} fields for struct type "${inputType}": ${structFields.map((f) => `${f.name}:${f.type}`).join(', ')}`
                  );
                } else {
                  logger.warn(
                    'extractFunctionsFromSpec',
                    `No fields extracted for struct "${inputType}"`
                  );
                }
              }

              return {
                name: inputName || `param_${inputIndex}`,
                type: inputType,
                ...(components && { components }),
              };
            } catch (error) {
              logger.warn(
                'extractFunctionsFromSpec',
                `Failed to parse input ${inputIndex}:`,
                error
              );
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

          // Determine if function is read-only (view function) using simulation-based detection
          // This follows the same approach as the official Stellar Laboratory
          let modifiesState = true; // Default assumption for safety
          let stateMutability: 'view' | 'pure' | 'nonpayable' = 'nonpayable';

          if (networkConfig) {
            try {
              // Extract input types for simulation
              const inputTypes = inputs.map((input) => input.type);

              logger.debug(
                'extractFunctionsFromSpec',
                `Checking state mutability for ${functionName} with input types: ${inputTypes.join(', ')}`
              );

              // Use simulation-based state mutability detection
              modifiesState = await checkStellarFunctionStateMutability(
                contractAddress,
                functionName,
                networkConfig,
                inputTypes
              );

              stateMutability = modifiesState ? 'nonpayable' : 'view';

              logger.info(
                'extractFunctionsFromSpec',
                `Function ${functionName} state mutability determined:`,
                { modifiesState, stateMutability }
              );
            } catch (error) {
              logger.warn(
                'extractFunctionsFromSpec',
                `Failed to determine state mutability for ${functionName}, assuming it modifies state:`,
                error
              );
              // Keep defaults: modifiesState = true, stateMutability = 'nonpayable'
            }
          } else {
            logger.warn(
              'extractFunctionsFromSpec',
              `No network config provided for ${functionName}, assuming it modifies state`
            );
          }

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
            modifiesState,
            stateMutability,
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
      })
    );
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
  artifacts: StellarContractArtifacts,
  networkConfig: StellarNetworkConfig
): Promise<StellarContractLoadResult> {
  if (typeof artifacts.contractAddress !== 'string') {
    throw new Error('A contract address must be provided.');
  }

  const schema = await loadStellarContractFromAddress(artifacts.contractAddress, networkConfig);

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
  artifacts: StellarContractArtifacts,
  networkConfig: StellarNetworkConfig
): Promise<StellarContractLoadResult> {
  if (typeof artifacts.contractAddress !== 'string') {
    throw new Error('A contract address must be provided.');
  }

  try {
    const contractData = await loadStellarContractFromAddress(
      artifacts.contractAddress,
      networkConfig
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
    // Surface Laboratory-style explicit message if Wasm is missing
    if (errorMessage.startsWith('NO_WASM:')) {
      // Re-throw without swallowing details so UI can show this immediately
      throw new Error(errorMessage.replace(/^NO_WASM:\s*/, ''));
    }
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
 * Integration points for manual contract definition input (future work):
 *
 * Single Input with Auto-Detection (simplified UX):
 *    - Add a new loader path: `loadStellarContractFromDefinition(definition, networkConfig)`
 *    - Auto-detect content type using magic bytes and structure:
 *      - Wasm binary: starts with magic bytes `[0x00, 0x61, 0x73, 0x6D]` (`\0asm`)
 *      - JSON spec: valid JSON array with Soroban spec entry objects
 *    - For JSON: Parse and validate, use `transformStellarSpecToSchema()` to build schema
 *    - For Wasm: Extract embedded spec from binary locally (no RPC), then build schema
 *    - Return `{ schema, source: 'manual' }` with `contractDefinitionOriginal` set to
 *      the raw input (JSON string or Wasm binary) for auto-save restoration
 *
 * The builder UI provides a single input field (code editor with file upload support)
 * that accepts either format, eliminating user confusion about format selection.
 * The auto-save system will store the resulting schema and `contractDefinitionOriginal`
 * so the configuration restores seamlessly.
 */

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
