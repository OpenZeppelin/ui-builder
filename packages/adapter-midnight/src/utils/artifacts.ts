/**
 * Utility functions for Midnight contract artifacts validation and conversion
 */
import { logger } from '@openzeppelin/ui-utils';

import { globalZkConfigProvider } from '../transaction/providers';
import type { MidnightContractArtifacts } from '../types/artifacts';
import { isMidnightContractArtifacts } from '../types/artifacts';
import { deriveIdentitySecretPropertyName } from './identity-secret-derivation';
import { extractMidnightContractZip, fileToBase64 } from './zip-extractor';

const SYSTEM_LOG_TAG = 'ArtifactsValidator';

/**
 * Validates and converts generic source input to MidnightContractArtifacts
 * Now supports ZIP file uploads in addition to direct artifacts
 *
 * @param source - Generic contract source (string address or artifacts object)
 * @returns Validated MidnightContractArtifacts
 * @throws Error if the source is invalid
 */
export async function validateAndConvertMidnightArtifacts(
  source: string | Record<string, unknown>
): Promise<MidnightContractArtifacts> {
  if (typeof source === 'string') {
    throw new Error(
      'Midnight adapter requires contract artifacts object, not just an address string.'
    );
  }

  // Support URL-based artifacts (exported apps fetching static asset)
  if (
    typeof (source as Record<string, unknown>).contractArtifactsUrl === 'string' &&
    (source as Record<string, unknown>).contractArtifactsUrl
  ) {
    logger.info(SYSTEM_LOG_TAG, 'Processing URL-based artifacts');
    const url = (source as Record<string, unknown>).contractArtifactsUrl as string;
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to fetch artifacts ZIP from ${url} (${resp.status})`);
    }
    const blob = await resp.blob();
    const extractedArtifacts = await extractMidnightContractZip(blob);

    if (!extractedArtifacts.contractDefinition) {
      throw new Error('Contract definition is missing from the fetched ZIP.');
    }
    if (!extractedArtifacts.contractModule) {
      throw new Error('Contract module is missing from the fetched ZIP.');
    }

    if (extractedArtifacts.zkArtifacts) {
      globalZkConfigProvider.registerAll(extractedArtifacts.zkArtifacts);
      logger.info(
        SYSTEM_LOG_TAG,
        `Registered ${Object.keys(extractedArtifacts.zkArtifacts).length} ZK artifact sets with EmbeddedZkConfigProvider:`,
        Object.keys(extractedArtifacts.zkArtifacts)
      );
    }

    const sourceRecord = source as Record<string, unknown>;
    if (!sourceRecord.contractAddress || !sourceRecord.privateStateId) {
      throw new Error('Contract address and private state ID are required.');
    }

    const artifacts: MidnightContractArtifacts = {
      contractAddress: sourceRecord.contractAddress as string,
      privateStateId: sourceRecord.privateStateId as string,
      contractDefinition: extractedArtifacts.contractDefinition,
      contractModule: extractedArtifacts.contractModule,
      witnessCode: extractedArtifacts.witnessCode,
      verifierKeys: extractedArtifacts.verifierKeys,
      // Note: do not set originalZipData when loading via URL
    };
    // Derive and store contract-level default for identity secret key property
    artifacts.identitySecretKeyPropertyName =
      deriveIdentitySecretPropertyName(artifacts) ?? undefined;
    return artifacts;
  }

  // Support loading from a previously trimmed ZIP saved in IndexedDB
  // This path is used when a configuration was saved with `trimmedZipBase64`
  // instead of the original heavy ZIP. Treat it the same as a base64 ZIP upload.
  if (
    typeof (source as Record<string, unknown>).trimmedZipBase64 === 'string' &&
    (source as Record<string, unknown>).trimmedZipBase64
  ) {
    logger.info(SYSTEM_LOG_TAG, 'Processing trimmed base64 ZIP from saved configuration');

    const base64Data = (source as Record<string, unknown>).trimmedZipBase64 as string;

    const extractedArtifacts = await extractMidnightContractZip(base64Data);

    if (!extractedArtifacts.contractDefinition) {
      throw new Error('Contract definition is missing from the trimmed ZIP.');
    }
    if (!extractedArtifacts.contractModule) {
      throw new Error('Contract module is missing from the trimmed ZIP.');
    }

    if (extractedArtifacts.zkArtifacts) {
      globalZkConfigProvider.registerAll(extractedArtifacts.zkArtifacts);
      logger.info(
        SYSTEM_LOG_TAG,
        `Registered ${Object.keys(extractedArtifacts.zkArtifacts).length} ZK artifact sets with EmbeddedZkConfigProvider:`,
        Object.keys(extractedArtifacts.zkArtifacts)
      );
    }

    const sourceRecord = source as Record<string, unknown>;
    if (!sourceRecord.contractAddress || !sourceRecord.privateStateId) {
      throw new Error('Contract address and private state ID are required.');
    }

    const artifacts: MidnightContractArtifacts = {
      contractAddress: sourceRecord.contractAddress as string,
      privateStateId: sourceRecord.privateStateId as string,
      contractDefinition: extractedArtifacts.contractDefinition,
      contractModule: extractedArtifacts.contractModule,
      witnessCode: extractedArtifacts.witnessCode,
      verifierKeys: extractedArtifacts.verifierKeys,
      trimmedZipBase64: base64Data, // Preserve for persistence and export
      // Note: keep storage minimal; do not set originalZipData here
    };
    artifacts.identitySecretKeyPropertyName =
      deriveIdentitySecretPropertyName(artifacts) ?? undefined;
    return artifacts;
  }

  // Check if this is a ZIP upload
  if (source.contractArtifactsZip) {
    logger.info(SYSTEM_LOG_TAG, 'Processing ZIP file upload');

    const zipData = source.contractArtifactsZip;
    let base64Data: string;

    // Handle different input formats
    if (zipData instanceof File) {
      // Convert File to base64 for storage
      base64Data = await fileToBase64(zipData);
    } else if (typeof zipData === 'string') {
      // Already base64 (from auto-save restore)
      base64Data = zipData;
    } else {
      throw new Error('Invalid ZIP file format. Expected File or base64 string.');
    }

    // Extract artifacts from ZIP
    const extractedArtifacts = await extractMidnightContractZip(base64Data);

    // Validate required fields from extraction
    if (!extractedArtifacts.contractDefinition) {
      throw new Error(
        'Contract definition is missing from the extracted artifacts. The ZIP file may be corrupted or incomplete.'
      );
    }

    if (!extractedArtifacts.contractModule) {
      throw new Error(
        'Contract module is missing from the extracted artifacts. The ZIP file may be corrupted or incomplete.'
      );
    }

    // Register ZK artifacts with the global provider (works in dev and production)
    if (extractedArtifacts.zkArtifacts) {
      globalZkConfigProvider.registerAll(extractedArtifacts.zkArtifacts);
      logger.info(
        SYSTEM_LOG_TAG,
        `Registered ${Object.keys(extractedArtifacts.zkArtifacts).length} ZK artifact sets with EmbeddedZkConfigProvider:`,
        Object.keys(extractedArtifacts.zkArtifacts)
      );
    }

    // Validate required form fields
    if (!source.contractAddress || !source.privateStateId) {
      throw new Error('Contract address and private state ID are required.');
    }

    // Combine with address and privateStateId (all fields are now validated)
    const artifacts: MidnightContractArtifacts = {
      contractAddress: source.contractAddress as string,
      privateStateId: source.privateStateId as string,
      contractDefinition: extractedArtifacts.contractDefinition,
      contractModule: extractedArtifacts.contractModule,
      witnessCode: extractedArtifacts.witnessCode,
      verifierKeys: extractedArtifacts.verifierKeys,
      originalZipData: base64Data, // Store for auto-save
    };

    artifacts.identitySecretKeyPropertyName =
      deriveIdentitySecretPropertyName(artifacts) ?? undefined;
    return artifacts;
  }

  // Legacy path: direct artifacts object
  if (!isMidnightContractArtifacts(source)) {
    throw new Error(
      'Invalid contract artifacts provided. Expected an object with contractAddress, privateStateId, and contractDefinition properties.'
    );
  }

  return source;
}
