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
    // Load ZIP file - if string, assume it's base64
    const zip = await JSZip.loadAsync(
      zipData,
      typeof zipData === 'string' ? { base64: true } : undefined
    );

    const artifacts: ExtractedArtifacts = {};
    const verifierKeys: Record<string, unknown> = {};

    // Find all files in the ZIP
    const files = Object.keys(zip.files).filter(
      // Ignore macOS resource fork files and __MACOSX dir artifacts
      (f) => !f.includes('__MACOSX/') && !/\/_?\.[^/]+$/.test(f) && !/\/_\./.test(f)
    );

    // Look for contract module (*.cjs file)
    // Support various structures: dist/contract/index.cjs, dist/managed/*/contract/index.cjs, etc.
    const contractModuleFiles = files.filter(
      (f) => !f.endsWith('/') && f.endsWith('.cjs') && f.includes('contract')
    );

    // Try to find the main contract module (prefer index.cjs)
    const contractModuleFile =
      contractModuleFiles.find((f) => f.endsWith('index.cjs')) ||
      contractModuleFiles.find((f) => f.includes('contract.cjs')) ||
      contractModuleFiles[0];

    if (contractModuleFile) {
      artifacts.contractModule = await zip.files[contractModuleFile].async('string');
    }

    // Look for contract definition (*.d.ts or *.d.cts file)
    const definitionFiles = files.filter(
      (f) => !f.endsWith('/') && (f.endsWith('.d.ts') || f.endsWith('.d.cts'))
    );

    // Helper to load and test a .d.ts file for circuit/query declarations
    const loadAndScoreDts = async (path: string) => {
      const content = await zip.files[path].async('string');
      const hasCircuits = /export\s+(?:declare\s+)?type\s+Circuits\s*</s.test(content);
      const hasLedger = /export\s+(?:declare\s+)?type\s+Ledger\s*=\s*\{/s.test(content);
      const hasQueries = /export\s+(?:declare\s+)?type\s+Queries\s*</s.test(content);
      const score = (hasCircuits ? 2 : 0) + (hasLedger ? 1 : 0) + (hasQueries ? 1 : 0);
      return { path, content, score } as const;
    };

    // Candidate ordering preferences
    const preferred = [
      /contract\/index\.d\.(ts|cts)$/,
      /managed\/.+\/contract\/index\.d\.(ts|cts)$/,
      /index\.d\.(ts|cts)$/,
    ];

    let bestDef: { path: string; content: string; score: number } | null = null;

    // First pass: prefer filenames
    for (const rx of preferred) {
      const p = definitionFiles.find((f) => rx.test(f));
      if (p) {
        const scored = await loadAndScoreDts(p);
        bestDef = scored;
        break;
      }
    }

    // Second pass: scan all .d.ts for declarations if not good enough
    if (!bestDef || bestDef.score === 0) {
      for (const f of definitionFiles) {
        try {
          const scored = await loadAndScoreDts(f);
          if (!bestDef || scored.score > bestDef.score) bestDef = scored;
        } catch {}
      }
    }

    // Handle re-export only .d.ts files by following exports to actual definition files
    const resolveReExports = async (basePath: string, initialContent: string): Promise<string> => {
      // Breadth-first traversal of export-star chains up to a safe limit
      const visited = new Set<string>();
      const queue: Array<{ path: string; content: string }> = [
        {
          path: basePath,
          content: initialContent,
        },
      ];

      const aggregate: string[] = [];
      const maxFiles = 20; // safety cap

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
          const candidates: string[] = [];

          // Normalize relative path
          const rel = targetRaw.replace(/^\.\//, '');

          // If target already ends with a definition extension, use directly
          if (rel.endsWith('.d.ts') || rel.endsWith('.d.cts')) {
            candidates.push(dir + rel);
          } else {
            // Try matching definition files next to JS/CJS modules
            if (rel.endsWith('.cjs') || rel.endsWith('.js')) {
              candidates.push(dir + rel.replace(/\.(cjs|js)$/i, '.d.cts'));
              candidates.push(dir + rel.replace(/\.(cjs|js)$/i, '.d.ts'));
            } else {
              candidates.push(dir + rel + '.d.cts');
              candidates.push(dir + rel + '.d.ts');
            }
            // Also try directory index definitions
            const baseDir = dir + rel.replace(/\/$/, '');
            candidates.push(baseDir + '/index.d.cts');
            candidates.push(baseDir + '/index.d.ts');
          }

          for (const candidate of candidates) {
            const file = zip.files[candidate];
            if (file) {
              const subContent = await file.async('string');
              queue.push({ path: candidate, content: subContent });
              break; // stop after first match
            }
          }
        }
      }

      // Warn if we hit the safety cap with remaining exports to process
      if (queue.length > 0 && aggregate.length >= maxFiles) {
        logger.warn(
          SYSTEM_LOG_TAG,
          `Re-export resolution hit safety cap of ${maxFiles} files with ${queue.length} files still pending. ` +
            `Contract definition may be incomplete. Consider simplifying your re-export chain or increasing the limit.`
        );
      }

      return aggregate.join('\n');
    };

    if (bestDef) {
      const resolved = await resolveReExports(bestDef.path, bestDef.content);
      artifacts.contractDefinition = resolved;
    }

    // Look for witness files (various possible names)
    const witnessCandidates = files.filter(
      (f) =>
        !f.endsWith('/') &&
        /witness/i.test(f) &&
        (f.endsWith('.cjs') || f.endsWith('.js') || f.endsWith('.ts')) &&
        !f.endsWith('.map')
    );

    if (witnessCandidates.length > 0) {
      const priority = (file: string): number => {
        if (file.endsWith('.cjs')) return 0;
        if (file.endsWith('.js')) return 1;
        if (file.endsWith('.ts')) return 2;
        return 3;
      };
      const selectedWitness = witnessCandidates.sort((a, b) => priority(a) - priority(b))[0];
      artifacts.witnessCode = await zip.files[selectedWitness].async('string');
    }

    // Extract ZK artifacts (prover/verifier keys and zkir files)
    // Structure: keys/circuit.prover, keys/circuit.verifier, zkir/circuit.bzkir
    const zkArtifacts: Record<string, ZkArtifact> = {};

    // Find all prover keys
    const proverFiles = files.filter(
      (f) => !f.endsWith('/') && f.endsWith('.prover') && !/\/_\./.test(f)
    );

    logger.info(SYSTEM_LOG_TAG, `Found ${proverFiles.length} .prover files in ZIP:`, proverFiles);

    for (const proverFile of proverFiles) {
      const match = proverFile.match(/([^/]+)\.prover$/);
      if (!match) continue;

      const circuitName = match[1];
      logger.debug(SYSTEM_LOG_TAG, `Processing circuit: ${circuitName} from ${proverFile}`);

      try {
        const proverBytes = await zip.files[proverFile].async('uint8array');

        // Find corresponding verifier file
        const verifierFile = files.find(
          (f) => f.endsWith(`${circuitName}.verifier`) && !/\/_\./.test(f)
        );

        if (!verifierFile) {
          logger.warn(SYSTEM_LOG_TAG, `No verifier found for prover: ${circuitName}`);
          continue;
        }

        const verifierBytes = await zip.files[verifierFile].async('uint8array');

        // Try to find zkir file (can be .bzkir or .zkir)
        const zkirFile = files.find(
          (f) =>
            (f.endsWith(`${circuitName}.bzkir`) || f.endsWith(`${circuitName}.zkir`)) &&
            !/\/_\./.test(f)
        );

        let zkirBytes: Uint8Array | undefined;
        if (zkirFile) {
          zkirBytes = await zip.files[zkirFile].async('uint8array');
          logger.debug(SYSTEM_LOG_TAG, `Found zkir for ${circuitName}: ${zkirBytes.length} bytes`);
        } else {
          logger.warn(SYSTEM_LOG_TAG, `No zkir file found for ${circuitName}`);
        }

        zkArtifacts[circuitName] = {
          prover: proverBytes,
          verifier: verifierBytes,
          zkir: zkirBytes,
        };

        logger.info(
          SYSTEM_LOG_TAG,
          `Extracted ZK artifacts for ${circuitName}: prover=${proverBytes.length}b verifier=${verifierBytes.length}b zkir=${zkirBytes?.length ?? 0}b`
        );
      } catch (err) {
        logger.warn(SYSTEM_LOG_TAG, `Failed to extract ZK artifacts for ${circuitName}:`, err);
      }
    }

    if (Object.keys(zkArtifacts).length > 0) {
      artifacts.zkArtifacts = zkArtifacts;
      logger.info(SYSTEM_LOG_TAG, `Extracted ${Object.keys(zkArtifacts).length} ZK artifact sets`);
    } else {
      logger.warn(
        SYSTEM_LOG_TAG,
        'No ZK artifacts extracted! This may prevent transaction execution.'
      );
    }

    // Legacy: Extract verifier keys as objects (kept for backward compatibility)
    const verifierFiles = files.filter(
      (f) => !f.endsWith('/') && f.endsWith('.verifier') && !/\/_\./.test(f)
    );

    for (const verifierFile of verifierFiles) {
      const match = verifierFile.match(/([^/]+)\.verifier$/);
      if (match) {
        const circuitName = match[1];
        try {
          const bytes = await zip.files[verifierFile].async('uint8array');
          // Try to parse as JSON first (some builds might be JSON)
          try {
            const text = new TextDecoder().decode(bytes);
            const parsed = JSON.parse(text);
            verifierKeys[circuitName] = parsed;
          } catch {
            // Not JSON, store as raw bytes
            verifierKeys[circuitName] = bytes;
          }
        } catch (err) {
          logger.warn(SYSTEM_LOG_TAG, `Failed to parse verifier key for ${circuitName}:`, err);
        }
      }
    }

    if (Object.keys(verifierKeys).length > 0) {
      artifacts.verifierKeys = verifierKeys;
    }

    // Validate that we have at least the required files
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

    logger.info(
      SYSTEM_LOG_TAG,
      `ZIP extracted. module:${!!artifacts.contractModule} d.ts:${!!artifacts.contractDefinition} witness:${!!artifacts.witnessCode} zkArtifacts:${Object.keys(artifacts.zkArtifacts || {}).length} legacyKeys:${Object.keys(verifierKeys).length}`
    );

    return artifacts;
  } catch (e) {
    logger.error(SYSTEM_LOG_TAG, 'Failed to extract ZIP file:', e);

    if (e instanceof Error) {
      // Re-throw with more context
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
