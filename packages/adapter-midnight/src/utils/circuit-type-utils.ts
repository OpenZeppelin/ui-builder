import type { ContractFunction } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

const SYSTEM_LOG_TAG = '[CircuitTypeUtils]';

/**
 * Regex pattern for matching pure circuit function signatures
 * Matches functions with or without context parameter:
 * - Pattern 1: function(context: Type, ...params) - with context
 * - Pattern 2: function(...params) - without context
 */
export const PURE_CIRCUIT_METHOD_REGEX =
  /(\w+)\s*\((?:context\s*:[^,\)]+(?:,\s*([^\)]+))?|([^\)]+?))\)/g;

/**
 * Regex pattern for matching impure circuit function signatures
 * Matches functions with context parameter: function(context: Type, ...params)
 */
export const IMPURE_CIRCUIT_METHOD_REGEX = /(\w+)\s*\(\s*context\s*:[^,\)]+(?:,\s*([^\)]+))?\)/g;

/**
 * Regex pattern for matching Circuits<T> type definition (legacy/fallback)
 * Used for older contracts that only have Circuits<T> instead of ImpureCircuits and PureCircuits
 */
export const CIRCUITS_TYPE_REGEX =
  /export\s+(?:declare\s+)?type\s+Circuits\s*<[^>]*>\s*=\s*{([\s\S]*?)}\s*;?/s;

/**
 * Checks if the contract definition contains an ImpureCircuits type definition
 *
 * @param contractDefinition - The contract definition (.d.ts) content
 * @returns True if ImpureCircuits type exists, false otherwise
 */
export function hasImpureCircuitsType(contractDefinition: string): boolean {
  const impureCircuitsMatch = contractDefinition.match(
    /export\s+(?:declare\s+)?type\s+ImpureCircuits\s*<[^>]*>\s*=\s*{([\s\S]*?)}\s*;?/s
  );
  return !!impureCircuitsMatch;
}

/**
 * Checks if the contract definition contains a PureCircuits type definition
 *
 * @param contractDefinition - The contract definition (.d.ts) content
 * @returns True if PureCircuits type exists, false otherwise
 */
export function hasPureCircuitsType(contractDefinition: string): boolean {
  const pureCircuitsMatch = contractDefinition.match(
    /export\s+(?:declare\s+)?type\s+PureCircuits\s*=\s*{([\s\S]*?)}\s*;?/s
  );
  return !!pureCircuitsMatch;
}

/**
 * Checks if the contract definition contains a Circuits<T> type definition (legacy/fallback)
 *
 * @param contractDefinition - The contract definition (.d.ts) content
 * @returns True if Circuits<T> type exists, false otherwise
 */
export function hasCircuitsType(contractDefinition: string): boolean {
  const circuitsMatch = contractDefinition.match(CIRCUITS_TYPE_REGEX);
  return !!circuitsMatch;
}

/**
 * Extracts ImpureCircuits from the contract definition
 *
 * @param contractDefinition - The contract definition (.d.ts) content
 * @returns Object mapping circuit names to their ContractFunction definitions
 */
export function extractImpureCircuits(
  contractDefinition: string,
  parseParameters: (paramsText: string) => ContractFunction['inputs'],
  capitalizeFirst: (str: string) => string
): Record<string, ContractFunction> {
  const circuits: Record<string, ContractFunction> = {};

  const impureCircuitsMatch = contractDefinition.match(
    /export\s+(?:declare\s+)?type\s+ImpureCircuits\s*<[^>]*>\s*=\s*{([\s\S]*?)}\s*;?/s
  );

  if (impureCircuitsMatch) {
    const impureCircuitsContent = impureCircuitsMatch[1];
    const methodRegex = IMPURE_CIRCUIT_METHOD_REGEX;
    let match;
    while ((match = methodRegex.exec(impureCircuitsContent)) !== null) {
      const name = match[1];
      const paramsText = match[2] || '';
      circuits[name] = {
        id: name,
        name,
        displayName: capitalizeFirst(name),
        inputs: parseParameters(paramsText),
        outputs: [], // Circuits don't expose return values directly
        modifiesState: true,
        type: 'function',
        stateMutability: 'nonpayable',
      };
    }
  }

  return circuits;
}

/**
 * Extracts PureCircuits from the contract definition
 *
 * @param contractDefinition - The contract definition (.d.ts) content
 * @returns Object mapping circuit names to their ContractFunction definitions
 */
export function extractPureCircuits(
  contractDefinition: string,
  parseParameters: (paramsText: string) => ContractFunction['inputs'],
  capitalizeFirst: (str: string) => string
): Record<string, ContractFunction> {
  const circuits: Record<string, ContractFunction> = {};

  const pureCircuitsMatch = contractDefinition.match(
    /export\s+(?:declare\s+)?type\s+PureCircuits\s*=\s*{([\s\S]*?)}\s*;?/s
  );

  if (pureCircuitsMatch) {
    const pureCircuitsContent = pureCircuitsMatch[1];
    logger.debug(SYSTEM_LOG_TAG, 'Found PureCircuits type, content:', pureCircuitsContent);
    // Pure circuits may or may not have context - match both patterns
    // Pattern 1: function(context: Type, ...params) - with context
    // Pattern 2: function(...params) - without context
    const methodRegex = PURE_CIRCUIT_METHOD_REGEX;
    let match;
    while ((match = methodRegex.exec(pureCircuitsContent)) !== null) {
      const name = match[1];
      // If match[2] exists, it means context was present and these are the rest of params
      // If match[3] exists, it means no context - these are all params
      const paramsText = match[2] || match[3] || '';
      logger.debug(SYSTEM_LOG_TAG, `Extracted pure circuit: ${name} with params: ${paramsText}`);
      circuits[name] = {
        id: name,
        name,
        displayName: capitalizeFirst(name),
        inputs: parseParameters(paramsText),
        outputs: [], // Circuits don't expose return values directly
        modifiesState: false,
        type: 'function',
        stateMutability: 'pure',
      };
    }
  } else {
    logger.debug(SYSTEM_LOG_TAG, 'PureCircuits type not found in contract definition');
  }

  return circuits;
}

/**
 * Checks if a function is an impure circuit (state-modifying)
 *
 * @param functionDetails - The function details from the contract schema
 * @returns True if the function is an impure circuit
 */
export function isImpureCircuit(functionDetails: ContractFunction): boolean {
  return functionDetails.modifiesState === true && functionDetails.stateMutability !== 'pure';
}

/**
 * Checks if a function is a pure circuit (local execution)
 *
 * @param functionDetails - The function details from the contract schema
 * @returns True if the function is a pure circuit
 */
export function isPureCircuit(functionDetails: ContractFunction): boolean {
  return functionDetails.stateMutability === 'pure';
}
