import type { ContractSchema } from '@openzeppelin/transaction-form-types/contracts';

/**
 * Load a mock contract for testing
 *
 * TODO: Implement proper Stellar contract schema in future phases
 * @param mockId Optional ID to specify which mock to load (not used for Stellar adapter)
 */
export function loadStellarMockContract(_mockId?: string): Promise<ContractSchema> {
  // Simple minimal mock contract schema
  return Promise.resolve({
    ecosystem: 'stellar',
    name: 'PlaceholderStellarContract',
    functions: [
      {
        id: 'dummy_operation',
        name: 'placeholderOperation',
        displayName: 'Placeholder Operation',
        inputs: [
          {
            name: 'dummyParam',
            type: 'string',
            displayName: 'Dummy Parameter',
          },
        ],
        type: 'function',
        modifiesState: true, // Assume this placeholder operation modifies state
      },
    ],
  });
}
