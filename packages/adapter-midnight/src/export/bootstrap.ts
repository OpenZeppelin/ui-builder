import type { AdapterExportBootstrap, AdapterExportContext } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

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

  // Extract artifacts from context
  const artifacts = context.artifacts;

  // Validate required fields
  if (!artifacts || !artifacts.originalZipData) {
    logger.warn(SYSTEM_LOG_TAG, 'Missing required ZIP data. Cannot generate bootstrap files.');
    return null;
  }

  const zipData = artifacts.originalZipData as string;
  const contractAddress =
    context.formConfig.contractAddress || context.contractSchema.address || '';
  const privateStateId = (artifacts.privateStateId as string) || '';

  // Validate critical fields
  if (!contractAddress || !privateStateId) {
    logger.error(
      SYSTEM_LOG_TAG,
      'Missing contract address or private state ID. Cannot generate bootstrap files.'
    );
    return null;
  }

  // Generate the artifacts.ts file with just the ZIP data and metadata
  const artifactsFileContent = `/**
 * Midnight Contract Artifacts
 *
 * This file contains the original contract ZIP file as a base64 string,
 * along with the contract address and private state ID. The adapter will
 * parse the ZIP file at runtime using the same logic as the builder.
 *
 * This approach keeps the exported file small and reuses existing parsing logic.
 */

export const midnightArtifactsSource = {
  contractAddress: '${contractAddress}',
  privateStateId: '${privateStateId}',
  contractArtifactsZip: '${zipData}',
};
`;

  // Generate initialization code that passes the ZIP data to the adapter
  const initCode = `// Load Midnight contract from ZIP file (same as builder does)
    if (typeof (adapter as any).loadContractWithMetadata === 'function') {
      await (adapter as any).loadContractWithMetadata(midnightArtifactsSource);
    }`;

  logger.info(SYSTEM_LOG_TAG, 'Successfully generated Midnight bootstrap files with ZIP data');

  return {
    files: {
      'src/midnight/artifacts.ts': artifactsFileContent,
    },
    imports: ["import { midnightArtifactsSource } from './midnight/artifacts';"],
    initAfterAdapterConstruct: initCode,
  };
}
