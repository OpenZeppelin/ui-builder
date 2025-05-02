import type { GetAccountReturnType } from '@wagmi/core';
import { startCase } from 'lodash';
import {
  type Abi,
  type AbiFunction,
  type AbiStateMutability,
  type PublicClient,
  type TransactionReceipt,
  createPublicClient,
  getAddress,
  http,
  isAddress,
} from 'viem';
import { mainnet } from 'viem/chains';

import type {
  Connector,
  ContractAdapter,
  ExecutionConfig,
  ExecutionMethodDetail,
} from '@openzeppelin/transaction-form-types/adapters';
import type {
  ContractFunction,
  ContractSchema,
  FunctionParameter,
} from '@openzeppelin/transaction-form-types/contracts';
import type {
  FieldType,
  FieldValue,
  FormFieldType,
} from '@openzeppelin/transaction-form-types/forms';

// --- Import Mock ABIs Directly ---
import ERC20_MOCK from './mocks/ERC20_MOCK.json';
import ERC721_MOCK from './mocks/ERC721_MOCK.json';
import INPUT_TESTER_MOCK from './mocks/INPUT_TESTER_MOCK.json';
import { stringifyWithBigInt } from './utils/json';
import { WagmiWalletImplementation } from './wallet-connect/wagmi-implementation';

import type { AbiItem } from './types';

const mockAbis: Record<string, { name: string; abi: AbiItem[] }> = {
  erc20: { name: 'MockERC20', abi: ERC20_MOCK as AbiItem[] },
  erc721: { name: 'MockERC721', abi: ERC721_MOCK as AbiItem[] },
  'input-tester': { name: 'InputTester', abi: INPUT_TESTER_MOCK as AbiItem[] },
};
// --- End Mock ABI Imports ---

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

// Define the expected structure for transaction data passed to signAndBroadcast
interface WriteContractParameters {
  address: `0x${string}`; // Ensure address is a valid hex string type
  abi: Abi;
  functionName: string;
  args: unknown[];
  value?: bigint;
  // Add other potential viem parameters if needed (e.g., gas)
}

/**
 * EVM-specific adapter implementation
 */
export class EvmAdapter implements ContractAdapter {
  /**
   * Private implementation of wallet connection using Wagmi
   */
  private walletImplementation: WagmiWalletImplementation;

  constructor() {
    // Initialize the Wagmi wallet implementation
    this.walletImplementation = new WagmiWalletImplementation();
  }

  /**
   * Private helper to get a PublicClient instance.
   * Uses the connected wallet's client if available,
   * otherwise falls back to a default public RPC client.
   * Throws an error if a client cannot be obtained.
   */
  private getPublicClientForQuery(): PublicClient {
    const accountStatus = this.walletImplementation.getWalletConnectionStatus();
    let publicClient: PublicClient | null = null;

    if (accountStatus.isConnected && accountStatus.chainId) {
      // Use client configured for the connected wallet's chain
      publicClient = this.walletImplementation.getPublicClient();
      console.log(
        `Using connected wallet's public client (Chain ID: ${accountStatus.chainId}) for query.`
      );
    } else {
      // Not connected, create a temporary public client using default RPC
      console.log('Wallet not connected, creating default public RPC client for query.');
      const defaultRpcUrl = import.meta.env.VITE_RPC_URL || 'https://eth.llamarpc.com';
      if (!defaultRpcUrl) {
        throw new Error('Default VITE_RPC_URL is not configured for connectionless queries.');
      }
      const defaultChain = mainnet;
      try {
        publicClient = createPublicClient({
          chain: defaultChain,
          transport: http(defaultRpcUrl),
        });
      } catch (error) {
        console.error('Failed to create default public client:', error);
        throw new Error(`Failed to create default public client: ${(error as Error).message}`);
      }
    }

    if (!publicClient) {
      // This path should ideally be unreachable due to the logic above
      throw new Error('Failed to obtain Public Client for query.');
    }

    return publicClient;
  }

