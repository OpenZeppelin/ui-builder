import { logger } from '@openzeppelin/ui-builder-utils';

import type { MidnightContractArtifacts } from '../types';

const SYSTEM_LOG_TAG = 'IdentitySecretDerivation';

/**
 * Attempts to derive the identity secret key property name
 * from uploaded artifacts.
 *
 * Strategy:
 * 1) Prefer parsing the TypeScript definition for PrivateState in contractDefinition (.d.ts/.d.cts)
 *    - Find `export type <Name>PrivateState = { ... }`
 *    - Select a single field whose type is `Uint8Array` or `Uint8Array | null`
 * 2) Fallback: parse witnessCode for well-known witness functions and `privateState.<prop>` usage
 *    - Targets functions: local_sk, local_secret_key, organizer_key
 */
export function deriveIdentitySecretPropertyName(
  artifacts: MidnightContractArtifacts | null
): string | undefined {
  try {
    if (!artifacts) return undefined;

    // 1) Parse contractDefinition for PrivateState type
    const dts = artifacts.contractDefinition || '';
    if (dts) {
      // Capture blocks like `export type FooPrivateState = { ... };`
      const privateStateBlocks = Array.from(
        dts.matchAll(/export\s+type\s+\w+PrivateState\s*=\s*\{([\s\S]*?)\};?/g)
      );

      for (const match of privateStateBlocks) {
        const body = match[1] || '';
        // Extract readonly <name>: <type>;
        const fields = Array.from(body.matchAll(/readonly\s+(\w+)\s*:\s*([^;]+);/g)).map((m) => ({
          name: m[1],
          type: (m[2] || '').trim(),
        }));

        const candidates = fields.filter((f) => /^Uint8Array(\s*\|\s*null)?$/.test(f.type));

        if (candidates.length === 1) {
          const name = candidates[0].name;
          logger.debug(SYSTEM_LOG_TAG, 'Derived from .d.ts PrivateState field:', name);
          return name;
        }
      }
    }

    // 2) Fallback: Parse witnessCode and look for privateState.<prop> used in well-known witnesses
    const witnesses = artifacts.witnessCode || '';
    if (witnesses) {
      // Split into lines and look for lines that contain both:
      // - A well-known witness name (local_sk, local_secret_key, organizer_key)
      // - A reference to privateState.<prop>
      const lines = witnesses.split('\n');
      const propCounts: Record<string, number> = {};

      for (const line of lines) {
        // Check if this line contains a well-known witness identifier
        if (/(local_sk|local_secret_key|organizer_key)/.test(line)) {
          // Extract all privateState.<prop> references from this line
          const refs = Array.from(line.matchAll(/privateState\.(\w+)/g)).map((m) => m[1]);
          for (const prop of refs) {
            propCounts[prop] = (propCounts[prop] || 0) + 1;
          }
        }
      }

      const entries = Object.entries(propCounts).sort((a, b) => b[1] - a[1]);
      if (entries.length > 0) {
        logger.debug(SYSTEM_LOG_TAG, 'Derived from witnessCode usage:', entries[0][0]);
        return entries[0][0];
      }
    }
  } catch (err) {
    logger.debug(
      SYSTEM_LOG_TAG,
      'Identity secret property derivation failed:',
      err instanceof Error ? err.message : String(err)
    );
  }

  return undefined;
}
