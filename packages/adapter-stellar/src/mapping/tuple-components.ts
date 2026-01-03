import { xdr } from '@stellar/stellar-sdk';

import type { FunctionParameter } from '@openzeppelin/ui-types';

import { extractTupleTypes } from '../utils/safe-type-parser';
import { extractStructFields, isStructType } from './struct-fields';

/**
 * Builds synthetic FunctionParameter definitions for tuple types so they can be rendered
 * using the existing object field UI.
 */
export function buildTupleComponents(
  parameterType: string,
  specEntries?: xdr.ScSpecEntry[]
): FunctionParameter[] | null {
  const tupleElements = extractTupleTypes(parameterType);
  if (!tupleElements || tupleElements.length === 0) {
    return null;
  }

  return tupleElements.map((elementType, index) => {
    let nestedComponents: FunctionParameter[] | undefined;

    if (specEntries && isStructType(specEntries, elementType)) {
      const structFields = extractStructFields(specEntries, elementType);
      if (structFields && structFields.length > 0) {
        nestedComponents = structFields;
      }
    } else if (elementType.startsWith('Tuple<')) {
      const tupleStruct = buildTupleComponents(elementType, specEntries);
      if (tupleStruct && tupleStruct.length > 0) {
        nestedComponents = tupleStruct;
      }
    }

    return {
      name: `item_${index}`,
      type: elementType,
      displayName: `Value ${index + 1} (${elementType})`,
      ...(nestedComponents && { components: nestedComponents }),
    };
  });
}
