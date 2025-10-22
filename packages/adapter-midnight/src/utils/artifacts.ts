/**
 * Utility functions for Midnight contract artifacts validation and conversion
 */
import { logger } from '@openzeppelin/ui-builder-utils';

import type { MidnightContractArtifacts } from '../types/artifacts';
import { isMidnightContractArtifacts } from '../types/artifacts';
import { globalZkConfigProvider } from '../transaction/providers';
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

    // Register ZK artifacts with the global provider (works in dev and production)
    if (extractedArtifacts.zkArtifacts) {
      globalZkConfigProvider.registerAll(extractedArtifacts.zkArtifacts);
      logger.info(
        SYSTEM_LOG_TAG,
        `Registered ${Object.keys(extractedArtifacts.zkArtifacts).length} ZK artifact sets with EmbeddedZkConfigProvider:`,
        Object.keys(extractedArtifacts.zkArtifacts)
      );
    }

    // Combine with address and privateStateId
    const artifacts: MidnightContractArtifacts = {
      contractAddress: source.contractAddress as string,
      privateStateId: source.privateStateId as string,
      contractDefinition: extractedArtifacts.contractDefinition!,
      contractModule: extractedArtifacts.contractModule,
      witnessCode: extractedArtifacts.witnessCode,
      verifierKeys: extractedArtifacts.verifierKeys,
      originalZipData: base64Data, // Store for auto-save
    };

    // Validate required fields
    if (!artifacts.contractAddress || !artifacts.privateStateId) {
      throw new Error('Contract address and private state ID are required.');
    }

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
