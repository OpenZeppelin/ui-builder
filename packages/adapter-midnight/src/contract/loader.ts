import type { ContractSchema, MidnightNetworkConfig } from '@openzeppelin/ui-builder-types';
import { logger, simpleHash } from '@openzeppelin/ui-builder-utils';

import type { MidnightContractArtifacts } from '../types/artifacts';
import { parseMidnightContractInterface } from '../utils/schema-parser';

export interface MidnightContractLoadResult {
  schema: ContractSchema;
  source: 'fetched' | 'manual';
  contractDefinitionOriginal?: string;
  metadata?: {
    fetchedFrom?: string;
    contractName?: string;
    verificationStatus?: 'verified' | 'unverified' | 'unknown';
    fetchTimestamp?: Date;
    definitionHash?: string;
  };
  contractDefinitionArtifacts?: Record<string, unknown>;
  proxyInfo?: undefined;
}

export async function loadMidnightContract(
  artifacts: MidnightContractArtifacts,
  _networkConfig?: MidnightNetworkConfig
): Promise<MidnightContractLoadResult> {
  logger.info('loadMidnightContract', 'Loading Midnight contract from artifacts');

  const { functions, events } = parseMidnightContractInterface(artifacts.contractDefinition);

  const schema: ContractSchema = {
    name: 'MyMidnightContract',
    ecosystem: 'midnight',
    address: artifacts.contractAddress,
    functions,
    events,
  };

  const definition = artifacts.contractDefinition || '';
  const metadata = {
    fetchedFrom: 'local',
    verificationStatus: 'unknown' as const,
    fetchTimestamp: new Date(),
    definitionHash: definition ? simpleHash(definition) : undefined,
  };

  return {
    schema,
    source: 'manual',
    contractDefinitionOriginal: artifacts.contractDefinition,
    metadata,
  };
}

export async function loadMidnightContractWithMetadata(
  artifacts: MidnightContractArtifacts,
  networkConfig?: MidnightNetworkConfig
): Promise<MidnightContractLoadResult> {
  const base = await loadMidnightContract(artifacts, networkConfig);

  const artifactsRecord: Record<string, unknown> = {};
  if (artifacts.privateStateId) artifactsRecord.privateStateId = artifacts.privateStateId;
  if (artifacts.contractModule) artifactsRecord.contractModule = artifacts.contractModule;
  if (artifacts.witnessCode) artifactsRecord.witnessCode = artifacts.witnessCode;
  if (artifacts.verifierKeys) artifactsRecord.verifierKeys = artifacts.verifierKeys;
  if (artifacts.originalZipData) artifactsRecord.originalZipData = artifacts.originalZipData;
  if (artifacts.trimmedZipBase64) artifactsRecord.trimmedZipBase64 = artifacts.trimmedZipBase64;

  return {
    ...base,
    contractDefinitionArtifacts:
      Object.keys(artifactsRecord).length > 0 ? artifactsRecord : undefined,
  };
}
