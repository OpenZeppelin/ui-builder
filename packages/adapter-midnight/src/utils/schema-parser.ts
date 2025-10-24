import {
  ContractEvent,
  ContractFunction,
  ContractSchema,
  FunctionParameter,
} from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

const SYSTEM_LOG_TAG = '[SchemaParser]';

/**
 * Parses the string content of a Midnight contract's .d.ts file.
 * @param interfaceContent The string content of the .d.ts file.
 * @returns A partial schema containing the functions and types.
 */
export function parseMidnightContractInterface(
  interfaceContent: string
): Pick<ContractSchema, 'functions' | 'events'> {
  try {
    const circuits = extractCircuits(interfaceContent);
    const ledgerProperties = extractLedgerProperties(interfaceContent);

    logger.info(
      SYSTEM_LOG_TAG,
      `Parsed d.ts → circuits:${Object.keys(circuits).length} ledger:${Object.keys(ledgerProperties).length}`
    );

    const functions = [...Object.values(circuits), ...Object.values(ledgerProperties)];

    // TODO: Extract events from the interface content.
    const events: ContractEvent[] = [];

    return { functions, events };
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, 'Failed to parse contract interface:', error);
    throw new Error(
      `Failed to parse Midnight contract interface: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Capitalizes the first letter of a string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function extractCircuits(content: string): Record<string, ContractFunction> {
  const circuits: Record<string, ContractFunction> = {};
  // Match: export (declare) type Circuits<...> = { ... }
  const circuitsMatch = content.match(
    /export\s+(?:declare\s+)?type\s+Circuits\s*<[^>]*>\s*=\s*{([\s\S]*?)}\s*;?/s
  );

  if (circuitsMatch) {
    const circuitsContent = circuitsMatch[1];
    const methodRegex = /(\w+)\s*\(\s*context\s*:[^,\)]+(?:,\s*([^\)]+))?\)/g;
    let match;
    while ((match = methodRegex.exec(circuitsContent)) !== null) {
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
      };
    }
  }

  logger.debug(SYSTEM_LOG_TAG, `Extracted ${Object.keys(circuits).length} circuits`);
  return circuits;
}

/**
 * Extracts ledger properties and query methods from the contract interface.
 * Ledger properties are readonly state values, while Queries are parameterized methods.
 * Both are treated as view functions in the UI.
 */
function extractLedgerProperties(content: string): Record<string, ContractFunction> {
  const properties: Record<string, ContractFunction> = {};

  // Match: export (declare) type Ledger = { readonly prop: Type; ... }
  const ledgerMatch = content.match(/export\s+(?:declare\s+)?type\s+Ledger\s*=\s*{([\s\S]*?)}/s);

  if (ledgerMatch) {
    const ledgerContent = ledgerMatch[1];
    const propertyRegex = /readonly\s+(\w+)\s*:\s*([^;]*);/g;
    let match;
    while ((match = propertyRegex.exec(ledgerContent)) !== null) {
      const name = match[1];
      const typeStr = match[2].trim();
      properties[name] = {
        id: name,
        name,
        displayName: capitalizeFirst(name),
        inputs: [],
        outputs: [{ name: 'value', type: typeStr }],
        modifiesState: false,
        type: 'function',
        stateMutability: 'view',
      };
    }
  }

  // Also check for Queries type (parameterized query methods)
  // We need to manually extract the content by tracking brace depth
  const queriesStartMatch = content.match(
    /export\s+(?:declare\s+)?type\s+Queries\s*<[^>]*>\s*=\s*{/
  );

  if (queriesStartMatch) {
    const startIndex = queriesStartMatch.index! + queriesStartMatch[0].length;
    let braceCount = 1;
    let endIndex = startIndex;

    // Find the matching closing brace
    for (let i = startIndex; i < content.length && braceCount > 0; i++) {
      if (content[i] === '{') braceCount++;
      else if (content[i] === '}') braceCount--;
      if (braceCount > 0) endIndex = i + 1;
    }

    const queriesContent = content.substring(startIndex, endIndex);
    // Parse methods with return types, handling complex nested types
    // We need to parse character by character to handle nested braces in return types
    let currentMethod = '';
    let braceDepth = 0;
    let angleDepth = 0;
    let parenDepth = 0;

    for (let i = 0; i < queriesContent.length; i++) {
      const char = queriesContent[i];

      if (char === '{') {
        braceDepth++;
        currentMethod += char;
      } else if (char === '}') {
        braceDepth--;
        currentMethod += char;
      } else if (char === '<') {
        angleDepth++;
        currentMethod += char;
      } else if (char === '>') {
        angleDepth--;
        currentMethod += char;
      } else if (char === '(') {
        parenDepth++;
        currentMethod += char;
      } else if (char === ')') {
        parenDepth--;
        currentMethod += char;
      } else if (
        (char === ';' || char === ',') &&
        braceDepth === 0 &&
        angleDepth === 0 &&
        parenDepth === 0
      ) {
        // End of method definition at top level
        if (currentMethod.trim()) {
          parseQueryMethod(currentMethod.trim(), properties);
        }
        currentMethod = '';
      } else {
        currentMethod += char;
      }
    }

    // Don't forget the last method if there's no trailing semicolon
    if (currentMethod.trim()) {
      parseQueryMethod(currentMethod.trim(), properties);
    }
  }

  logger.debug(
    SYSTEM_LOG_TAG,
    `Extracted ${Object.keys(properties).length} ledger properties/queries`
  );
  return properties;
}

/**
 * Parses a single query method signature and adds it to the properties object
 */
function parseQueryMethod(methodText: string, properties: Record<string, ContractFunction>): void {
  // Match: methodName(...params): ReturnType
  const methodMatch = methodText.match(/^(\w+)\s*\((.*?)\)\s*:\s*(.+)$/s);
  if (methodMatch) {
    const name = methodMatch[1];
    const paramsText = methodMatch[2] || '';
    const returnType = methodMatch[3]?.trim() || 'unknown';

    // Check for name collision with ledger properties
    if (properties[name]) {
      logger.warn(
        SYSTEM_LOG_TAG,
        `Name collision detected: Query method "${name}" overwrites ledger property with same name`
      );
    }

    properties[name] = {
      id: name,
      name,
      displayName: capitalizeFirst(name),
      inputs: parseParameters(paramsText),
      outputs: [{ name: 'value', type: returnType }],
      modifiesState: false,
      type: 'function',
      stateMutability: 'view',
    };
  }
}

/**
 * Parses function parameters from TypeScript signature text.
 * Handles simple types and attempts to parse complex nested types.
 *
 * Note: This is a simplified parser that handles common cases.
 * Complex generic types with nested brackets/colons may not parse correctly.
 */
function parseParameters(paramsText: string): FunctionParameter[] {
  if (!paramsText.trim()) return [];

  try {
    const params: FunctionParameter[] = [];
    let currentParam = '';
    let bracketDepth = 0;
    let angleDepth = 0;

    // Parse character by character to handle nested types
    for (let i = 0; i < paramsText.length; i++) {
      const char = paramsText[i];

      if (char === '{' || char === '[') {
        bracketDepth++;
        currentParam += char;
      } else if (char === '}' || char === ']') {
        bracketDepth--;
        // Validate depth never goes negative (indicates malformed input)
        if (bracketDepth < 0) {
          logger.warn(
            SYSTEM_LOG_TAG,
            `Malformed parameter text: unbalanced brackets/braces at position ${i} in "${paramsText}"`
          );
          throw new Error(`Unbalanced brackets/braces at position ${i}`);
        }
        currentParam += char;
      } else if (char === '<') {
        angleDepth++;
        currentParam += char;
      } else if (char === '>') {
        angleDepth--;
        // Validate depth never goes negative (indicates malformed input)
        if (angleDepth < 0) {
          logger.warn(
            SYSTEM_LOG_TAG,
            `Malformed parameter text: unbalanced angle brackets at position ${i} in "${paramsText}"`
          );
          throw new Error(`Unbalanced angle brackets at position ${i}`);
        }
        currentParam += char;
      } else if (char === ',' && bracketDepth === 0 && angleDepth === 0) {
        // Top-level comma - this separates parameters
        if (currentParam.trim()) {
          params.push(parseParameter(currentParam.trim()));
        }
        currentParam = '';
      } else {
        currentParam += char;
      }
    }

    // Validate all brackets/angles are balanced at the end
    if (bracketDepth !== 0) {
      logger.warn(
        SYSTEM_LOG_TAG,
        `Malformed parameter text: unclosed brackets/braces (depth: ${bracketDepth}) in "${paramsText}"`
      );
      throw new Error(`Unclosed brackets/braces (depth: ${bracketDepth})`);
    }
    if (angleDepth !== 0) {
      logger.warn(
        SYSTEM_LOG_TAG,
        `Malformed parameter text: unclosed angle brackets (depth: ${angleDepth}) in "${paramsText}"`
      );
      throw new Error(`Unclosed angle brackets (depth: ${angleDepth})`);
    }

    // Don't forget the last parameter
    if (currentParam.trim()) {
      params.push(parseParameter(currentParam.trim()));
    }

    return params;
  } catch (error) {
    logger.warn(SYSTEM_LOG_TAG, `Failed to parse parameters: "${paramsText}"`, error);
    // Fallback to simple split for backwards compatibility
    return paramsText.split(',').map((param) => {
      const [name, type] = param.split(':').map((s) => s.trim());
      return { name: name || 'unknown', type: type || 'unknown' };
    });
  }
}

/**
 * Parses a single parameter from "name: Type" format
 */
function parseParameter(paramText: string): FunctionParameter {
  const colonIndex = paramText.indexOf(':');
  if (colonIndex === -1) {
    logger.warn(SYSTEM_LOG_TAG, `Invalid parameter format (missing colon): "${paramText}"`);
    return { name: paramText.trim(), type: 'unknown' };
  }

  const name = paramText.substring(0, colonIndex).trim();
  const type = paramText.substring(colonIndex + 1).trim();

  if (!name) {
    logger.warn(SYSTEM_LOG_TAG, `Parameter missing name: "${paramText}"`);
    return { name: 'unknown', type: type || 'unknown' };
  }

  return { name, type: type || 'unknown' };
}
