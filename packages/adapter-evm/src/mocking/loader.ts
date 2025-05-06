import type { ContractSchema } from '@openzeppelin/transaction-form-types';

import { transformAbiToSchema } from '../abi';
// --- Import Mock ABIs Directly --- //
// Note: This requires mocks to be structured similarly across adapters
// Or this logic needs to be made more abstract/configurable
import ERC20_MOCK from '../mocks/ERC20_MOCK.json';
import ERC721_MOCK from '../mocks/ERC721_MOCK.json';
import INPUT_TESTER_MOCK from '../mocks/INPUT_TESTER_MOCK.json';
import type { AbiItem } from '../types';

const mockAbis: Record<string, { name: string; abi: AbiItem[] }> = {
  erc20: { name: 'MockERC20', abi: ERC20_MOCK as AbiItem[] },
  erc721: { name: 'MockERC721', abi: ERC721_MOCK as AbiItem[] },
  'input-tester': { name: 'InputTester', abi: INPUT_TESTER_MOCK as AbiItem[] },
};
// --- End Mock ABI Imports --- //

/**
 * Loads a mock contract schema for testing or development purposes.
 * @param mockId Optional ID to specify which mock to load (defaults to 'input-tester').
 * @returns The loaded mock contract schema.
 */
export async function loadEvmMockContract(mockId?: string): Promise<ContractSchema> {
  const targetMockId = mockId || 'input-tester';
  const mockData = mockAbis[targetMockId];

  if (!mockData) {
    const errorMessage = `Mock contract with ID '${targetMockId}' not found. Available mocks: ${Object.keys(mockAbis).join(', ')}`;
    console.error('loadEvmMockContract', errorMessage);
    throw new Error(errorMessage);
  }

  try {
    console.info(`Loading mock contract ABI for: ${mockData.name}`);
    const mockAbi = mockData.abi;

    if (!Array.isArray(mockAbi)) {
      throw new Error(`Mock ABI for ${mockData.name} did not contain a valid array.`);
    }

    // Always provide a valid address for test schemas
    const address = '0x1234567890123456789012345678901234567890';
    return transformAbiToSchema(mockAbi, mockData.name, address);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error processing mock EVM contract (${mockData.name}):`, errorMessage);
    throw new Error(`Failed to process mock EVM contract: ${errorMessage}`);
  }
}
