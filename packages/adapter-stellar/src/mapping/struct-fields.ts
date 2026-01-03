import { xdr } from '@stellar/stellar-sdk';

import type { FunctionParameter } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

// Import the type extraction utility from the shared utils module
import { extractSorobanTypeFromScSpec } from '../utils/type-detection';

/**
 * Extracts struct field definitions from Stellar contract spec entries
 *
 * @param entries Array of ScSpecEntry from contract spec
 * @param structName Name of the struct type to extract fields for
 * @returns Array of FunctionParameter representing struct fields, or null if not found
 */
export function extractStructFields(
  entries: xdr.ScSpecEntry[],
  structName: string
): FunctionParameter[] | null {
  try {
    // Find the entry for the requested struct name
    const entry = entries.find((e) => {
      try {
        return e.value().name().toString() === structName;
      } catch {
        return false;
      }
    });

    if (!entry) {
      return null;
    }

    const entryKind = entry.switch();

    // Handle UDT Struct (like DemoStruct { id: u32, flag: bool, info: Symbol })
    if (entryKind.value === xdr.ScSpecEntryKind.scSpecEntryUdtStructV0().value) {
      const structUdt = entry.udtStructV0();
      const fields = structUdt.fields();
      const structFields: FunctionParameter[] = [];

      for (const field of fields) {
        const fieldName = field.name().toString();
        const fieldType = extractSorobanTypeFromScSpec(field.type());

        const fieldParam: FunctionParameter = {
          name: fieldName,
          type: fieldType,
        };

        // Recursively extract nested struct components
        if (isStructType(entries, fieldType)) {
          const nestedFields = extractStructFields(entries, fieldType);
          if (nestedFields && nestedFields.length > 0) {
            fieldParam.components = nestedFields;
          }
        }

        structFields.push(fieldParam);
      }

      return structFields;
    }

    return null;
  } catch (error) {
    logger.error(
      'extractStructFields',
      `Failed to extract struct fields for ${structName}:`,
      error
    );
    return null;
  }
}

/**
 * Determines if a given type name is a struct type in the contract spec
 *
 * @param entries Array of ScSpecEntry from contract spec
 * @param typeName Name of the type to check
 * @returns true if the type is a struct, false otherwise
 */
export function isStructType(entries: xdr.ScSpecEntry[], typeName: string): boolean {
  try {
    const entry = entries.find((e) => {
      try {
        const entryName = e.value().name().toString();
        return entryName === typeName;
      } catch {
        return false;
      }
    });

    if (!entry) {
      return false;
    }

    const entryKind = entry.switch();
    const isStruct = entryKind.value === xdr.ScSpecEntryKind.scSpecEntryUdtStructV0().value;

    return isStruct;
  } catch (error) {
    logger.error('isStructType', `Failed to check if ${typeName} is struct:`, error);
    return false;
  }
}