  /**
   * @inheritdoc
   */
  async loadContract(source: string): Promise<ContractSchema> {
    if (isAddress(source)) {
      console.info('EvmAdapter', `Detected address: ${source}. Attempting Etherscan ABI fetch...`);
      return this.loadAbiFromEtherscan(source);
    } else {
      console.info('EvmAdapter', 'Input is not an address. Attempting to parse as JSON ABI...');
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
      console.error('EvmAdapter', 'Failed to parse source string as JSON ABI:', error);
      throw new Error(`Invalid JSON ABI provided: ${(error as Error).message}`);
    }

    console.info('EvmAdapter', `Successfully parsed JSON ABI with ${abi.length} items.`);
    const contractName = 'ContractFromABI'; // Default name for direct ABI
    return this.transformAbiToSchema(abi, contractName, undefined);
  }

  /**
   * Fetches and parses an ABI from Etherscan using a contract address.
   */
  private async loadAbiFromEtherscan(address: string): Promise<ContractSchema> {
    const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY;
    if (!apiKey) {
      console.error('EvmAdapter', 'Etherscan API Key (VITE_ETHERSCAN_API_KEY) is missing.');
      throw new Error('Etherscan API Key is not configured.');
    }

    // TODO: Make network dynamic
    const apiBaseUrl = 'https://api.etherscan.io/api'; // Mainnet default
    const url = `${apiBaseUrl}?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;

    let response: Response;
    try {
      console.info('EvmAdapter', `Fetching ABI from Etherscan for address: ${address}`);
      response = await fetch(url);
    } catch (networkError) {
      console.error('EvmAdapter', 'Network error fetching ABI from Etherscan:', networkError);
      throw new Error(`Network error fetching ABI: ${(networkError as Error).message}`);
    }

    if (!response.ok) {
      console.error('EvmAdapter', `Etherscan API request failed with status: ${response.status}`);
      throw new Error(`Etherscan API request failed: ${response.status} ${response.statusText}`);
    }

    let etherscanResult: { status: string; message: string; result: string };
    try {
      etherscanResult = await response.json();
    } catch (jsonError) {
      console.error('EvmAdapter', 'Failed to parse Etherscan API response as JSON:', jsonError);
      throw new Error('Invalid JSON response received from Etherscan API.');
    }

    if (etherscanResult.status !== '1') {
      console.warn(
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
      console.error('EvmAdapter', 'Failed to parse ABI JSON string from Etherscan result:', error);
      throw new Error(`Invalid ABI JSON received from Etherscan: ${(error as Error).message}`);
    }

    console.info('EvmAdapter', `Successfully parsed Etherscan ABI with ${abi.length} items.`);
    // TODO: Fetch contract name?
    const contractName = `Contract_${address.substring(0, 6)}`;
    return this.transformAbiToSchema(abi, contractName, address);
  }

  /**
   * Transforms a standard ABI array into the ContractSchema format.
   * @param abi The ABI array to transform
   * @param contractName The name to use for the contract
   * @param address Optional contract address to include in the schema
   */
  private transformAbiToSchema(
    abi: AbiItem[],
    contractName: string,
    address?: string
  ): ContractSchema {
    console.info('EvmAdapter', `Transforming ABI to ContractSchema for: ${contractName}`);
    const contractSchema: ContractSchema = {
      chainType: 'evm',
      name: contractName,
      address,
      functions: abi
        .filter((item) => item.type === 'function')
        .map((item) => ({
          id: `${item.name}_${item.inputs?.map((i) => i.type).join('_') || ''}`,
          name: item.name || '',
          displayName: this.formatMethodName(item.name || ''),
          inputs:
            item.inputs?.map((input) => ({
              name: input.name || '',
              type: input.type,
              displayName: this.formatInputName(input.name, input.type),
              ...(input.components ? { components: input.components } : {}),
            })) || [],
          outputs:
            item.outputs?.map((output) => ({
              name: output.name || '',
              type: output.type,
              ...(output.components ? { components: output.components } : {}),
            })) || [],
          type: 'function',
          stateMutability: item.stateMutability,
          modifiesState: !item.stateMutability || !['view', 'pure'].includes(item.stateMutability),
        })),
    };
    console.info(
      'EvmAdapter',
      `Transformation complete. Found ${contractSchema.functions.length} functions.`
    );
    return contractSchema;
  }

  /**
   * @inheritdoc
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
   * @inheritdoc
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
   * @inheritdoc
   */
  generateDefaultField<T extends FieldType = FieldType>(
    parameter: FunctionParameter
  ): FormFieldType<T> {
    const fieldType = this.mapParameterTypeToFieldType(parameter.type) as T;
    return {
      id: `field-${Math.random().toString(36).substring(2, 9)}`,
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
   * Recursively parses a raw input value based on its expected ABI type definition.
   *
   * @param param The ABI parameter definition ({ name, type, components?, ... })
   * @param rawValue The raw value obtained from the form input or hardcoded config.
   * @param isRecursive Internal flag to indicate if the call is nested.
   * @returns The parsed and typed value suitable for ABI encoding.
   * @throws {Error} If parsing or type validation fails.
   */
  private parseEvmInput(param: FunctionParameter, rawValue: unknown, isRecursive = false): unknown {
    const { type, name } = param;
    const baseType = type.replace(/\[\d*\]$/, ''); // Remove array indicators like `[]` or `[2]`
    const isArray = type.endsWith(']');

    try {
      // --- Handle Arrays --- //
      if (isArray) {
        // Only expect string at the top level, recursive calls get arrays directly
        let parsedArray: unknown[];
        if (!isRecursive) {
          if (typeof rawValue !== 'string') {
            throw new Error('Array input must be a JSON string representation.');
          }
          try {
            parsedArray = JSON.parse(rawValue);
          } catch (e) {
            throw new Error(`Invalid JSON for array: ${(e as Error).message}`);
          }
        } else {
          // If recursive, rawValue should already be an array
          if (!Array.isArray(rawValue)) {
            throw new Error('Internal error: Expected array in recursive call.');
          }
          parsedArray = rawValue;
        }

        if (!Array.isArray(parsedArray)) {
          // Double check after parsing/assignment
          throw new Error('Parsed JSON is not an array.');
        }

        // Recursively parse each element
        const itemAbiParam = { ...param, type: baseType }; // Create a dummy param for the base type
        return parsedArray.map((item) => this.parseEvmInput(itemAbiParam, item, true)); // Pass isRecursive=true
      }

      // --- Handle Tuples --- //
      if (baseType === 'tuple') {
        if (!param.components) {
          throw new Error(`ABI definition missing 'components' for tuple parameter '${name}'.`);
        }
        // Only expect string at the top level, recursive calls get objects directly
        let parsedObject: Record<string, unknown>;
        if (!isRecursive) {
          if (typeof rawValue !== 'string') {
            throw new Error('Tuple input must be a JSON string representation of an object.');
          }
          try {
            parsedObject = JSON.parse(rawValue);
          } catch (e) {
            throw new Error(`Invalid JSON for tuple: ${(e as Error).message}`);
          }
        } else {
          // If recursive, rawValue should already be an object
          if (typeof rawValue !== 'object' || rawValue === null || Array.isArray(rawValue)) {
            throw new Error('Internal error: Expected object in recursive tuple call.');
          }
          parsedObject = rawValue as Record<string, unknown>; // Cast needed
        }

        if (
          typeof parsedObject !== 'object' ||
          parsedObject === null ||
          Array.isArray(parsedObject)
        ) {
          // Double check
          throw new Error('Parsed JSON is not an object for tuple.');
        }

        // Recursively parse each component
        const resultObject: Record<string, unknown> = {};
        for (const component of param.components) {
          if (!(component.name in parsedObject)) {
            throw new Error(`Missing component '${component.name}' in tuple JSON.`);
          }
          resultObject[component.name] = this.parseEvmInput(
            component,
            parsedObject[component.name],
            true // Pass isRecursive=true
          );
        }
        // Check for extra, unexpected keys in the provided JSON object
        if (Object.keys(parsedObject).length !== param.components.length) {
          const expectedKeys = param.components.map((c) => c.name).join(', ');
          const actualKeys = Object.keys(parsedObject).join(', ');
          throw new Error(
            `Tuple object has incorrect number of keys. Expected ${param.components.length} (${expectedKeys}), but got ${Object.keys(parsedObject).length} (${actualKeys}).`
          );
        }
        return resultObject;
      }

      // --- Handle Bytes --- //
      if (baseType.startsWith('bytes')) {
        if (typeof rawValue !== 'string') {
          throw new Error('Bytes input must be a string.');
        }
        if (!/^0x([0-9a-fA-F]{2})*$/.test(rawValue)) {
          throw new Error(
            `Invalid hex string format for ${type}: must start with 0x and contain only hex characters.`
          );
        }
        // Check byte length for fixed-size bytes? (e.g., bytes32)
        const fixedSizeMatch = baseType.match(/^bytes(\d+)$/);
        if (fixedSizeMatch) {
          const expectedBytes = parseInt(fixedSizeMatch[1], 10);
          const actualBytes = (rawValue.length - 2) / 2;
          if (actualBytes !== expectedBytes) {
            throw new Error(
              `Invalid length for ${type}: expected ${expectedBytes} bytes (${expectedBytes * 2} hex chars), got ${actualBytes} bytes.`
            );
          }
        }
        return rawValue as `0x${string}`; // Already validated, cast to viem type
      }

      // --- Handle Simple Types --- //
      if (baseType.startsWith('uint') || baseType.startsWith('int')) {
        if (rawValue === '' || rawValue === null || rawValue === undefined)
          throw new Error('Numeric value cannot be empty.');
        try {
          // Use BigInt for all integer types
          return BigInt(rawValue as string | number | bigint);
        } catch {
          throw new Error(`Invalid numeric value: '${rawValue}'.`);
        }
      } else if (baseType === 'address') {
        if (typeof rawValue !== 'string' || !rawValue)
          throw new Error('Address value must be a non-empty string.');
        if (!isAddress(rawValue)) throw new Error(`Invalid address format: '${rawValue}'.`);
        return getAddress(rawValue); // Return checksummed address
      } else if (baseType === 'bool') {
        if (typeof rawValue === 'boolean') return rawValue;
        if (typeof rawValue === 'string') {
          const lowerVal = rawValue.toLowerCase().trim();
          if (lowerVal === 'true') return true;
          if (lowerVal === 'false') return false;
        }
        // Try simple truthy/falsy conversion as fallback, but might be too lenient?
        // Consider throwing error if not explicit boolean or 'true'/'false' string
        // For now, keep simple conversion:
        return Boolean(rawValue);
      } else if (baseType === 'string') {
        // Ensure it's treated as a string
        return String(rawValue);
      }

      // --- Fallback for unknown types --- //
      console.warn(`Unknown EVM parameter type encountered: '${type}'. Using raw value.`);
      return rawValue;
    } catch (error) {
      // Add parameter context to the error message
      throw new Error(
        `Failed to parse value for parameter '${name || '(unnamed)'}' (type '${type}'): ${(error as Error).message}`
      );
    }
  }

  /**
   * Private helper to convert internal function details to viem AbiFunction format.
   */
  private createAbiFunctionItem(functionDetails: ContractFunction): AbiFunction {
    return {
      name: functionDetails.name,
      type: 'function',
      // Correctly map inputs, including components
      inputs: functionDetails.inputs.map((i) => ({
        name: i.name || '',
        type: i.type,
        ...(i.components && { components: i.components }),
      })),
      // Correctly map outputs, including components
      outputs:
        functionDetails.outputs?.map((o) => ({
          name: o.name || '',
          type: o.type,
          ...(o.components && { components: o.components }),
        })) || [],
      stateMutability: (functionDetails.stateMutability ?? 'view') as AbiStateMutability,
    };
  }

  /**
   * @inheritdoc
   */
  formatTransactionData(
    contractSchema: ContractSchema,
    functionId: string,
    submittedInputs: Record<string, unknown>,
    allFieldsConfig: FormFieldType[]
  ): unknown {
    console.log(`Formatting EVM transaction data for function: ${functionId}`);
    console.log('Contract Schema Provided:', contractSchema.name, contractSchema.address);
    console.log('Submitted Inputs:', submittedInputs);
    console.log('All Fields Config:', allFieldsConfig);

    // --- Step 1: Determine Argument Order --- //
    const functionDetails = contractSchema.functions.find((fn) => fn.id === functionId);
    if (!functionDetails) {
      throw new Error(
        `Function definition for ${functionId} not found in provided contract schema.`
      );
    }
    const expectedArgs = functionDetails.inputs;
    console.log('Expected Arguments (Order & Type):', expectedArgs);

    // --- Step 2: Iterate and Select Values --- //
    const orderedRawValues: unknown[] = [];
    for (const expectedArg of expectedArgs) {
      const fieldConfig = allFieldsConfig.find(
        (field) => field.name === expectedArg.name // Match by name only now
      );
      if (!fieldConfig) {
        throw new Error(`Configuration missing for argument: ${expectedArg.name}`);
      }

      let value: unknown;
      if (fieldConfig.isHardcoded) {
        value = fieldConfig.hardcodedValue;
        console.log(`Using hardcoded value for ${fieldConfig.name}:`, value);
      } else if (fieldConfig.isHidden) {
        // This case should ideally be prevented by the UI/config validation
        throw new Error(`Field '${fieldConfig.name}' cannot be hidden without being hardcoded.`);
      } else {
        if (!(fieldConfig.name in submittedInputs)) {
          // This should ideally be caught by form validation (required fields)
          throw new Error(`Missing submitted input for required field: ${fieldConfig.name}`);
        }
        value = submittedInputs[fieldConfig.name];
        console.log(`Using submitted value for ${fieldConfig.name}:`, value);
      }
      orderedRawValues.push(value);
    }
    console.log('Ordered Raw Values (Before Transformation):', orderedRawValues);

    // --- Step 3: Parse/Transform Values using the new parser --- //
    const transformedArgs = expectedArgs.map((param, index) => {
      const rawValue = orderedRawValues[index];
      return this.parseEvmInput(param, rawValue, false); // Initial call is not recursive
    });
    console.log('Transformed Arguments:', transformedArgs);

    // --- Step 4 & 5: Prepare Return Object --- //
    const isPayable = functionDetails.stateMutability === 'payable';
    let transactionValue = '0';
    if (isPayable) {
      console.warn('Payable function detected, but sending 0 ETH. Implement value input.');
    }

    // Use the helper to create the ABI item
    const functionAbiItem = this.createAbiFunctionItem(functionDetails);

    if (!contractSchema.address || !isAddress(contractSchema.address)) {
      throw new Error('Contract address is missing or invalid in the provided schema.');
    }

    // This structure IS what signAndBroadcast needs, but we return unknown for interface compatibility for now
    const paramsForSignAndBroadcast: WriteContractParameters = {
      address: contractSchema.address,
      abi: [functionAbiItem], // Pass the specific function ABI item directly
      functionName: functionDetails.name,
      args: transformedArgs,
      value: BigInt(transactionValue),
    };
    return paramsForSignAndBroadcast;
  }

  /**
   * @inheritdoc
   */
  async signAndBroadcast(transactionData: WriteContractParameters): Promise<{ txHash: string }> {
    console.log('Attempting to sign and broadcast EVM transaction:', transactionData);

    // 1. Get the Wallet Client
    const walletClient = await this.walletImplementation.getWalletClient();
    if (!walletClient) {
      console.error('signAndBroadcast: Wallet client not available. Is wallet connected?');
      throw new Error('Wallet is not connected or client is unavailable.');
    }

    // 2. Get the connected account
    const accountStatus = this.walletImplementation.getWalletConnectionStatus();
    if (!accountStatus.isConnected || !accountStatus.address) {
      console.error('signAndBroadcast: Account not available. Is wallet connected?');
      throw new Error('Wallet is not connected or account address is unavailable.');
    }

    try {
      // 3. Call viem's writeContract
      console.log('Calling walletClient.writeContract with:', {
        account: accountStatus.address,
        address: transactionData.address,
        abi: transactionData.abi,
        functionName: transactionData.functionName,
        args: transactionData.args,
        value: transactionData.value,
        chain: walletClient.chain, // Pass the chain explicitly
      });

      const hash = await walletClient.writeContract({
        account: accountStatus.address,
        address: transactionData.address,
        abi: transactionData.abi,
        functionName: transactionData.functionName,
        args: transactionData.args,
        value: transactionData.value,
        chain: walletClient.chain, // Explicitly pass the chain from the client
      });

      console.log('Transaction initiated successfully. Hash:', hash);
      return { txHash: hash };
    } catch (error: unknown) {
      console.error('Error during writeContract call:', error);
      // TODO: Improve error parsing (Phase 4)
      const errorMessage = error instanceof Error ? error.message : 'Unknown transaction error';
      throw new Error(`Transaction failed: ${errorMessage}`);
    }
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
   * @inheritdoc
   */
  getWritableFunctions(contractSchema: ContractSchema): ContractSchema['functions'] {
    return contractSchema.functions.filter((fn) => fn.modifiesState);
  }

  /**
   * @inheritdoc
   */
  isValidAddress(address: string): boolean {
    return isAddress(address);
  }

  /**
   * @inheritdoc
   * TODO: Implement actual supported methods for EVM (e.g., EOA, Safe).
   */
  public async getSupportedExecutionMethods(): Promise<ExecutionMethodDetail[]> {
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
        return `Unsupported execution method type: ${(config as ExecutionConfig).method}`;
      }
    }
  }

  /**
   * @inheritdoc
   */
  async loadMockContract(mockId?: string): Promise<ContractSchema> {
    const targetMockId = mockId || 'input-tester';
    const mockData = mockAbis[targetMockId];

    if (!mockData) {
      const errorMessage = `Mock contract with ID '${targetMockId}' not found. Available mocks: ${Object.keys(mockAbis).join(', ')}`;
      console.error('EvmAdapter', errorMessage);
      throw new Error(errorMessage);
    }

    try {
      console.info('EvmAdapter', `Loading mock contract ABI for: ${mockData.name}`);
      const mockAbi = mockData.abi;

      if (!Array.isArray(mockAbi)) {
        throw new Error(`Mock ABI for ${mockData.name} did not contain a valid array.`);
      }

      // Always provide a valid address for test schemas
      const address = '0x1234567890123456789012345678901234567890';
      return this.transformAbiToSchema(mockAbi, mockData.name, address);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        'EvmAdapter',
        `Error processing mock EVM contract (${mockData.name}):`,
        errorMessage
      );
      throw new Error(`Failed to process mock EVM contract: ${errorMessage}`);
    }
  }

  /**
   * @inheritdoc
   */
  isViewFunction(functionDetails: ContractFunction): boolean {
    return functionDetails.stateMutability === 'view' || functionDetails.stateMutability === 'pure';
  }

  /**
   * @inheritdoc
   */
  async queryViewFunction(
    contractAddress: string,
    functionId: string,
    params: unknown[] = [],
    contractSchema?: ContractSchema
  ): Promise<unknown> {
    console.log(`Querying view function: ${functionId} on ${contractAddress}`, { params });
    try {
      // Use the helper method to get the appropriate client
      const publicClient = this.getPublicClientForQuery();

      // --- Validate Address --- //
      if (!contractAddress || !isAddress(contractAddress)) {
        throw new Error(`Invalid contract address provided: ${contractAddress}`);
      }

      // --- Get Schema & Function Details --- //
      const schema = contractSchema || (await this.loadContract(contractAddress));
      const functionDetails = schema.functions.find((fn) => fn.id === functionId);
      if (!functionDetails) {
        throw new Error(`Function with ID ${functionId} not found in contract schema.`);
      }
      if (!this.isViewFunction(functionDetails)) {
        // Should ideally be prevented by UI, but double-check
        throw new Error(`Function ${functionDetails.name} is not a view function.`);
      }

      // --- Parse Input Parameters --- //
      const expectedInputs = functionDetails.inputs;
      if (params.length !== expectedInputs.length) {
        throw new Error(
          `Incorrect number of parameters provided for ${functionDetails.name}. Expected ${expectedInputs.length}, got ${params.length}.`
        );
      }
      const args = expectedInputs.map((inputParam, index) => {
        const rawValue = params[index];
        // Use the existing helper, initial call is not recursive
        return this.parseEvmInput(inputParam, rawValue, false);
      });
      console.log('Parsed Args for readContract:', args);

      // Use the helper to create the ABI item
      const functionAbiItem = this.createAbiFunctionItem(functionDetails);

      console.log(
        `[Query ${functionDetails.name}] Calling readContract with ABI:`,
        functionAbiItem,
        'Args:',
        args
      );

      // --- Call readContract --- //
      let decodedResult: unknown;
      try {
        decodedResult = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: [functionAbiItem],
          functionName: functionDetails.name,
          args: args, // Pass the parsed arguments
        });
      } catch (readError) {
        console.error(
          `[Query ${functionDetails.name}] publicClient.readContract specific error:`,
          readError
        );
        throw new Error(
          `Viem readContract failed for ${functionDetails.name}: ${(readError as Error).message}`
        );
      }

      console.log(`[Query ${functionDetails.name}] Raw decoded result:`, decodedResult);

      return decodedResult; // Return the already decoded result
    } catch (error) {
      const errorMessage = `Failed to query view function ${functionId}: ${(error as Error).message}`;
      console.error(`EvmAdapter.queryViewFunction Error: ${errorMessage}`, {
        contractAddress,
        functionId,
        params,
        error,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * @inheritdoc
   */
  formatFunctionResult(decodedValue: unknown, functionDetails: ContractFunction): string {
    if (!functionDetails.outputs || !Array.isArray(functionDetails.outputs)) {
      console.warn(
        `formatFunctionResult: Output ABI definition missing or invalid for function ${functionDetails.name}.`
      );
      return '[Error: Output ABI definition missing]';
    }

    try {
      let valueToFormat: unknown;
      if (Array.isArray(decodedValue)) {
        if (decodedValue.length === 1) {
          valueToFormat = decodedValue[0]; // Single output, format the inner value
        } else {
          // Multiple outputs, format the whole array as JSON
          valueToFormat = decodedValue;
        }
      } else {
        // Not an array, could be a single value (like from a struct return) or undefined
        valueToFormat = decodedValue;
      }

      // Now format valueToFormat based on its type
      if (typeof valueToFormat === 'bigint') {
        return valueToFormat.toString();
      } else if (
        typeof valueToFormat === 'string' ||
        typeof valueToFormat === 'number' ||
        typeof valueToFormat === 'boolean'
      ) {
        return String(valueToFormat);
      } else if (valueToFormat === null || valueToFormat === undefined) {
        return '(null)'; // Represent null/undefined clearly
      } else {
        // Handles arrays with multiple elements or objects (structs) by stringifying
        return stringifyWithBigInt(valueToFormat, 2); // Pretty print with 2 spaces
      }
    } catch (error) {
      const errorMessage = `Error formatting result for ${functionDetails.name}: ${(error as Error).message}`;
      console.error(`EvmAdapter.formatFunctionResult Error: ${errorMessage}`, {
        functionName: functionDetails.name,
        decodedValue,
        error,
      });
      return `[${errorMessage}]`;
    }
  }

  /**
   * @inheritdoc
   */
  supportsWalletConnection(): boolean {
    return true; // EVM adapter supports wallet connection via Wagmi
  }

  /**
   * @inheritdoc
   */
  async getAvailableConnectors(): Promise<Connector[]> {
    return this.walletImplementation.getAvailableConnectors();
  }

  /**
   * @inheritdoc
   */
  async connectWallet(
    connectorId: string
  ): Promise<{ connected: boolean; address?: string; error?: string }> {
    // Delegate to the Wagmi implementation
    return this.walletImplementation.connect(connectorId);
  }

  /**
   * @inheritdoc
   */
  async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
    // Delegate to the Wagmi implementation
    return this.walletImplementation.disconnect();
  }

  /**
   * @inheritdoc
   */
  getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
    // Delegate to the Wagmi implementation and map the result
    const status = this.walletImplementation.getWalletConnectionStatus();
    return {
      isConnected: status.isConnected,
      address: status.address,
      // Convert chainId from number to string for the interface
      chainId: status.chainId?.toString(),
    };
  }

  /**
   * @inheritdoc
   */
  onWalletConnectionChange(
    callback: (account: GetAccountReturnType, prevAccount: GetAccountReturnType) => void
  ): () => void {
    // Delegate to the Wagmi implementation
    return this.walletImplementation.onWalletConnectionChange(callback);
  }

  /**
   * @inheritdoc
   */
  getExplorerUrl(address: string, _chainId?: string): string | null {
    // TODO: Enhance this to use the actual connected chainId from getWalletConnectionStatus
    // and potentially support multiple explorers based on the chain.
    // For now, defaults to Etherscan (Mainnet).
    if (!this.isValidAddress(address)) return null;
    return `https://etherscan.io/address/${address}`;
  }

