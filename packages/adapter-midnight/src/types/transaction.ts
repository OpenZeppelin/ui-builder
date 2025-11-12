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
  /**
   * Function-specific adapter hints (not persisted in artifacts).
   * This data is scoped to the selected function and may be derived from
   * Customize-step metadata. It must not contain sensitive values.
   */
  _secretConfig?: {
    /** Name of the private-state property that holds the identity secret key */
    identitySecretKeyPropertyName?: string;
  };
  transactionOptions: Record<string, unknown> & {
    _artifacts?: {
      privateStateId: string;
      contractModule?: string;
      witnessCode?: string;
      verifierKeys?: Record<string, unknown>;
    };
  };
}
