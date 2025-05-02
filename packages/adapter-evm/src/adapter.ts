import type { GetAccountReturnType } from '@wagmi/core';
import { Contract, JsonRpcProvider } from 'ethers';
import { startCase } from 'lodash';
import { type Abi, type AbiStateMutability, getAddress, isAddress } from 'viem';

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
              name: input.name,
              type: input.type,
              displayName: this.formatInputName(input.name, input.type),
            })) || [],
          type: item.type || 'function',
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
    // Use the provided schema directly
    const schema = contractSchema;

    const functionDetails = schema.functions.find((fn) => fn.id === functionId);
    if (!functionDetails) {
      console.error(`formatTransactionData: Function with ID ${functionId} not found in schema.`);
      throw new Error(
        `Function definition for ${functionId} not found in provided contract schema.`
      );
    }

    console.log('Function Details Found:', functionDetails);

    const expectedArgs = functionDetails.inputs;
    console.log('Expected Arguments (Order & Type):', expectedArgs);

    // --- Step 2: Iterate and Select Values --- //
    const orderedValues: unknown[] = [];
    for (const expectedArg of expectedArgs) {
      const fieldConfig = allFieldsConfig.find(
        (field) => field.name === expectedArg.name || field.name === expectedArg.type
      );
      if (!fieldConfig) {
        throw new Error(
          `Configuration missing for argument: ${expectedArg.name || expectedArg.type}`
        );
      }
      let value: unknown;
      if (fieldConfig.isHardcoded) {
        value = fieldConfig.hardcodedValue;
      } else if (fieldConfig.isHidden) {
        throw new Error(`Field '${fieldConfig.name}' cannot be hidden without being hardcoded.`);
      } else {
        if (!(fieldConfig.name in submittedInputs)) {
          throw new Error(`Missing submitted input for field: ${fieldConfig.name}`);
        }
        value = submittedInputs[fieldConfig.name];
      }
      orderedValues.push(value);
    }
    console.log('Ordered Values (Before Transformation):', orderedValues);

    // --- Step 3: Apply Type Transformations --- //
    // TODO: Implement a more robust, potentially bidirectional serialization/deserialization
    //       mechanism for handling inputs/outputs, especially for complex types (arrays, tuples)
    //       and bytes. The current JSON.parse/stringify approach for complex types and the
    //       placeholder for bytes are naive and may not handle all edge cases or ABI requirements correctly.
    const transformedArgs = expectedArgs.map((param, index) => {
      const rawValue = orderedValues[index];
      const paramType = param.type;
      try {
        if (paramType.startsWith('uint') || paramType.startsWith('int')) {
          if (rawValue === '') throw new Error('Numeric value cannot be empty');
          try {
            return BigInt(rawValue as string | number | bigint);
          } catch {
            throw new Error(`Invalid numeric value: ${rawValue}`);
          }
        } else if (paramType === 'address') {
          if (typeof rawValue !== 'string' || !rawValue)
            throw new Error('Address value must be a non-empty string');
          if (!isAddress(rawValue)) throw new Error(`Invalid address format: ${rawValue}`);
          return getAddress(rawValue);
        } else if (paramType === 'bool') {
          if (typeof rawValue === 'boolean') return rawValue;
          if (typeof rawValue === 'string') {
            if (rawValue.toLowerCase() === 'true') return true;
            if (rawValue.toLowerCase() === 'false') return false;
          }
          return Boolean(rawValue);
        } else if (paramType === 'string') {
          return String(rawValue);
        } else if (paramType.startsWith('bytes')) {
          console.warn(`Bytes transformation for type '${paramType}' not fully implemented yet.`);
          return rawValue;
        } else if (paramType.includes('[') || paramType.startsWith('tuple')) {
          if (typeof rawValue !== 'string' || rawValue.trim() === '')
            throw new Error(`Input for ${paramType} must be a non-empty JSON string`);
          try {
            return JSON.parse(rawValue);
          } catch (e) {
            throw new Error(
              `Invalid JSON for ${paramType}: ${rawValue}. Error: ${(e as Error).message}`
            );
          }
        }
        console.warn(`Unknown parameter type encountered: ${paramType}. Using raw value.`);
        return rawValue;
      } catch (error) {
        throw new Error(
          `Failed to transform value for '${param.name}': ${(error as Error).message}`
        );
      }
    });
    console.log('Transformed Arguments:', transformedArgs);

    // --- Step 4 & 5: Prepare Return Object --- //
    const isPayable = functionDetails.stateMutability === 'payable';
    let transactionValue = '0';
    if (isPayable) {
      console.warn('Payable function detected, but sending 0 ETH. Implement value input.');
    }

    // Re-construct the minimal ABI for the specific function, matching AbiFunction type
    const resolvedStateMutability = (functionDetails.stateMutability ||
      'nonpayable') as AbiStateMutability;
    const functionAbiItem = {
      type: 'function',
      stateMutability: resolvedStateMutability,
      name: functionDetails.name,
      inputs: functionDetails.inputs.map((i) => ({ name: i.name, type: i.type })),
      outputs: functionDetails.outputs?.map((o) => ({ name: o.name, type: o.type })) || [],
    } as const; // Keep 'as const' for stricter typing of properties

    if (!schema.address || !isAddress(schema.address)) {
      throw new Error('Contract address is missing or invalid in the provided schema.');
    }

    // This structure IS what signAndBroadcast needs, but we return unknown for interface compatibility for now
    const paramsForSignAndBroadcast: WriteContractParameters = {
      address: schema.address,
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
    try {
      // Validate contract address
      if (!contractAddress || contractAddress.trim() === '') {
        throw new Error('Contract address is empty or not provided');
      }

      if (!isAddress(contractAddress)) {
        throw new Error(`Invalid Ethereum address: ${contractAddress}`);
      }

      // Use ethers.js to create a contract instance
      const provider = new JsonRpcProvider(
        // Use a reliable public RPC URL that allows CORS
        // TODO: Make this configurable
        import.meta.env.VITE_RPC_URL || 'https://eth.llamarpc.com'
      );

      // Use provided schema or load it
      const schema = contractSchema || (await this.loadContract(contractAddress));

      // Find the function in the schema
      const functionDetails = schema.functions.find((fn) => fn.id === functionId);
      if (!functionDetails) {
        throw new Error(`Function with ID ${functionId} not found`);
      }

      // Create minimal ABI for just this function with generic bytes output
      // TODO: Add support for a better formatting of the output (formatFunctionResult)
      const genericAbi = [
        {
          name: functionDetails.name,
          type: 'function',
          stateMutability: functionDetails.stateMutability || 'view',
          inputs: functionDetails.inputs.map((i) => ({ name: i.name, type: i.type })),
          outputs: [{ name: '', type: 'bytes' }],
        },
      ];

      // Create contract interface
      const genericContract = new Contract(contractAddress, genericAbi, provider);

      // Just make the raw call and return the result
      const rawResult = await provider.call({
        to: contractAddress,
        data: genericContract.interface.encodeFunctionData(functionDetails.name, params),
      });

      // TODO: Add support for a better formatting of the output (formatFunctionResult)
      return rawResult;
    } catch (error) {
      console.error('Error querying view function:', error);
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  formatFunctionResult(
    result: unknown,
    _functionDetails: ContractFunction
  ): string | Record<string, unknown> {
    // Existing implementation...
    if (result === null || result === undefined) {
      return 'No data';
    }

    // Special handling for BigInt values
    if (typeof result === 'bigint') {
      return result.toString();
    }

    return String(result);
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
}

// Also export as default to ensure compatibility with various import styles
export default EvmAdapter;
