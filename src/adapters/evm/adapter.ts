import type { ContractSchema } from '../../core/types/ContractSchema';
import type { ContractAdapter } from '../index';
import type { AbiItem } from './types';

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
   */
  async loadMockContract(): Promise<ContractSchema> {
    try {
      // Import the mock ABI
      const module = await import('../../mocks/EVM_ABI_MOCK.json');
      const mockAbi: AbiItem[] = module.default;

      // Transform the ABI into a chain-agnostic schema
      const contractSchema: ContractSchema = {
        chainType: 'evm',
        name: 'MockEVMContract',
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
          })),
      };

      return contractSchema;
    } catch (error) {
      console.error('Error loading mock EVM contract:', error);
      throw new Error('Failed to load mock EVM contract');
    }
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
}

// Also export as default to ensure compatibility with various import styles
export default EVMAdapter;