  /**
   * @inheritdoc
   */
  getExplorerTxUrl?(txHash: string): string | null {
    // TODO: Enhance this to use the actual connected chainId
    if (!txHash) return null;
    return `https://etherscan.io/tx/${txHash}`;
  }

  /**
   * @inheritdoc
   */
  async waitForTransactionConfirmation(txHash: string): Promise<{
    status: 'success' | 'error';
    receipt?: TransactionReceipt;
    error?: Error;
  }> {
    console.info('EvmAdapter.waitForTransactionConfirmation', `Waiting for tx: ${txHash}`);
    try {
      // Get the public client (synchronous in wagmi v2)
      const publicClient = this.walletImplementation.getPublicClient();
      if (!publicClient) {
        throw new Error('Public client not available to wait for transaction.');
      }

      // Wait for the transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      console.info('EvmAdapter.waitForTransactionConfirmation', 'Received receipt:', receipt);

      // Check the status field in the receipt
      if (receipt.status === 'success') {
        return { status: 'success', receipt };
      } else {
        console.error(
          'EvmAdapter.waitForTransactionConfirmation',
          'Transaction reverted:',
          receipt
        );
        return { status: 'error', receipt, error: new Error('Transaction reverted.') };
      }
    } catch (error) {
      console.error(
        'EvmAdapter.waitForTransactionConfirmation',
        'Error waiting for transaction confirmation:',
        error
      );
      return {
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

// Also export as default to ensure compatibility with various import styles
export default EvmAdapter;
