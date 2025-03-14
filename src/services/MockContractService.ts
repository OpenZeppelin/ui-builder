/**
 * Interface for mock contract metadata
 */
// Import mock contract data
import { MOCK_CONTRACTS, mockFiles, mockFilesByChain } from '../mocks';

export interface MockContractInfo {
  id: string;
  name: string;
  description: string;
  file: string;
  chainType: string;
}

/**
 * Service for handling mock contract operations
 */
export class MockContractService {
  /**
   * Get available mock contracts
   * @returns Array of mock contract metadata
   */
  static async getAvailableMocks(): Promise<MockContractInfo[]> {
    try {
      return MOCK_CONTRACTS;
    } catch (error) {
      console.error('Error loading mock contracts metadata:', error);
      return [];
    }
  }

  /**
   * Get mock ABI data
   * @param fileName The name of the mock file to load
   * @returns The mock ABI data
   */
  static async getMockAbi(fileName: string): Promise<unknown> {
    try {
      // Get the mock data from our preloaded map
      if (mockFiles[fileName]) {
        return mockFiles[fileName];
      }

      // Determine if this is a chain-specific file
      const parts = fileName.split('/');
      if (parts.length > 1) {
        const chainType = parts[0];
        const actualFileName = parts[parts.length - 1];

        // Check if we have chain-specific mock files
        if (mockFilesByChain[chainType] && mockFilesByChain[chainType][actualFileName]) {
          return mockFilesByChain[chainType][actualFileName];
        }
      }

      // Fallback to dynamic import if not in our maps
      const mockModule = await import(`../mocks/${fileName}`);
      return mockModule.default || mockModule;
    } catch (error) {
      console.error(`Error loading mock ABI ${fileName}:`, error);
      throw error;
    }
  }
}

export default MockContractService;
