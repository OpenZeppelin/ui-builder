import type { AdapterExportBootstrap, AdapterExportContext } from '@openzeppelin/ui-builder-types';
import { base64ToBytes, logger } from '@openzeppelin/ui-builder-utils';

import { stripZipForFunction } from '../utils/zip-slimmer';

const SYSTEM_LOG_TAG = 'MidnightAdapter:ExportBootstrap';

/**
 * Generates bootstrap files for Midnight contract artifacts in exported applications.
 *
 * Instead of embedding massive artifact files, this bundles the original ZIP file
 * as a base64 string and lets the adapter parse it using the same logic as the builder.
 *
 * @param context - Export context with form config, schema, network, and artifacts
 * @returns Bootstrap configuration with ZIP data and initialization code
 */
export async function getMidnightExportBootstrapFiles(
  context: AdapterExportContext
): Promise<AdapterExportBootstrap | null> {
  logger.info(SYSTEM_LOG_TAG, 'Generating Midnight export bootstrap files');

  const artifacts = context.artifacts || {};
  const functionId = context.functionId || context.formConfig.functionId;

  const contractAddress =
    context.formConfig.contractAddress || context.contractSchema.address || '';
  const privateStateId = (artifacts['privateStateId'] as string) || '';

  if (!contractAddress || !privateStateId) {
    logger.error(SYSTEM_LOG_TAG, 'Missing contract address or private state ID.');
    return null;
  }

  const base64Zip =
    (artifacts['trimmedZipBase64'] as string | undefined) ||
    (artifacts['originalZipData'] as string | undefined);

  if (!base64Zip) {
    logger.warn(SYSTEM_LOG_TAG, 'No ZIP data found in artifacts; cannot add public asset.');
    return null;
  }

  const originalBytes = base64ToBytes(base64Zip);
  const zipBytes = functionId
    ? await stripZipForFunction(originalBytes, functionId).catch(() => originalBytes)
    : originalBytes;

  const artifactsFileContent = `
export const midnightArtifactsSource = {
  contractAddress: '${contractAddress}',
  privateStateId: '${privateStateId}',
  contractArtifactsUrl: '/midnight/contract.zip',
};
`;

  const initCode = `// Load Midnight contract from URL-based ZIP (same as builder does)
    if (typeof (adapter as any).loadContractWithMetadata === 'function') {
      await (adapter as any).loadContractWithMetadata(midnightArtifactsSource);
    }`;

  logger.info(SYSTEM_LOG_TAG, 'Successfully generated Midnight bootstrap files with URL');

  return {
    files: {
      'src/midnight/artifacts.ts': artifactsFileContent,
    },
    binaryFiles: {
      'public/midnight/contract.zip': zipBytes,
    },
    imports: ["import { midnightArtifactsSource } from './midnight/artifacts';"],
    initAfterAdapterConstruct: initCode,
  };
}
