import type { FieldType, FieldValue, FormFieldType } from '@openzeppelin/transaction-form-renderer';

import { isAddress } from 'ethers';
import { startCase } from 'lodash';

import { generateId } from '../../core/utils/general';
import { logger } from '../../core/utils/logger';
import MockContractService from '../../services/MockContractService';

import type { ContractSchema, FunctionParameter } from '../../core/types/ContractSchema';
import type { MockContractInfo } from '../../services/MockContractService';
import type { ContractAdapter, ExecutionConfig, ExecutionMethodDetail } from '../index';
import type { AbiItem } from './types';

/**
 * EVM-specific type mapping
 */
const EVM_TYPE_TO_FIELD_TYPE: Record<string, FieldType> = {
  address: 'blockchain-address',
  string: 'text',
  uint: 'number',
  uint8: 'number',
  uint16: 'number',
  uint32: 'number',
  uint64: 'number',
  uint128: 'number',
  uint256: 'number',
  int: 'number',
  int8: 'number',
  int16: 'number',
  int32: 'number',
  int64: 'number',
  int128: 'number',
  int256: 'number',
  bool: 'checkbox',
  bytes: 'textarea',
  bytes32: 'text',
};

/**
 * EVM-specific adapter implementation
 */
export class EvmAdapter implements ContractAdapter {
  /**
   * Load a contract from a source string (address or JSON ABI)
   */
  async loadContract(source: string): Promise<ContractSchema> {
    // Step 1: Input Type Detection
    if (isAddress(source)) {
      // Input is likely an address, attempt Etherscan fetch
      logger.info('EvmAdapter', `Detected address: ${source}. Attempting Etherscan ABI fetch...`);
      return this.loadAbiFromEtherscan(source);
    } else {
      // Input is likely a JSON ABI string (or potentially invalid)
      logger.info('EvmAdapter', 'Input is not an address. Attempting to parse as JSON ABI...');
      // Assume input is JSON string if not an address
      return this.loadAbiFromJson(source);
    }
  }

  /**
   * Loads and parses an ABI directly from a JSON string.
   */
  private async loadAbiFromJson(abiJsonString: string): Promise<ContractSchema> {
    let abi: AbiItem[];
    try {
      abi = JSON.parse(abiJsonString);
      if (!Array.isArray(abi)) {
        throw new Error('Parsed JSON is not an array.');
      }
      // TODO: Add more robust ABI structure validation if needed
    } catch (error) {
      logger.error('EvmAdapter', 'Failed to parse source string as JSON ABI:', error);
      throw new Error(`Invalid JSON ABI provided: ${(error as Error).message}`);
    }

    logger.info('EvmAdapter', `Successfully parsed JSON ABI with ${abi.length} items.`);
    const contractName = 'ContractFromABI'; // Default name for direct ABI
    return this.transformAbiToSchema(abi, contractName);
  }

