import { xdr } from '@stellar/stellar-sdk';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';

// Import the type extraction utility from the shared utils module
import { extractSorobanTypeFromScSpec } from '../utils/type-detection';

/**
 * Represents a single enum variant with its type and optional payload information
 */
export interface EnumVariant {
  /** Name of the variant (e.g., 'One', 'Two', 'Three') */
  name: string;
  /** Type of variant: 'void' for unit variants, 'tuple' for variants with payload, 'integer' for numeric enums */
  type: 'void' | 'tuple' | 'integer';
  /** For tuple variants: array of payload type names (e.g., ['U32', 'ScString']) */
  payloadTypes?: string[];
  /** For integer variants: the numeric value */
  value?: number;
}

/**
 * Metadata about an enum extracted from Stellar contract spec
 */
export interface EnumMetadata {
  /** Name of the enum type */
  name: string;
  /** Array of variants in the enum */
  variants: EnumVariant[];
  /** True if all variants are unit variants (no payloads), suitable for simple select/radio */
  isUnitOnly: boolean;
}

/**
 * Extracts enum variant metadata from Stellar contract spec entries
 *
 * @param entries Array of ScSpecEntry from contract spec
 * @param enumName Name of the enum type to extract variants for
 * @returns EnumMetadata if found, null if not found or not an enum
 */
export function extractEnumVariants(
  entries: xdr.ScSpecEntry[],
  enumName: string
): EnumMetadata | null {
  try {
    // Find the entry for the requested enum name
    const entry = entries.find((e) => {
      try {
        return e.value().name().toString() === enumName;
      } catch {
        return false;
      }
    });

    if (!entry) {
      return null;
    }

    const entryKind = entry.switch();

    // Handle UDT Union (tagged union enum like DemoEnum { One, Two(u32), Three(String) })
    if (entryKind.value === xdr.ScSpecEntryKind.scSpecEntryUdtUnionV0().value) {
      const unionUdt = entry.udtUnionV0();
      const cases = unionUdt.cases();
      const variants: EnumVariant[] = [];
      let isUnitOnly = true;

      for (const caseEntry of cases) {
        const caseKind = caseEntry.switch();

        if (caseKind.value === xdr.ScSpecUdtUnionCaseV0Kind.scSpecUdtUnionCaseVoidV0().value) {
          // Void case (unit variant)
          const voidCase = caseEntry.voidCase();
          variants.push({
            name: voidCase.name().toString(),
            type: 'void',
          });
        } else if (
          caseKind.value === xdr.ScSpecUdtUnionCaseV0Kind.scSpecUdtUnionCaseTupleV0().value
        ) {
          // Tuple case (variant with payload)
          const tupleCase = caseEntry.tupleCase();
          const payloadTypes = tupleCase
            .type()
            .map((typeDef) => extractSorobanTypeFromScSpec(typeDef));

          variants.push({
            name: tupleCase.name().toString(),
            type: 'tuple',
            payloadTypes,
          });
          isUnitOnly = false;
        }
      }

      return {
        name: enumName,
        variants,
        isUnitOnly,
      };
    }

    // Handle UDT Enum (integer enum like Priority { Low = 0, Medium = 1, High = 2 })
    if (entryKind.value === xdr.ScSpecEntryKind.scSpecEntryUdtEnumV0().value) {
      const enumUdt = entry.udtEnumV0();
      const cases = enumUdt.cases();
      const variants: EnumVariant[] = [];

      for (const caseEntry of cases) {
        variants.push({
          name: caseEntry.name().toString(),
          type: 'integer',
          value: caseEntry.value(),
        });
      }

      return {
        name: enumName,
        variants,
        isUnitOnly: true, // Integer enums are considered unit-only for UI purposes
      };
    }

    return null;
  } catch (error) {
    logger.error('extractEnumVariants', `Failed to extract enum variants for ${enumName}:`, error);
    return null;
  }
}

/**
 * Checks if a parameter type name refers to a user-defined enum/union type
 * by looking for it in the contract spec entries
 *
 * @param entries Array of ScSpecEntry from contract spec
 * @param typeName Name of the type to check
 * @returns true if the type is a UDT enum or union
 */
export function isEnumType(entries: xdr.ScSpecEntry[], typeName: string): boolean {
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
    const isEnum =
      entryKind.value === xdr.ScSpecEntryKind.scSpecEntryUdtUnionV0().value ||
      entryKind.value === xdr.ScSpecEntryKind.scSpecEntryUdtEnumV0().value;

    return isEnum;
  } catch (error) {
    logger.error('isEnumType', `Failed to check if ${typeName} is enum:`, error);
    return false;
  }
}
