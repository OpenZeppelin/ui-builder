import { logger } from '@openzeppelin/ui-utils';

import { stripZipForFunction } from './zip-slimmer';

const SYSTEM_LOG_TAG = 'ArtifactPreparation';

/**
 * Prepares artifacts for a specific function by trimming the ZIP to only include
 * necessary circuit keys and returning persistable data for storage.
 *
 * @param functionId - The function ID to prepare artifacts for
 * @param currentArtifacts - The current artifacts from the builder state
 * @returns Prepared artifacts with trimmed ZIP, public assets, and bootstrap source
 */
export async function prepareArtifactsForFunction(
  functionId: string,
  currentArtifacts: Record<string, unknown>
): Promise<{
  persistableArtifacts?: Record<string, unknown>;
  publicAssets?: Record<string, Uint8Array | Blob>;
  bootstrapSource?: Record<string, unknown>;
}> {
  // Prefer original file/blob if available, else base64
  const zipSource: Blob | string | undefined =
    (currentArtifacts.originalZipBlob as Blob) ??
    (currentArtifacts.originalZipData as string) ??
    undefined;

  if (!zipSource) {
    // Fallback: if we have no zip, persist existing small artifacts as-is
    logger.info(SYSTEM_LOG_TAG, 'No ZIP source available, persisting existing artifacts');
    return {
      persistableArtifacts: {
        privateStateId: currentArtifacts.privateStateId,
        contractModule: currentArtifacts.contractModule,
        contractDefinition: currentArtifacts.contractDefinition,
        witnessCode: currentArtifacts.witnessCode,
        identitySecretKeyPropertyName: currentArtifacts.identitySecretKeyPropertyName,
      },
    };
  }

  try {
    logger.info(SYSTEM_LOG_TAG, `Trimming ZIP for function: ${functionId}`);
    const slim = await stripZipForFunction(zipSource, functionId);
    const assetPath = 'public/midnight/contract.zip';

    return {
      // Store only small fields; omit originalZipData
      persistableArtifacts: {
        privateStateId: currentArtifacts.privateStateId,
        contractModule: currentArtifacts.contractModule,
        contractDefinition: currentArtifacts.contractDefinition,
        witnessCode: currentArtifacts.witnessCode,
        identitySecretKeyPropertyName: currentArtifacts.identitySecretKeyPropertyName,
        // Store the trimmed ZIP as base64 for later export
        // Note: Buffer is available via the polyfill in browser-init.ts (loaded when adapter is imported)
        trimmedZipBase64: Buffer.from(slim).toString('base64'),
      },
      publicAssets: {
        [assetPath]: slim,
      },
      bootstrapSource: {
        contractAddress: currentArtifacts.contractAddress,
        identitySecretKeyPropertyName: currentArtifacts.identitySecretKeyPropertyName,
        contractArtifactsUrl: '/midnight/contract.zip',
      },
    };
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, 'Failed to trim ZIP for function; falling back:', error);
    return {
      persistableArtifacts: {
        privateStateId: currentArtifacts.privateStateId,
        contractModule: currentArtifacts.contractModule,
        contractDefinition: currentArtifacts.contractDefinition,
        witnessCode: currentArtifacts.witnessCode,
        identitySecretKeyPropertyName: currentArtifacts.identitySecretKeyPropertyName,
      },
    };
  }
}
