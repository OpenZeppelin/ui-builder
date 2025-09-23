import * as StellarSdk from '@stellar/stellar-sdk';

import { isDevelopmentOrTestEnvironment, logger } from '@openzeppelin/ui-builder-utils';

/**
 * Utility functions for detecting and analyzing Stellar/Soroban parameter types
 */

/**
 * Extract human-readable Soroban type name from ScSpecTypeDef
 * Based on the Stellar SDK type system
 */
export function extractSorobanTypeFromScSpec(scSpecType: StellarSdk.xdr.ScSpecTypeDef): string {
  try {
    const typeSwitch = scSpecType.switch();

    switch (typeSwitch) {
      case StellarSdk.xdr.ScSpecType.scSpecTypeVal():
        return 'Val';
      case StellarSdk.xdr.ScSpecType.scSpecTypeBool():
        return 'Bool';
      case StellarSdk.xdr.ScSpecType.scSpecTypeVoid():
        return 'Void';
      case StellarSdk.xdr.ScSpecType.scSpecTypeError():
        return 'Error';
      case StellarSdk.xdr.ScSpecType.scSpecTypeU32():
        return 'U32';
      case StellarSdk.xdr.ScSpecType.scSpecTypeI32():
        return 'I32';
      case StellarSdk.xdr.ScSpecType.scSpecTypeU64():
        return 'U64';
      case StellarSdk.xdr.ScSpecType.scSpecTypeI64():
        return 'I64';
      case StellarSdk.xdr.ScSpecType.scSpecTypeTimepoint():
        return 'Timepoint';
      case StellarSdk.xdr.ScSpecType.scSpecTypeDuration():
        return 'Duration';
      case StellarSdk.xdr.ScSpecType.scSpecTypeU128():
        return 'U128';
      case StellarSdk.xdr.ScSpecType.scSpecTypeI128():
        return 'I128';
      case StellarSdk.xdr.ScSpecType.scSpecTypeU256():
        return 'U256';
      case StellarSdk.xdr.ScSpecType.scSpecTypeI256():
        return 'I256';
      case StellarSdk.xdr.ScSpecType.scSpecTypeBytes():
        return 'Bytes';
      case StellarSdk.xdr.ScSpecType.scSpecTypeBytesN(): {
        const bytesNType = scSpecType.bytesN();
        const size = bytesNType.n();
        return `BytesN<${size}>`;
      }
      case StellarSdk.xdr.ScSpecType.scSpecTypeString():
        return 'ScString';
      case StellarSdk.xdr.ScSpecType.scSpecTypeSymbol():
        return 'ScSymbol';
      case StellarSdk.xdr.ScSpecType.scSpecTypeVec(): {
        const vecType = scSpecType.vec();
        const elementType = extractSorobanTypeFromScSpec(vecType.elementType());
        return `Vec<${elementType}>`;
      }
      case StellarSdk.xdr.ScSpecType.scSpecTypeMap(): {
        const mapType = scSpecType.map();
        const keyType = extractSorobanTypeFromScSpec(mapType.keyType());
        const valueType = extractSorobanTypeFromScSpec(mapType.valueType());
        return `Map<${keyType}, ${valueType}>`;
      }
      case StellarSdk.xdr.ScSpecType.scSpecTypeTuple(): {
        const tupleType = scSpecType.tuple();
        const valueTypes = tupleType.valueTypes();
        const typeNames = valueTypes.map((t) => extractSorobanTypeFromScSpec(t));
        return `Tuple<${typeNames.join(', ')}>`;
      }
      case StellarSdk.xdr.ScSpecType.scSpecTypeOption(): {
        const optionType = scSpecType.option();
        const valueType = extractSorobanTypeFromScSpec(optionType.valueType());
        return `Option<${valueType}>`;
      }
      case StellarSdk.xdr.ScSpecType.scSpecTypeResult(): {
        const resultType = scSpecType.result();
        const okType = extractSorobanTypeFromScSpec(resultType.okType());
        const errorType = extractSorobanTypeFromScSpec(resultType.errorType());
        return `Result<${okType}, ${errorType}>`;
      }
      case StellarSdk.xdr.ScSpecType.scSpecTypeAddress():
        return 'Address';
      case StellarSdk.xdr.ScSpecType.scSpecTypeMuxedAddress():
        return 'MuxedAddress';
      case StellarSdk.xdr.ScSpecType.scSpecTypeUdt(): {
        const udtType = scSpecType.udt();
        return udtType.name().toString();
      }
      default:
        // COMPREHENSIVE TYPE MISS DETECTION
        logger.error('extractSorobanTypeFromScSpec', `🚨 MISSING SCSPEC TYPE HANDLER 🚨`, {
          typeSwitchValue: typeSwitch.value,
          typeSwitchName: typeSwitch.name,
          rawScSpecType: scSpecType,
          message: 'This indicates a missing case in extractSorobanTypeFromScSpec switch statement',
          actionRequired: 'Add support for this ScSpec type immediately',
          sdkVersion: process.env.npm_package_dependencies_stellar_sdk || 'unknown',
        });

        // Create detailed error report for unknown types
        const errorReport = {
          type: 'MISSING_SCSPEC_TYPE',
          scSpecType: typeSwitch.name,
          value: typeSwitch.value,
          timestamp: new Date().toISOString(),
        };

        // In development, throw an error to fail fast
        if (isDevelopmentOrTestEnvironment()) {
          throw new Error(
            `Missing ScSpec type handler: ${typeSwitch.name} (value: ${typeSwitch.value}). Please add support for this type.`
          );
        }

        // In production, log extensively but don't break
        logger.error('STELLAR_ADAPTER_MISSING_TYPE', 'Missing ScSpec type handler:', errorReport);
        return 'unknown';
    }
  } catch (error) {
    logger.error('extractSorobanTypeFromScSpec', 'Failed to extract type:', error);
    return 'unknown';
  }
}

/**
 * Determines if a parameter type is likely an enum based on naming conventions
 * and common patterns in Stellar/Soroban contracts.
 *
 * @param parameterType The parameter type string to analyze
 * @returns true if the type appears to be an enum based on naming patterns
 */
export function isLikelyEnumType(parameterType: string): boolean {
  // Direct enum name patterns
  if (parameterType.includes('Enum') || parameterType.includes('enum')) {
    return true;
  }

  // Common enum naming patterns in Stellar/Soroban
  const enumPatterns = [
    /^(Status|State|Type|Kind|Mode|Level|Priority|Category)$/i,
    /^.*?(Status|State|Type|Kind|Mode|Level|Priority|Category)$/i,
    /^(Token|Asset|Account|Contract|Network)Type$/i,
  ];

  // Only apply pattern matching if it's not a generic "UnknownType" or similar
  if (
    parameterType === 'UnknownType' ||
    parameterType === 'CustomStruct' ||
    parameterType === 'UserInfo'
  ) {
    return false;
  }

  return enumPatterns.some((pattern) => pattern.test(parameterType));
}
