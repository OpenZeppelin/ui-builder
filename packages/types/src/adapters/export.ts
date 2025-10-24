/**
 * Types for adapter-led export bootstrapping
 *
 * This module defines interfaces for adapters to provide additional files
 * and initialization code during the export process. This enables adapters
 * to bundle ecosystem-specific artifacts (e.g., Midnight contract artifacts)
 * into exported applications in a chain-agnostic manner.
 */

import type { ContractSchema } from '../contracts';
import type { NetworkConfig } from '../networks';

/**
 * Minimal subset of BuilderFormConfig needed for adapter export context.
 * Avoids circular dependencies by not importing the full builder types.
 */
export interface BuilderFormConfigLike {
  functionId: string;
  contractAddress: string;
  // Allow additional properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Context provided to adapters during export to enable artifact bundling.
 */
export interface AdapterExportContext {
  /** The form configuration from the builder */
  formConfig: BuilderFormConfigLike;

  /** The full contract schema */
  contractSchema: ContractSchema;

  /** The network configuration for the selected network */
  networkConfig: NetworkConfig;

  /**
   * Optional adapter-specific artifacts stored during contract loading.
   * For Midnight: privateStateId, contractModule, witnessCode, verifierKeys, etc.
   */
  artifacts?: Record<string, unknown> | null;

  /**
   * Original contract definition (e.g., TypeScript .d.ts for Midnight).
   * Stored separately from the parsed schema for export purposes.
   */
  definitionOriginal?: string | null;
}

/**
 * Result returned by adapters to bundle files and initialization code.
 */
export interface AdapterExportBootstrap {
  /**
   * Files to add to the exported project.
   * Key: relative path (e.g., 'src/midnight/artifacts.ts')
   * Value: file content as string
   */
  files: Record<string, string>;

  /**
   * Optional import statements to inject into main.tsx
   * Example: ["import { midnightArtifacts } from './midnight/artifacts';"]
   */
  imports?: string[];

  /**
   * Optional initialization code to run after adapter construction.
   * This code will be injected inside the resolveAdapter function,
   * right after the adapter instance is created.
   *
   * Example:
   * ```
   * if (typeof (adapter as any).loadContractWithMetadata === "function") {
   *   await (adapter as any).loadContractWithMetadata(midnightArtifacts);
   * }
   * ```
   */
  initAfterAdapterConstruct?: string;
}
