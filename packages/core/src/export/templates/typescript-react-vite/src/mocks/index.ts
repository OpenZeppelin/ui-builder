import MOCK_CONTRACTS from './MOCK_CONTRACTS.json';
import { ERC20_MOCK, ERC721_MOCK, INPUT_TESTER_MOCK, evmMockFiles } from './evm';

export { ERC20_MOCK, ERC721_MOCK, INPUT_TESTER_MOCK, MOCK_CONTRACTS };

// Define a Record type for all mock files, organized by chain type
export const mockFiles: Record<string, unknown> = {
  // EVM mocks
  'evm/ERC20_MOCK.json': ERC20_MOCK,
  'evm/ERC721_MOCK.json': ERC721_MOCK,
  'evm/INPUT_TESTER_MOCK.json': INPUT_TESTER_MOCK,
};

// Export all chains' mock files by chain type
export const mockFilesByEcosystem: Record<string, Record<string, unknown>> = {
  evm: evmMockFiles,
};
