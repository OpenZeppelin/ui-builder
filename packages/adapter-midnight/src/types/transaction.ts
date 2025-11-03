/**
 * Midnight-specific transaction type definitions
 */

/**
 * Defines the structure for parameters required to execute a contract write operation on Midnight.
 * Mirrors the pattern from EVM's WriteContractParameters.
 */
export interface WriteContractParameters {
  contractAddress: string;
  functionName: string;
  args: unknown[];
  argTypes: string[]; // Parameter types for argument conversion
  transactionOptions: Record<string, unknown> & {
    _artifacts?: {
      privateStateId: string;
      contractModule?: string;
      witnessCode?: string;
      verifierKeys?: Record<string, unknown>;
    };
  };
}
