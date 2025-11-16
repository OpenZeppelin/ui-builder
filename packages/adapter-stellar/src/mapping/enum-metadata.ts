import { xdr } from '@stellar/stellar-sdk';

import type { FunctionParameter } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

// Import the type extraction utility from the shared utils module
import { extractSorobanTypeFromScSpec } from '../utils/type-detection';
import { extractStructFields, isStructType } from './struct-fields';
import { buildTupleComponents } from './tuple-components';

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
  /** Optional detailed component metadata for payload types */
  payloadComponents?: (FunctionParameter[] | undefined)[];
  /** For integer variants: the numeric value */
  value?: number;
  /** Flag indicating if this variant has a single Tuple payload that needs wrapping during serialization */
  isSingleTuplePayload?: boolean;
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
          const rawPayloadTypes = tupleCase
            .type()
            .map((typeDef) => extractSorobanTypeFromScSpec(typeDef));

          // Track if we have a single Tuple payload that needs special handling
          const isSingleTuplePayload =
            rawPayloadTypes.length === 1 && rawPayloadTypes[0].startsWith('Tuple<');

          // Flatten tuple payloads for UI rendering
          // Example: Some((Address, i128)) → payloadTypes: ['Address', 'I128'] for UI
          // But we keep the original structure info for serialization
          const flattenedPayloadTypes: string[] = [];
          const flattenedPayloadComponents: (FunctionParameter[] | undefined)[] = [];

          for (const payloadType of rawPayloadTypes) {
            if (payloadType.startsWith('Tuple<')) {
              // Extract tuple components and add them individually for UI rendering
              const tupleComponents = buildTupleComponents(payloadType, entries);
              if (tupleComponents && tupleComponents.length > 0) {
                tupleComponents.forEach((component) => {
                  flattenedPayloadTypes.push(component.type);
                  if (isStructType(entries, component.type)) {
                    flattenedPayloadComponents.push(
                      extractStructFields(entries, component.type) ?? undefined
                    );
                  } else {
                    flattenedPayloadComponents.push(component.components);
                  }
                });
              } else {
                flattenedPayloadTypes.push(payloadType);
                flattenedPayloadComponents.push(undefined);
              }
            } else if (isStructType(entries, payloadType)) {
              flattenedPayloadTypes.push(payloadType);
              flattenedPayloadComponents.push(
                extractStructFields(entries, payloadType) ?? undefined
              );
            } else {
              flattenedPayloadTypes.push(payloadType);
              flattenedPayloadComponents.push(undefined);
            }
          }

          variants.push({
            name: tupleCase.name().toString(),
            type: 'tuple',
            payloadTypes: flattenedPayloadTypes,
            ...(flattenedPayloadComponents.some(
              (components) => components && components.length > 0
            ) && {
              payloadComponents: flattenedPayloadComponents,
            }),
            // Store metadata about whether this needs tuple wrapping during serialization
            ...(isSingleTuplePayload && { isSingleTuplePayload: true }),
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
