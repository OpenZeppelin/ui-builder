import type { ContractFunction } from '@openzeppelin/ui-types';

import { isPureCircuit } from '../utils/circuit-type-utils';

/**
 * Determines if a function is a view/pure function (read-only)
 *
 * A view function in Midnight is one that does not modify contract state.
 * These functions can be queried without submitting a transaction.
 *
 * @param functionDetails The function details from the contract schema
 * @returns True if the function is a view function (does not modify state)
 */
export function isMidnightViewFunction(functionDetails: ContractFunction): boolean {
  // A function is a view function if it does NOT modify state
  return !functionDetails.modifiesState;
}

/**
 * Determines if a function is a pure circuit (runs locally without blockchain interaction)
 *
 * Pure circuits in Midnight are computational functions that can run entirely client-side
 * without accessing or modifying blockchain state. They are defined in the PureCircuits type.
 *
 * @param functionDetails The function details from the contract schema
 * @returns True if the function is a pure circuit
 * @deprecated Use isPureCircuit from '../utils/circuit-type-utils' instead
 */
export function isMidnightPureCircuit(functionDetails: ContractFunction): boolean {
  return isPureCircuit(functionDetails);
}
