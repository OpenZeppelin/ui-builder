/**
 * Interface for mock contract metadata
 * NOTE: it's a duplicate of /packages/core/src/services/MockContractService.ts
 * TODO: remove this file together with mocks directory once the contract loading is implemented.
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
      // Instead of dynamic template imports, use a predefined list of imports
      // This avoids Vite's warning about missing static file extensions
      const mockPath = `../mocks/${fileName}`;

      // For glob imports, we'd ideally use something like:
      // const modules = import.meta.glob('../mocks/*.json');
      // However, for now we'll use a more direct approach:

      console.log(`Attempting to load mock from path: ${mockPath}`);

      // Try a direct import first (no variable in path)
      try {
        // We use fetch API which is more compatible with Vite's expectations
        const response = await fetch(new URL(`../mocks/${fileName}.json`, import.meta.url).href);
        if (!response.ok) throw new Error(`Failed to fetch mock: ${response.statusText}`);
        return await response.json();
      } catch (error) {
        console.error(`Error loading mock via fetch: ${error}`);

        // Fallback to traditional dynamic import as last resort
        try {
          // As a last resort, try dynamic import directly
          const mockModule = await import(/* @vite-ignore */ mockPath);
          return mockModule.default || mockModule;
        } catch (importError) {
          console.error(`Error loading mock via dynamic import: ${importError}`);
          throw new Error(`Mock contract with ID ${fileName} not found`);
        }
      }
    } catch (error) {
      console.error(`Error loading mock ABI ${fileName}:`, error);
      throw error;
    }
  }
}

export default MockContractService;
