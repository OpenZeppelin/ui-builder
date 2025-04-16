import type { ContractFunction, ContractSchema } from '../contracts';

/**
 * Extension interface for adapters that support contract state querying
 *
 * This interface defines the capabilities needed for querying and displaying
 * contract state data from read-only (view/pure) functions.
 */
export interface ContractStateCapabilities {
  /**
   * Determines if a function is a view/pure function (read-only)
   *
   * @param functionDetails - The function details
   * @returns True if the function is read-only
   */
  isViewFunction(functionDetails: ContractFunction): boolean;

  /**
   * Queries a view function on a contract
   *
   * @param contractAddress - The contract address
   * @param functionId - The function identifier
   * @param params - Optional parameters for the function call
   * @param contractSchema - Optional pre-loaded contract schema
   * @returns The query result, properly formatted
   */
  queryViewFunction(
    contractAddress: string,
    functionId: string,
    params?: unknown[],
    contractSchema?: ContractSchema
  ): Promise<unknown>;

  /**
   * Formats a function result for display
   *
   * @param result - The raw result from the contract
   * @param functionDetails - The function details
   * @returns Formatted result ready for display
   */
  formatFunctionResult(
    result: unknown,
    functionDetails: ContractFunction
  ): string | Record<string, unknown>;
}
