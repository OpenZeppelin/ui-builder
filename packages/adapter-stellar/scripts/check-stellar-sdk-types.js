#!/usr/bin/env node

/**
 * Automated script to detect new ScSpec types in Stellar SDK updates
 * Run this script after updating the Stellar SDK to ensure we support all types
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Known types we currently support (should match our switch statement)
const SUPPORTED_SCSPEC_TYPES = [
  'scSpecTypeVal',
  'scSpecTypeBool',
  'scSpecTypeVoid',
  'scSpecTypeError',
  'scSpecTypeU32',
  'scSpecTypeI32',
  'scSpecTypeU64',
  'scSpecTypeI64',
  'scSpecTypeTimepoint',
  'scSpecTypeDuration',
  'scSpecTypeU128',
  'scSpecTypeI128',
  'scSpecTypeU256',
  'scSpecTypeI256',
  'scSpecTypeBytes',
  'scSpecTypeString',
  'scSpecTypeSymbol',
  'scSpecTypeAddress',
  'scSpecTypeMuxedAddress', // Just added!
  'scSpecTypeOption',
  'scSpecTypeResult',
  'scSpecTypeVec',
  'scSpecTypeMap',
  'scSpecTypeTuple',
  'scSpecTypeBytesN',
  'scSpecTypeUdt',
];

async function checkStellarSDKTypes() {
  console.log('🔍 Checking Stellar SDK for new ScSpec types...\n');

  try {
    // Import Stellar SDK dynamically
    const StellarSdk = await import('@stellar/stellar-sdk');

    // Get all scSpecType methods from the SDK
    const availableTypes = Object.getOwnPropertyNames(StellarSdk.xdr.ScSpecType)
      .filter(
        (name) =>
          name.startsWith('scSpecType') && typeof StellarSdk.xdr.ScSpecType[name] === 'function'
      )
      .sort();

    console.log(
      `📦 Stellar SDK version: ${process.env.npm_package_dependencies_stellar_sdk || 'unknown'}`
    );
    console.log(`🔢 Total ScSpec types in SDK: ${availableTypes.length}`);
    console.log(`✅ Currently supported types: ${SUPPORTED_SCSPEC_TYPES.length}\n`);

    // Find missing types (in SDK but not in our list)
    const missingTypes = availableTypes.filter((type) => !SUPPORTED_SCSPEC_TYPES.includes(type));

    // Find deprecated types (in our list but not in SDK)
    const deprecatedTypes = SUPPORTED_SCSPEC_TYPES.filter((type) => !availableTypes.includes(type));

    // Report findings
    if (missingTypes.length > 0) {
      console.error(
        '🚨 MISSING TYPES - These ScSpec types are in the SDK but not handled by our adapter:'
      );
      missingTypes.forEach((type) => {
        console.error(`  ❌ ${type}`);
      });
      console.error(
        '\n💡 Action Required: Add these types to extractSorobanTypeFromScSpec function'
      );
      console.error('📍 File: packages/adapter-stellar/src/utils/type-detection.ts\n');
    }

    if (deprecatedTypes.length > 0) {
      console.warn(
        '⚠️  DEPRECATED TYPES - These types are in our code but not in the current SDK:'
      );
      deprecatedTypes.forEach((type) => {
        console.warn(`  🗑️  ${type}`);
      });
      console.warn('\n💡 Action: Consider removing these types from our code\n');
    }

    if (missingTypes.length === 0 && deprecatedTypes.length === 0) {
      console.log('✅ ALL GOOD! Our type support is complete and up-to-date.\n');

      // Show current mappings status
      console.log('📋 Current type mappings:');
      availableTypes.forEach((type) => {
        console.log(`  ✅ ${type}`);
      });
    }

    // Generate code template for missing types
    if (missingTypes.length > 0) {
      console.log('📝 CODE TEMPLATE for missing types:');
      console.log('Add these cases to the switch statement in extractSorobanTypeFromScSpec:\n');

      missingTypes.forEach((type) => {
        const typeName = type.replace('scSpecType', '');
        console.log(`      case StellarSdk.xdr.ScSpecType.${type}():`);
        console.log(`        return '${typeName}';`);
      });
    }

    // Exit with error code if types are missing
    if (missingTypes.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error checking Stellar SDK types:', error.message);
    console.error('Make sure @stellar/stellar-sdk is installed');
    process.exit(1);
  }
}

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkStellarSDKTypes();
}

export { checkStellarSDKTypes, SUPPORTED_SCSPEC_TYPES };
