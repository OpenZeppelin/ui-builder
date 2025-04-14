import ERC20_MOCK from './ERC20_MOCK.json';
import ERC721_MOCK from './ERC721_MOCK.json';
import INPUT_TESTER_MOCK from './INPUT_TESTER_MOCK.json';

export { ERC20_MOCK, ERC721_MOCK, INPUT_TESTER_MOCK };

// Export a map for easy access by filename
export const evmMockFiles: Record<string, unknown> = {
  'ERC20_MOCK.json': ERC20_MOCK,
  'ERC721_MOCK.json': ERC721_MOCK,
  'INPUT_TESTER_MOCK.json': INPUT_TESTER_MOCK,
};