  /**
   * Fetches and parses an ABI from Etherscan using a contract address.
   */
  private async loadAbiFromEtherscan(address: string): Promise<ContractSchema> {
    const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY;
    if (!apiKey) {
      logger.error('EvmAdapter', 'Etherscan API Key (VITE_ETHERSCAN_API_KEY) is missing.');
      throw new Error('Etherscan API Key is not configured.');
    }

    // TODO: Make network dynamic
    const apiBaseUrl = 'https://api.etherscan.io/api'; // Mainnet default
    const url = `${apiBaseUrl}?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;

    let response: Response;
    try {
      logger.info('EvmAdapter', `Fetching ABI from Etherscan for address: ${address}`);
      response = await fetch(url);
    } catch (networkError) {
      logger.error('EvmAdapter', 'Network error fetching ABI from Etherscan:', networkError);
      throw new Error(`Network error fetching ABI: ${(networkError as Error).message}`);
    }

    if (!response.ok) {
      logger.error('EvmAdapter', `Etherscan API request failed with status: ${response.status}`);
      throw new Error(`Etherscan API request failed: ${response.status} ${response.statusText}`);
    }

    let etherscanResult: { status: string; message: string; result: string };
    try {
      etherscanResult = await response.json();
    } catch (jsonError) {
      logger.error('EvmAdapter', 'Failed to parse Etherscan API response as JSON:', jsonError);
      throw new Error('Invalid JSON response received from Etherscan API.');
    }

    if (etherscanResult.status !== '1') {
      logger.warn(
        'EvmAdapter',
        `Etherscan API error: Status ${etherscanResult.status}, Result: ${etherscanResult.result}`
      );
      if (etherscanResult.result?.includes('Contract source code not verified')) {
        throw new Error(
          `Contract not verified on Etherscan (address: ${address}). ABI not available.`
        );
      }
      throw new Error(`Etherscan API Error: ${etherscanResult.result || etherscanResult.message}`);
    }

    let abi: AbiItem[];
    try {
      abi = JSON.parse(etherscanResult.result);
      if (!Array.isArray(abi)) {
        throw new Error('Parsed ABI from Etherscan is not an array.');
      }
    } catch (error) {
      logger.error('EvmAdapter', 'Failed to parse ABI JSON string from Etherscan result:', error);
      throw new Error(`Invalid ABI JSON received from Etherscan: ${(error as Error).message}`);
    }

    logger.info('EvmAdapter', `Successfully parsed Etherscan ABI with ${abi.length} items.`);
    // TODO: Fetch contract name?
    const contractName = `Contract_${address.substring(0, 6)}`;
    return this.transformAbiToSchema(abi, contractName);
  }

  /**
   * Transforms a standard ABI array into the ContractSchema format.
   */
  private transformAbiToSchema(abi: AbiItem[], contractName: string): ContractSchema {
    logger.info('EvmAdapter', `Transforming ABI to ContractSchema for: ${contractName}`);
    const contractSchema: ContractSchema = {
      chainType: 'evm',
      name: contractName,
      functions: abi
        .filter((item) => item.type === 'function')
        .map((item) => ({
          id: `${item.name}_${item.inputs?.map((i) => i.type).join('_') || ''}`,
          name: item.name || '',
          displayName: this.formatMethodName(item.name || ''),
          inputs:
            item.inputs?.map((input) => ({
              name: input.name,
              type: input.type,
              displayName: this.formatInputName(input.name, input.type),
            })) || [],
          type: item.type || 'function',
          stateMutability: item.stateMutability,
          modifiesState: !item.stateMutability || !['view', 'pure'].includes(item.stateMutability),
        })),
    };
    logger.info(
      'EvmAdapter',
      `Transformation complete. Found ${contractSchema.functions.length} functions.`
    );
    return contractSchema;
  }

  /**
   * Map an EVM-specific parameter type to a form field type
   * @param parameterType The EVM parameter type (e.g., uint256, address)
   * @returns The appropriate form field type
   */
  mapParameterTypeToFieldType(parameterType: string): FieldType {
    // Check if this is an array type (ends with [] or [number])
    if (parameterType.match(/\[\d*\]$/)) {
      // All array types should use textarea for JSON input
      return 'textarea';
    }

    // Extract the base type from array types (e.g., uint256[] -> uint256)
    const baseType = parameterType.replace(/\[\d*\]/g, '');

    // Handle tuples (structs) - for now, just use a textarea
    if (baseType.startsWith('tuple')) {
      return 'textarea';
    }

    // Map common EVM types to appropriate field types
    return EVM_TYPE_TO_FIELD_TYPE[baseType] || 'text';
  }

  /**
   * Get field types compatible with a specific parameter type
   * @param parameterType The blockchain parameter type
   * @returns Array of compatible field types
   */
  getCompatibleFieldTypes(parameterType: string): FieldType[] {
    // Handle array and tuple types
    if (parameterType.match(/\[\d*\]$/)) {
      return ['textarea', 'text'];
    }

    const baseType = parameterType.replace(/\[\d*\]/g, '');

    if (baseType.startsWith('tuple')) {
      return ['textarea', 'text'];
    }

    // Define compatibility map
    const compatibilityMap: Record<string, FieldType[]> = {
      address: ['blockchain-address', 'text'],
      uint: ['number', 'amount', 'text'],
      uint8: ['number', 'amount', 'text'],
      uint16: ['number', 'amount', 'text'],
      uint32: ['number', 'amount', 'text'],
      uint64: ['number', 'amount', 'text'],
      uint128: ['number', 'amount', 'text'],
      uint256: ['number', 'amount', 'text'],
      int: ['number', 'text'],
      int8: ['number', 'text'],
      int16: ['number', 'text'],
      int32: ['number', 'text'],
      int64: ['number', 'text'],
      int128: ['number', 'text'],
      int256: ['number', 'text'],
      bool: ['checkbox', 'select', 'radio', 'text'],
      string: ['text', 'textarea', 'email', 'password'],
      bytes: ['textarea', 'text'],
      bytes32: ['text', 'textarea'],
    };

    return compatibilityMap[baseType] || ['text'];
  }

  /**
   * Generate default field configuration for an EVM function parameter
   * @param parameter The function parameter to convert to a form field
   * @returns A form field configuration with appropriate defaults
   */
  generateDefaultField<T extends FieldType = FieldType>(
    parameter: FunctionParameter
  ): FormFieldType<T> {
    // Get the field type
    const fieldType = this.mapParameterTypeToFieldType(parameter.type) as T;

    // Create a default field based on the parameter with proper typing
    return {
      id: generateId(),
      name: parameter.name || parameter.type,
      label: startCase(parameter.displayName || parameter.name || parameter.type),
      type: fieldType,
      placeholder: `Enter ${parameter.displayName || parameter.name || parameter.type}`,
      helperText: parameter.description || '',
      defaultValue: this.getDefaultValueForType(fieldType) as FieldValue<T>,
      validation: this.getDefaultValidationForType(parameter.type),
      width: 'full',
    };
  }

  /**
   * Get a default value for a field type
   * @param fieldType The form field type
   * @returns An appropriate default value
   */
  private getDefaultValueForType<T extends FieldType>(fieldType: T): FieldValue<T> {
    switch (fieldType) {
      case 'checkbox':
        return false as FieldValue<T>;
      case 'number':
      case 'amount':
        return 0 as FieldValue<T>;
      case 'blockchain-address':
        return '' as FieldValue<T>;
      default:
        return '' as FieldValue<T>;
    }
  }

  /**
   * Get default validation rules for a parameter type
   * @param parameterType The EVM parameter type
   * @returns Validation rules appropriate for the type
   */
  private getDefaultValidationForType(parameterType: string): {
    required?: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    custom?: (value: unknown) => boolean | string;
  } {
    const validation = { required: true };

    // Add specific validation rules based on the parameter type
    if (parameterType === 'blockchain-address') {
      return {
        ...validation,
        // Use the adapter's isValidAddress method for direct validation
        custom: (value: unknown): boolean | string => {
          // Empty values are handled by the required property
          if (value === '') return true;

          // We expect addresses to be strings
          if (typeof value !== 'string') return 'Address must be a string';

          // Validate the address format using the adapter's method
          return this.isValidAddress(value) ? true : 'Invalid address format';
        },
      };
    }

    return validation;
  }

  /**
   * Format transaction data for the specific chain
   */
  formatTransactionData(
    functionId: string,
    submittedInputs: Record<string, unknown>,
    allFieldsConfig: FormFieldType[]
  ): unknown {
    /*
     * TODO: Implement Full Hardcoded Value Merging and EVM ABI Encoding
     *
     * This function needs to construct the final ordered array of arguments
     * expected by the EVM function call, considering both user-submitted
     * data and hardcoded values defined in the configuration.
     *
     * Steps:
     * 1. Determine Argument Order: The order must match the function signature in the ABI.
     *    - It might be necessary to retrieve the original ABI definition for `functionId` here.
     *    - Alternatively, if `allFieldsConfig` preserves the original parameter order reliably,
     *      it can be used as the source of truth for iteration.
     *
     * 2. Iterate Through Expected Parameters (in order):
     *    - For each expected parameter:
     *      a. Find the corresponding field configuration in `allFieldsConfig` (using `field.name`).
     *      b. Check `field.isHardcoded`.
     *      c. If `true`, use `field.hardcodedValue`.
     *      d. If `false`, retrieve the value from `submittedInputs` using `field.name`.
     *      e. Handle cases where a non-hardcoded field might be missing from `submittedInputs`
     *         (this shouldn't happen if `isHidden` logic is correct, but add defensive checks).
     *
     * 3. Apply Type Transformations:
     *    - Based on the original EVM parameter type (e.g., `field.originalParameterType` or
     *      looked up from the ABI), convert the selected value (hardcoded or submitted)
     *      to the type expected by the encoding library (e.g., ethers.js).
     *    - Examples:
     *      - 'uint256': Convert string/number from form/hardcoded value to `BigInt`.
     *      - 'address': Ensure correct casing (checksummed) via `ethers.getAddress()`.
     *      - 'bool': Ensure value is `true` or `false`.
     *      - 'bytes': Convert hex string to appropriate format.
     *      - Arrays/Structs: Parse JSON strings (if textarea was used) or handle appropriately.
     *      - Use `field.transforms?.output` if available for custom transformations.
     *
     * 4. EVM ABI Encode (using ethers.js or similar):
     *    - Use a library like `ethers.js` (`Interface` class or `AbiCoder`)
     *      to encode the function selector and the prepared, ordered, type-corrected arguments
     *      into the final transaction `data` payload (hex string).
     *
     * 5. Return Formatted Transaction Object:
     *    - Return an object suitable for the next step (signing/broadcasting),
     *      including the `to` address (contract address), `data` (encoded payload),
     *      `value` (if payable), etc.
     */

    // --- Current Placeholder Logic ---
    console.log(`Formatting EVM transaction data for function: ${functionId}`);
    console.log('Submitted Inputs:', submittedInputs);
    console.log('All Fields Config:', allFieldsConfig);

    // Filter/map config for debugging (optional)
    const hardcoded = allFieldsConfig
      .filter((f) => f.isHardcoded)
      .map((f) => ({ name: f.name, value: f.hardcodedValue }));
    const hidden = allFieldsConfig.filter((f) => f.isHidden).map((f) => f.name);
    console.log('Hardcoded fields:', hardcoded);
    console.log('Hidden fields:', hidden);

    // Placeholder return - Replace with actual encoded data
    return {
      to: '0x1234567890123456789012345678901234567890', // Replace with actual contract address
      data: `0x${functionId.substring(0, 8)}0000...`, // Placeholder - Replace with encoded function call
      value: '0', // Replace if payable
      gasLimit: '100000', // Example gas limit
    };
  }

  /**
   * Sign and broadcast a transaction
   */
  async signAndBroadcast(transactionData: unknown): Promise<{ txHash: string }> {
    // In a real implementation, this would use ethers.js or web3.js to sign and broadcast
    console.log('Signing and broadcasting EVM transaction:', transactionData);

    // Return a mock transaction hash
    return {
      txHash: `0x${Math.random().toString(16).substring(2, 42)}`,
    };
  }

  /**
   * Format a method name for display
   */
  private formatMethodName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Format an input name for display
   */
  private formatInputName(name: string, type: string): string {
    if (!name || name === '') {
      return `Parameter (${type})`;
    }
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  }

  /**
   * Get only the functions that modify state (writable functions)
   * @param contractSchema The contract schema to filter
   * @returns Array of writable functions
   */
  getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'] {
    return contractSchema.functions.filter((fn) => fn.modifiesState);
  }

  /**
   * Validate an EVM blockchain address
   * @param address The address to validate
   * @returns Whether the address is a valid EVM address
   */
  isValidAddress(address: string): boolean {
    return isAddress(address);
  }

  /**
   * @inheritdoc
   * TODO: Implement actual supported methods for EVM (e.g., EOA, Safe).
   */
  public async getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
    // Placeholder: Assume only EOA is supported for now
    console.warn('EVMAdapter.getSupportedExecutionMethods is using placeholder implementation.');
    return Promise.resolve([
      {
        type: 'eoa',
        name: 'EOA (External Account)',
        description: 'Execute using a standard wallet address.',
      },
      {
        type: 'multisig',
        name: 'Safe Multisig', // Example for future
        description: 'Execute via a Safe multisignature wallet.',
        disabled: false, // Enable for UI testing, even if not fully implemented
      },
      // Add a basic relayer placeholder for UI testing
      {
        type: 'relayer',
        name: 'Relayer (Placeholder)',
        description: 'Execute via a OpenZeppelin transaction relayer (not yet implemented).',
        disabled: false, // Enable for UI testing, even if not fully implemented
      },
    ]);
  }

  /**
   * @inheritdoc
   * TODO: Implement actual validation logic for EVM execution configs.
   */
  public async validateExecutionConfig(config: ExecutionConfig): Promise<true | string> {
    console.warn('EVMAdapter.validateExecutionConfig is using placeholder implementation.');

    switch (config.method) {
      case 'eoa': {
        if (!config.allowAny) {
          if (!config.specificAddress) {
            return 'Specific EOA address is required.';
          }
          if (!this.isValidAddress(config.specificAddress)) {
            return 'Invalid EOA address format.';
          }
        }
        return true; // Placeholder: EOA config is valid if address format is okay
      }
      case 'multisig': {
        // Placeholder: Accept multisig config for now
        // TODO: Add Safe-specific validation (e.g., check if address is a valid Safe)
        return true;
      }
      case 'relayer': {
        // Placeholder: Accept relayer config for now
        // TODO: Add relayer-specific validation
        return true;
      }
      default: {
        // This handles the 'never' case for exhaustive checks
        const exhaustiveCheck: never = config;
        return `Unsupported execution method type: ${(exhaustiveCheck as ExecutionConfig).method}`;
      }
    }
  }

  /**
   * Load a mock contract for testing
   * @param mockId Optional ID to specify which mock to load
   */
  async loadMockContract(mockId?: string): Promise<ContractSchema> {
    try {
      const mocks = await MockContractService.getAvailableMocks();
      const mockInfo = mockId
        ? mocks.find((mock: MockContractInfo) => mock.id === mockId)
        : mocks.find((mock: MockContractInfo) => mock.id === 'input-tester');

      if (!mockInfo) {
        throw new Error(`Mock contract with ID ${mockId || 'input-tester'} not found`);
      }

      const mockAbi = (await MockContractService.getMockAbi(mockInfo.file)) as AbiItem[];
      const contractName = mockInfo.name;

      // Use the shared transformer
      return this.transformAbiToSchema(mockAbi, contractName);
    } catch (error) {
      // Type assertion for error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error loading mock EVM contract:', errorMessage);
      throw new Error('Failed to load mock EVM contract');
    }
  }
}

// Also export as default to ensure compatibility with various import styles
export default EvmAdapter;
