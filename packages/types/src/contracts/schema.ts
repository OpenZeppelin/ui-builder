import { Ecosystem } from '../common';

/**
 * Represents a parameter in a contract function
 */
export interface FunctionParameter {
  /**
   * Parameter name as defined in the contract
   */
  name: string;

  /**
   * Parameter type (e.g., 'uint256', 'address', 'string')
   */
  type: string;

  /**
   * Optional user-friendly display name
   */
  displayName?: string;

  /**
   * Optional description for documentation or UI tooltips
   */
  description?: string;

  /**
   * For complex/nested types, an array of component parameters
   */
  components?: FunctionParameter[];
}

/**
 * Represents a function in a contract
 */
export interface ContractFunction {
  /**
   * Unique identifier for the function
   */
  id: string;

  /**
   * Function name as defined in the contract
   */
  name: string;

  /**
   * User-friendly display name for UI
   */
  displayName: string;

  /**
   * Optional description for documentation or UI tooltips
   */
  description?: string;

  /**
   * Input parameters for the function
   */
  inputs: FunctionParameter[];

  /**
   * Optional output parameters for the function
   */
  outputs?: FunctionParameter[];

  /**
   * Function state mutability (view, pure, payable, etc.)
   */
  stateMutability?: string;

  /**
   * Function type (function, constructor, etc.)
   */
  type: string;

  /**
   * Indicates if the function modifies blockchain state
   */
  modifiesState: boolean;
}

/**
 * Represents a contract event
 */
export interface ContractEvent {
  /**
   * Unique identifier for the event
   */
  id: string;

  /**
   * Event name as defined in the contract
   */
  name: string;

  /**
   * Input parameters for the event
   */
  inputs: FunctionParameter[];
}

/**
 * Represents a contract schema, including functions and events
 */
export interface ContractSchema {
  /**
   * Optional contract name
   */
  name?: string;

  /**
   * Ecosystem the contract is deployed on
   */
  ecosystem: Ecosystem;

  /**
   * Functions defined in the contract
   */
  functions: ContractFunction[];

  /**
   * Optional events defined in the contract
   */
  events?: ContractEvent[];

  /**
   * Optional contract address
   */
  address?: string;
}
