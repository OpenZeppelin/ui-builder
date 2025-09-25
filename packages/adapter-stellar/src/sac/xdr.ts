import { xdr } from '@stellar/stellar-sdk';
import { parse, stringify } from 'lossless-json';

import stellarXdrJsonPackage from '@stellar/stellar-xdr-json/package.json' assert { type: 'json' };

import { logger } from '@openzeppelin/ui-builder-utils';

/**
 * CDN URL for the stellar-xdr-json WASM module.
 *
 * Why CDN instead of bundling?
 * 1. Vite bundling issues: The WASM file requires special handling in Vite. We tried multiple
 *    approaches including vite-plugin-wasm, vite-plugin-top-level-await, ?url imports, and
 *    various configurations, but consistently hit WebAssembly.instantiate errors where the
 *    browser received HTML instead of the WASM binary (magic word 00 61 73 6d expected,
 *    but got 3c 21 64 6f which is "<!do" in HTML).
 * 2. Bundle size: The WASM file is ~3MB, which would significantly increase bundle size
 *    for all users, even those who never use SAC contracts.
 * 3. Dynamic loading: With CDN + dynamic imports, the WASM only loads when actually needed
 *    (when a SAC contract is detected), keeping the initial bundle lean.
 * 4. Simplicity: After trying complex Vite configurations and WASM plugins without success,
 *    the CDN approach is simpler and more reliable.
 *
 * Trade-off: Requires internet connection for SAC contracts, but this is acceptable since
 * SAC specs are already fetched from GitHub anyway.
 */
type PackageJson = { version?: string };

const stellarXdrJsonVersion = (stellarXdrJsonPackage as PackageJson).version ?? '23.0.0';

const CDN_WASM_URL = `https://unpkg.com/@stellar/stellar-xdr-json@${stellarXdrJsonVersion}/stellar_xdr_json_bg.wasm`;

// Dynamically import the WASM module only when needed
let initialized = false;
let encode: ((type: string, value: string) => string) | null = null;

/**
 * Initializes the stellar-xdr-json WASM module for XDR encoding.
 *
 * This uses dynamic imports to only load the WASM when SAC contracts are actually used,
 * avoiding the 3MB overhead for users who don't need SAC support.
 *
 * The WASM is loaded from CDN to keep bundle size minimal.
 */
export async function ensureXdrJsonInitialized(): Promise<void> {
  if (initialized) return;

  try {
    // Dynamic import - only loads when SAC is actually used
    const stellarXdrJson = await import('@stellar/stellar-xdr-json');
    const init = stellarXdrJson.default;

    // Load WASM from CDN
    await init(CDN_WASM_URL);
    encode = stellarXdrJson.encode;
    initialized = true;
  } catch (error) {
    logger.error('stellar:sac:xdr', 'Failed to initialize WASM module:', error);
    throw error;
  }
}

/**
 * Converts the SAC JSON spec content into Base64 XDR entries for ScSpecEntry[]
 */
export async function encodeSacSpecEntries(jsonString: string): Promise<string[]> {
  await ensureXdrJsonInitialized();

  if (!encode) {
    throw new Error('WASM module not properly initialized');
  }

  try {
    const jsonData = parse(jsonString) as unknown[];
    const result: string[] = [];
    for (const entry of jsonData) {
      const stringified = stringify(entry);
      if (!stringified) {
        throw new Error('Failed to stringify SAC spec entry before XDR encoding.');
      }
      const encoded = encode('ScSpecEntry', stringified);
      result.push(encoded);
    }
    return result;
  } catch (error) {
    logger.error('stellar:sac:xdr', 'Failed to encode SAC spec to XDR', error);
    throw new Error('Failed to process SAC spec.');
  }
}

/** Utility to convert base64 strings to xdr.ScSpecEntry[] */
export function toScSpecEntries(base64Entries: string[]): xdr.ScSpecEntry[] {
  return base64Entries.map((b64) => xdr.ScSpecEntry.fromXDR(b64, 'base64'));
}

/**
 * Reset the initialization state (mainly for testing)
 */
export function resetXdrInitialization(): void {
  initialized = false;
  encode = null;
}
