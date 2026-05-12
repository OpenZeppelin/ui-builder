/**
 * Packages allowed to run install/build scripts under pnpm 11+ (dependency sandbox).
 * Keep in sync with `allowBuilds` keys in the repo root `pnpm-workspace.yaml`.
 *
 * Note: pnpm 11 ignores `package.json` → `pnpm.onlyBuiltDependencies` for standalone
 * projects; exports must ship a `pnpm-workspace.yaml` with `packages: ['.']` and this
 * `allowBuilds` map (see `renderExportedPnpmWorkspaceYaml`).
 */
export const PNPM_WORKSPACE_ALLOW_BUILD_PACKAGES: readonly string[] = [
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

function yamlAllowBuildKey(packageName: string): string {
  return packageName.includes('/') ? `'${packageName}'` : packageName;
}

/**
 * Minimal workspace so pnpm 11 applies `allowBuilds` (not supported via package.json alone).
 */
export function renderExportedPnpmWorkspaceYaml(): string {
  const lines = [
    '# pnpm 11+ — allow dependency install/postinstall scripts (mirrors ui-builder monorepo).',
    'packages:',
    "  - '.'",
    'allowBuilds:',
    ...[...PNPM_WORKSPACE_ALLOW_BUILD_PACKAGES]
      .sort()
      .map((p) => `  ${yamlAllowBuildKey(p)}: true`),
  ];
  return `${lines.join('\n')}\n`;
}
