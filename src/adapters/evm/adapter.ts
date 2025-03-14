import { generateId } from '../../core/utils/utils';
import MockContractService from '../../services/MockContractService';

import type { ContractSchema, FunctionParameter } from '../../core/types/ContractSchema';
import type { FieldType, FormField } from '../../core/types/FormTypes';
import type { ContractAdapter } from '../index';
import type { AbiItem } from './types';

/**
 * EVM-specific type mapping
 */
const EVM_TYPE_TO_FIELD_TYPE: Record<string, FieldType> = {
  address: 'address',
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
  bytes: 'text',
  bytes32: 'text',
};

/**
 * EVM-specific adapter implementation
 */
export class EVMAdapter implements ContractAdapter {
  /**
   * Load a contract from a file or address
   */
  async loadContract(source: string): Promise<ContractSchema> {
    // In a real implementation, this would fetch the ABI from the blockchain or parse a file
    console.log(`Loading EVM contract from: ${source}`);

    // For now, just return the mock contract
    return this.loadMockContract();
  }

  /**
   * Load a mock contract for testing
   * @param mockId Optional ID to specify which mock to load
   */
  async loadMockContract(mockId?: string): Promise<ContractSchema> {
    try {
      // Get available mocks to find the file name
      const mocks = await MockContractService.getAvailableMocks();

      // Default to the first mock if none specified
      const mockInfo = mockId
        ? mocks.find((mock) => mock.id === mockId)
        : mocks.find((mock) => mock.id === 'input-tester');

      if (!mockInfo) {
        throw new Error(`Mock contract with ID ${mockId || 'input-tester'} not found`);
      }

      // Load the mock ABI
      const mockAbi = (await MockContractService.getMockAbi(mockInfo.file)) as AbiItem[];

      // Set contract name based on mock info
      const contractName = mockInfo.name;

      // Transform the ABI into a chain-agnostic schema
      const contractSchema: ContractSchema = {
        chainType: 'evm',
        name: contractName,
        functions: mockAbi
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
            modifiesState:
              !item.stateMutability || !['view', 'pure'].includes(item.stateMutability),
          })),
      };

      return contractSchema;
    } catch (error) {
      console.error('Error loading mock EVM contract:', error);
      throw new Error('Failed to load mock EVM contract');
    }
  }

  /**
   * Map an EVM-specific parameter type to a form field type
   * @param parameterType The EVM parameter type (e.g., uint256, address)
   * @returns The appropriate form field type
   */
  mapParameterTypeToFieldType(parameterType: string): FieldType {
    // Remove array suffix if present (e.g., uint256[] -> uint256)
    const baseType = parameterType.replace(/\[\d*\]$/, '');

    // Handle tuples (structs) - for now, just use a textarea
    if (baseType.startsWith('tuple')) {
      return 'textarea';
    }

    // Return the mapped type or default to text if no mapping exists
    return EVM_TYPE_TO_FIELD_TYPE[baseType] || 'text';
  }

  /**
   * Generate default field configuration for an EVM function parameter
   * @param parameter The function parameter to convert to a form field
   * @returns A form field configuration with appropriate defaults
   */
  generateDefaultField(parameter: FunctionParameter): FormField {
    const fieldType = this.mapParameterTypeToFieldType(parameter.type);

    // Create a default field based on the parameter
    return {
      id: generateId(),
      name: parameter.name || parameter.type,
      label: parameter.displayName || parameter.name || parameter.type,
      type: fieldType,
      placeholder: `Enter ${parameter.displayName || parameter.name || parameter.type}`,
      helperText: parameter.description || '',
      defaultValue: this.getDefaultValueForType(fieldType),
      validation: this.getDefaultValidationForType(parameter.type),
      width: 'full',
    };
  }

  /**
   * Get a default value for a field type
   * @param fieldType The form field type
   * @returns An appropriate default value
   */
  private getDefaultValueForType(fieldType: FieldType): unknown {
    switch (fieldType) {
      case 'checkbox':
        return false;
      case 'number':
      case 'amount':
        return 0;
      case 'address':
        return '';
      default:
        return '';
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
  } {
    const validation = { required: true };

    // Add specific validation rules based on the parameter type
    if (parameterType === 'address') {
      return {
        ...validation,
        pattern: '^0x[a-fA-F0-9]{40}$',
        minLength: 42,
        maxLength: 42,
      };
    }

    return validation;
  }

  /**
   * Format transaction data for the specific chain
   */
  formatTransactionData(functionId: string, inputs: Record<string, unknown>): unknown {
    // In a real implementation, this would encode the function call according to EVM standards
    console.log(`Formatting EVM transaction data for function: ${functionId}`);
    console.log('Inputs:', inputs);

    // Return a mock transaction object
    return {
      to: '0x1234567890123456789012345678901234567890',
      data: `0x${functionId}`,
      value: '0',
      gasLimit: '100000',
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
}

// Also export as default to ensure compatibility with various import styles
export default EVMAdapter;
