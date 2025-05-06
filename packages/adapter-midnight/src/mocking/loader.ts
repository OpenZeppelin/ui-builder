import type { ContractSchema } from '@openzeppelin/transaction-form-types';

/**
 * Load a mock contract for testing
 *
 * TODO: Implement proper Midnight contract schema in future phases
 * @param mockId Optional ID to specify which mock to load (not used for Midnight adapter)
 */
export function loadMidnightMockContract(_mockId?: string): Promise<ContractSchema> {
  // Simple minimal mock contract schema
  return Promise.resolve({
    ecosystem: 'midnight',
    name: 'PlaceholderMidnightContract',
    functions: [
      {
        id: 'dummy_function',
        name: 'placeholderFunction',
        displayName: 'Placeholder Function',
        inputs: [
          {
            name: 'dummyParam',
            type: 'string',
            displayName: 'Dummy Parameter',
          },
        ],
        type: 'function',
        stateMutability: 'nonpayable',
        modifiesState: true, // Assume this placeholder function modifies state
      },
    ],
  });
}
