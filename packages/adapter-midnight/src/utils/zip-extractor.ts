/**
 * ZIP file extraction utility for Midnight contract artifacts
 * Handles extraction of contract files from uploaded ZIP archives
 */
import JSZip from 'jszip';

import { logger } from '@openzeppelin/ui-builder-utils';

const SYSTEM_LOG_TAG = 'ZipExtractor';

/**
 * ZK artifact files for a circuit (used by FetchZkConfigProvider)
 */
export interface ZkArtifact {
  prover: Uint8Array;
  verifier: Uint8Array;
  zkir?: Uint8Array;
}

/**
 * Extracted contract artifacts from ZIP file
 */
export interface ExtractedArtifacts {
  contractDefinition?: string;
  contractModule?: string;
  witnessCode?: string;
  verifierKeys?: Record<string, unknown>;
  zkArtifacts?: Record<string, ZkArtifact>;
}

/**
 * Filters out system and hidden files from ZIP file list
 */
function filterZipFiles(files: string[]): string[] {
  return files.filter(
    // Ignore macOS resource fork files and __MACOSX dir artifacts
    (f) => !f.includes('__MACOSX/') && !/\/_?\.[^/]+$/.test(f) && !/\/_\./.test(f)
  );
}

/**
 * Finds the best contract module file from available .cjs files
 */
function findContractModuleFile(files: string[]): string | undefined {
  const contractModuleFiles = files.filter(
    (f) => !f.endsWith('/') && f.endsWith('.cjs') && f.includes('contract')
  );

  return (
    contractModuleFiles.find((f) => f.endsWith('index.cjs')) ||
    contractModuleFiles.find((f) => f.includes('contract.cjs')) ||
    contractModuleFiles[0]
  );
}

/**
 * Scores a .d.ts file based on presence of key contract type declarations
 */
interface ScoredDefinition {
  path: string;
  content: string;
  score: number;
}

