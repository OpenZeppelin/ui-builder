import {
  ContractEvent,
  ContractFunction,
  ContractSchema,
  FunctionParameter,
} from '@openzeppelin/transaction-form-types';

/**
 * Parses the string content of a Midnight contract's .d.ts file.
 * @param interfaceContent The string content of the .d.ts file.
 * @returns A partial schema containing the functions and types.
 */
export function parseMidnightContractInterface(
  interfaceContent: string
): Pick<ContractSchema, 'functions' | 'events'> {
  const circuits = extractCircuits(interfaceContent);
  const queries = extractQueries(interfaceContent);

  const functions = [...Object.values(circuits), ...Object.values(queries)];

  // TODO: Extract events from the interface content.
  const events: ContractEvent[] = [];

  return { functions, events };
}

function extractCircuits(content: string): Record<string, ContractFunction> {
  const circuits: Record<string, ContractFunction> = {};
  const circuitsMatch = content.match(/export\s+type\s+Circuits\s*<[^>]*>\s*=\s*{([^}]*)}/s);

  if (circuitsMatch) {
    const circuitsContent = circuitsMatch[1];
    const methodRegex = /(\w+)\s*\(\s*context\s*:[^,)]+(?:,\s*([^)]+))?\)/g;
    let match;
    while ((match = methodRegex.exec(circuitsContent)) !== null) {
      const name = match[1];
      const paramsText = match[2] || '';
      circuits[name] = {
        id: name, // Simplified ID for now
        name,
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
        inputs: parseParameters(paramsText),
        outputs: [], // Assuming no direct outputs from circuits for now
        modifiesState: true,
        type: 'function',
      };
    }
  }
  return circuits;
}

function extractQueries(content: string): Record<string, ContractFunction> {
  const queries: Record<string, ContractFunction> = {};
  const ledgerMatch = content.match(/export\s+type\s+Ledger\s*=\s*{([^}]*)}/s);

  if (ledgerMatch) {
    const ledgerContent = ledgerMatch[1];
    const propertyRegex = /readonly\s+(\w+)\s*:\s*([^;]*);/g;
    let match;
    while ((match = propertyRegex.exec(ledgerContent)) !== null) {
      const name = match[1];
      const typeStr = match[2].trim();
      queries[name] = {
        id: name,
        name,
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
        inputs: [],
        outputs: [{ name: 'value', type: typeStr }],
        modifiesState: false,
        type: 'function',
        stateMutability: 'view',
      };
    }
  }
  return queries;
}

function parseParameters(paramsText: string): FunctionParameter[] {
  if (!paramsText.trim()) return [];
  return paramsText.split(',').map((param) => {
    const [name, type] = param.split(':').map((s) => s.trim());
    return { name, type };
  });
}
