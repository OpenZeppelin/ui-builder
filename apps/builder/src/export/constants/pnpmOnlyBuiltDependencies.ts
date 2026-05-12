/**
 * Packages allowed to run install/build scripts under pnpm 11+ (dependency sandbox).
 * Keep in sync with `allowBuilds` keys in the repo root `pnpm-workspace.yaml`.
 */
export const PNPM_ONLY_BUILT_DEPENDENCIES: readonly string[] = [
  '@openzeppelin/adapter-stellar',
  '@swc/core',
  'bigint-buffer',
  'blake-hash',
  'bufferutil',
  'classic-level',
  'esbuild',
  'keccak',
  'protobufjs',
  'secp256k1',
  'tiny-secp256k1',
  'unrs-resolver',
  'usb',
  'utf-8-validate',
];