async function scoreDefinitionFile(zip: JSZip, path: string): Promise<ScoredDefinition> {
  const content = await zip.files[path].async('string');
  const hasCircuits = /export\s+(?:declare\s+)?type\s+Circuits\s*</s.test(content);
  const hasLedger = /export\s+(?:declare\s+)?type\s+Ledger\s*=\s*\{/s.test(content);
  const hasQueries = /export\s+(?:declare\s+)?type\s+Queries\s*</s.test(content);
  const score = (hasCircuits ? 2 : 0) + (hasLedger ? 1 : 0) + (hasQueries ? 1 : 0);
  return { path, content, score };
}

/**
 * Finds the best contract definition file based on naming patterns and content scoring
 */
async function findBestDefinitionFile(
  zip: JSZip,
  files: string[]
): Promise<ScoredDefinition | null> {
  const definitionFiles = files.filter(
    (f) => !f.endsWith('/') && (f.endsWith('.d.ts') || f.endsWith('.d.cts'))
  );

  if (definitionFiles.length === 0) {
    return null;
  }

  // Preferred filename patterns (checked in order)
  const preferredPatterns = [
    /contract\/index\.d\.(ts|cts)$/,
    /managed\/.+\/contract\/index\.d\.(ts|cts)$/,
    /index\.d\.(ts|cts)$/,
  ];

  // First pass: check preferred filenames
  for (const pattern of preferredPatterns) {
    const matchingFile = definitionFiles.find((f) => pattern.test(f));
    if (matchingFile) {
      return await scoreDefinitionFile(zip, matchingFile);
    }
  }

  // Second pass: score all definition files and pick the best
  let bestDef: ScoredDefinition | null = null;
  for (const file of definitionFiles) {
    try {
      const scored = await scoreDefinitionFile(zip, file);
      if (!bestDef || scored.score > bestDef.score) {
        bestDef = scored;
      }
    } catch {
      // Skip files that fail to load
    }
  }

  return bestDef;
}

/**
 * Resolves re-exports in TypeScript definition files
 * Follows export * declarations and aggregates content from multiple files
 */
async function resolveReExports(
  zip: JSZip,
  basePath: string,
  initialContent: string
): Promise<string> {
  const visited = new Set<string>();
  const queue: Array<{ path: string; content: string }> = [
    { path: basePath, content: initialContent },
  ];
  const aggregate: string[] = [];
  const maxFiles = 20;

  while (queue.length > 0 && aggregate.length < maxFiles) {
    const { path, content } = queue.shift()!;
    if (visited.has(path)) continue;

    visited.add(path);
    aggregate.push(content);

    const dir = path.substring(0, path.lastIndexOf('/') + 1);
    const exportAllRe = /export\s+\*\s+from\s+['"](.+?)['"];?/g;

    let match: RegExpExecArray | null;
    while ((match = exportAllRe.exec(content)) !== null) {
      const targetRaw = match[1];
      const resolvedPath = resolveExportPath(dir, targetRaw);

      for (const candidate of resolvedPath) {
        const file = zip.files[candidate];
        if (file) {
          const subContent = await file.async('string');
          queue.push({ path: candidate, content: subContent });
          break;
        }
      }
    }
  }

  if (queue.length > 0 && aggregate.length >= maxFiles) {
    logger.warn(
      SYSTEM_LOG_TAG,
      `Re-export resolution hit safety cap of ${maxFiles} files with ${queue.length} files still pending. ` +
        `Contract definition may be incomplete. Consider simplifying your re-export chain or increasing the limit.`
    );
  }

  return aggregate.join('\n');
}

/**
 * Resolves possible file paths for a TypeScript export declaration
 */
function resolveExportPath(baseDir: string, targetPath: string): string[] {
  const candidates: string[] = [];
  const rel = targetPath.replace(/^\.\//, '');

  if (rel.endsWith('.d.ts') || rel.endsWith('.d.cts')) {
    candidates.push(baseDir + rel);
  } else {
    if (rel.endsWith('.cjs') || rel.endsWith('.js')) {
      candidates.push(baseDir + rel.replace(/\.(cjs|js)$/i, '.d.cts'));
      candidates.push(baseDir + rel.replace(/\.(cjs|js)$/i, '.d.ts'));
    } else {
      candidates.push(baseDir + rel + '.d.cts');
      candidates.push(baseDir + rel + '.d.ts');
    }

    const baseSubDir = baseDir + rel.replace(/\/$/, '');
    candidates.push(baseSubDir + '/index.d.cts');
    candidates.push(baseSubDir + '/index.d.ts');
  }

  return candidates;
}

/**
 * Appends witness type definitions to contract definition.
 * This enhances the contract definition with witness type information,
 * which is used for identity secret key property derivation.
 */
async function appendWitnessTypeDefinitions(
  zip: JSZip,
  files: string[],
  existingDefinition: string
): Promise<string> {
  try {
    const witnessDtsFiles = files.filter(
      (f) => !f.endsWith('/') && f.endsWith('.d.ts') && /witness/i.test(f) && !/\.map$/.test(f)
    );

    if (witnessDtsFiles.length === 0) {
      logger.debug(SYSTEM_LOG_TAG, 'No witness .d.ts files found in ZIP');
      return existingDefinition;
    }

    logger.debug(SYSTEM_LOG_TAG, `Found ${witnessDtsFiles.length} witness .d.ts file(s)`);
    const contents = await Promise.all(witnessDtsFiles.map((p) => zip.files[p].async('string')));

    return [existingDefinition, ...contents].filter(Boolean).join('\n\n');
  } catch (err) {
    // Log at warning level since this could affect identity secret derivation
    logger.warn(
      SYSTEM_LOG_TAG,
      'Failed to append witness type definitions to contract definition. This may affect automatic detection of identity secret key property name.',
      err instanceof Error ? err.message : String(err)
    );
    return existingDefinition;
  }
}

/**
 * Finds and extracts witness code file
 */
async function extractWitnessCode(zip: JSZip, files: string[]): Promise<string | undefined> {
  const witnessCandidates = files.filter(
    (f) =>
      !f.endsWith('/') &&
      /witness/i.test(f) &&
      (f.endsWith('.cjs') || f.endsWith('.js') || f.endsWith('.ts')) &&
      !f.endsWith('.map')
  );

  if (witnessCandidates.length === 0) {
    return undefined;
  }

  const priority = (file: string): number => {
    if (file.endsWith('.cjs')) return 0;
    if (file.endsWith('.js')) return 1;
    if (file.endsWith('.ts')) return 2;
    return 3;
  };

  const selectedWitness = witnessCandidates.sort((a, b) => priority(a) - priority(b))[0];
  return await zip.files[selectedWitness].async('string');
}

/**
 * Extracts ZK artifacts for a single circuit
 */
async function extractCircuitArtifacts(
  zip: JSZip,
  files: string[],
  proverFile: string,
  circuitName: string
): Promise<ZkArtifact | null> {
  try {
    const proverBytes = await zip.files[proverFile].async('uint8array');

    const verifierFile = files.find(
      (f) => f.endsWith(`${circuitName}.verifier`) && !/\/_\./.test(f)
    );

    if (!verifierFile) {
      logger.warn(SYSTEM_LOG_TAG, `No verifier found for prover: ${circuitName}`);
      return null;
    }

    const verifierBytes = await zip.files[verifierFile].async('uint8array');

    const zkirFileB = files.find((f) => f.endsWith(`${circuitName}.bzkir`) && !/\/_.\./.test(f));
    const zkirFileZ = files.find((f) => f.endsWith(`${circuitName}.zkir`) && !/\/_.\./.test(f));
    const zkirFile = zkirFileB || zkirFileZ;

    let zkirBytes: Uint8Array | undefined;
    if (zkirFile) {
      zkirBytes = await zip.files[zkirFile].async('uint8array');
      logger.debug(
        SYSTEM_LOG_TAG,
        `Found ${zkirFile.endsWith('.bzkir') ? 'bzkir' : 'zkir'} for ${circuitName}: ${zkirBytes.length} bytes`
      );

      if (!zkirFileB && zkirFileZ) {
        logger.warn(
          SYSTEM_LOG_TAG,
          `Using legacy textual .zkir for ${circuitName}. Proof server may require binary .bzkir; if you encounter 400 errors, rebuild artifacts to include .bzkir.`
        );
      }
    } else {
      logger.warn(SYSTEM_LOG_TAG, `No zkir/bzkir file found for ${circuitName}`);
    }

    logger.info(
      SYSTEM_LOG_TAG,
      `Extracted ZK artifacts for ${circuitName}: prover=${proverBytes.length}b verifier=${verifierBytes.length}b zkir=${zkirBytes?.length ?? 0}b`
    );

    return {
      prover: proverBytes,
      verifier: verifierBytes,
      zkir: zkirBytes,
    };
  } catch (err) {
    logger.warn(SYSTEM_LOG_TAG, `Failed to extract ZK artifacts for ${circuitName}:`, err);
    return null;
  }
}

/**
 * Extracts all ZK artifacts from the ZIP file
 */
async function extractZkArtifacts(
  zip: JSZip,
  files: string[]
): Promise<Record<string, ZkArtifact>> {
  const zkArtifacts: Record<string, ZkArtifact> = {};

  const proverFiles = files.filter(
    (f) => !f.endsWith('/') && f.endsWith('.prover') && !/\/_\./.test(f)
  );

  logger.info(SYSTEM_LOG_TAG, `Found ${proverFiles.length} .prover files in ZIP:`, proverFiles);

  for (const proverFile of proverFiles) {
    const match = proverFile.match(/([^/]+)\.prover$/);
    if (!match) continue;

    const circuitName = match[1];
    logger.debug(SYSTEM_LOG_TAG, `Processing circuit: ${circuitName} from ${proverFile}`);

    const artifact = await extractCircuitArtifacts(zip, files, proverFile, circuitName);
    if (artifact) {
      zkArtifacts[circuitName] = artifact;
    }
  }

  if (Object.keys(zkArtifacts).length > 0) {
    logger.info(SYSTEM_LOG_TAG, `Extracted ${Object.keys(zkArtifacts).length} ZK artifact sets`);
  } else {
    logger.warn(
      SYSTEM_LOG_TAG,
      'No ZK artifacts extracted! This may prevent transaction execution.'
    );
  }

  return zkArtifacts;
}

/**
 * Extracts legacy verifier keys for backward compatibility
 */
async function extractLegacyVerifierKeys(
  zip: JSZip,
  files: string[]
): Promise<Record<string, unknown>> {
  const verifierKeys: Record<string, unknown> = {};

  const verifierFiles = files.filter(
    (f) => !f.endsWith('/') && f.endsWith('.verifier') && !/\/_\./.test(f)
  );

  for (const verifierFile of verifierFiles) {
    const match = verifierFile.match(/([^/]+)\.verifier$/);
    if (!match) continue;

    const circuitName = match[1];
    try {
      const bytes = await zip.files[verifierFile].async('uint8array');

      try {
        const text = new TextDecoder().decode(bytes);
        const parsed = JSON.parse(text);
        verifierKeys[circuitName] = parsed;
      } catch {
        verifierKeys[circuitName] = bytes;
      }
    } catch (err) {
      logger.warn(SYSTEM_LOG_TAG, `Failed to parse verifier key for ${circuitName}:`, err);
    }
  }

  return verifierKeys;
}

/**
 * Validates that required artifacts are present
 */
function validateRequiredArtifacts(artifacts: ExtractedArtifacts): void {
  if (!artifacts.contractModule) {
    throw new Error(
      'Missing required contract module (.cjs file). Please ensure your ZIP contains the compiled contract code.'
    );
  }

  if (!artifacts.contractDefinition) {
    throw new Error(
      'Missing required contract definition (.d.ts file). Please ensure your ZIP contains the TypeScript interface definition.'
    );
  }
}

/**
 * Extracts Midnight contract artifacts from a ZIP file
 * Supports flexible directory structures and searches for required files
 *
 * @param zipData - ZIP file data as ArrayBuffer, Blob, or base64 string
 * @returns Extracted artifacts
 * @throws Error if ZIP is invalid or required files are missing
 */
export async function extractMidnightContractZip(
  zipData: ArrayBuffer | Blob | string
): Promise<ExtractedArtifacts> {
  logger.info(SYSTEM_LOG_TAG, 'Starting ZIP extraction');

  try {
    const zip = await JSZip.loadAsync(
      zipData,
      typeof zipData === 'string' ? { base64: true } : undefined
    );

    const files = filterZipFiles(Object.keys(zip.files));
    const artifacts: ExtractedArtifacts = {};

    // Extract contract module
    const contractModuleFile = findContractModuleFile(files);
    if (contractModuleFile) {
      artifacts.contractModule = await zip.files[contractModuleFile].async('string');
    }

    // Extract contract definition
    const bestDef = await findBestDefinitionFile(zip, files);
    if (bestDef) {
      const resolved = await resolveReExports(zip, bestDef.path, bestDef.content);
      artifacts.contractDefinition = await appendWitnessTypeDefinitions(zip, files, resolved);
    }

    // Extract witness code
    artifacts.witnessCode = await extractWitnessCode(zip, files);

    // Extract ZK artifacts
    const zkArtifacts = await extractZkArtifacts(zip, files);
    if (Object.keys(zkArtifacts).length > 0) {
      artifacts.zkArtifacts = zkArtifacts;
    }

    // Extract legacy verifier keys
    const verifierKeys = await extractLegacyVerifierKeys(zip, files);
    if (Object.keys(verifierKeys).length > 0) {
      artifacts.verifierKeys = verifierKeys;
    }

    // Validate required artifacts are present
    validateRequiredArtifacts(artifacts);

    logger.info(
      SYSTEM_LOG_TAG,
      `ZIP extracted. module:${!!artifacts.contractModule} d.ts:${!!artifacts.contractDefinition} witness:${!!artifacts.witnessCode} zkArtifacts:${Object.keys(artifacts.zkArtifacts || {}).length} legacyKeys:${Object.keys(verifierKeys).length}`
    );

    return artifacts;
  } catch (e) {
    logger.error(SYSTEM_LOG_TAG, 'Failed to extract ZIP file:', e);

    if (e instanceof Error) {
      if (e.message.includes('not a valid zip')) {
        throw new Error(
          'Invalid ZIP file. Please upload a valid ZIP archive containing your contract artifacts.'
        );
      }
      throw e;
    }

    throw new Error('Failed to extract contract artifacts from ZIP file');
  }
}

/**
 * Converts a File object to base64 string for storage
 *
 * @param file - File object from file input
 * @returns Base64 encoded string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix to get just base64
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validates that a ZIP file contains the expected Midnight contract structure
 * This is a lighter validation than extraction - just checks file presence
 *
 * @param zipData - ZIP file data
 * @returns Object with validation results
 */
export async function validateMidnightZip(zipData: ArrayBuffer | Blob | string): Promise<{
  isValid: boolean;
  hasContractModule: boolean;
  hasContractDefinition: boolean;
  hasVerifierKeys: boolean;
  hasWitnessCode: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const zip = await JSZip.loadAsync(
      zipData,
      typeof zipData === 'string' ? { base64: true } : undefined
    );
    const files = Object.keys(zip.files);

    const hasContractModule = files.some((f) => f.endsWith('.cjs'));
    const hasContractDefinition = files.some((f) => f.endsWith('.d.ts'));
    const hasVerifierKeys = files.some((f) => f.endsWith('.verifier'));
    const hasWitnessCode = files.some(
      (f) => f.includes('witness') && (f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.cjs'))
    );

    if (!hasContractModule) {
      errors.push('No contract module (.cjs) file found');
    }
    if (!hasContractDefinition) {
      errors.push('No contract definition (.d.ts) file found');
    }

    return {
      isValid: errors.length === 0,
      hasContractModule,
      hasContractDefinition,
      hasVerifierKeys,
      hasWitnessCode,
      errors,
    };
  } catch {
    return {
      isValid: false,
      hasContractModule: false,
      hasContractDefinition: false,
      hasVerifierKeys: false,
      hasWitnessCode: false,
      errors: ['Invalid ZIP file format'],
    };
  }
}
