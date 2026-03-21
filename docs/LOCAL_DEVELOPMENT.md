# Local Development with openzeppelin-ui and openzeppelin-adapters

This guide explains how to develop with local versions of `@openzeppelin/ui-*` packages from the [openzeppelin-ui](https://github.com/OpenZeppelin/openzeppelin-ui) repository.

## Quick Start

```bash
# 1. Clone all three repos as siblings
cd ~/dev
git clone git@github.com:OpenZeppelin/ui-builder.git
git clone git@github.com:OpenZeppelin/openzeppelin-ui.git
git clone git@github.com:OpenZeppelin/openzeppelin-adapters.git

# 2. Install dependencies in openzeppelin-ui
cd openzeppelin-ui
pnpm install

# 3. Install dependencies in openzeppelin-adapters
cd ../openzeppelin-adapters
pnpm install

# 4. Enable local packages in ui-builder (auto-builds both repos)
cd ../ui-builder
pnpm dev:local

# 5. Start development
pnpm dev
```

## How It Works

The local development setup uses pnpm's `.pnpmfile.cjs` hook to dynamically resolve local `@openzeppelin/ui-*` and `@openzeppelin/adapter-*` packages when `LOCAL_UI=true` and `LOCAL_ADAPTERS=true` are set.

### Directory Structure

```text
~/dev/
├── ui-builder/              # UI Builder app
├── openzeppelin-ui/         # UI Kit packages
│   └── packages/
│       ├── types/           # @openzeppelin/ui-types
│       ├── utils/           # @openzeppelin/ui-utils
│       ├── styles/          # @openzeppelin/ui-styles
│       ├── components/      # @openzeppelin/ui-components
│       ├── renderer/        # @openzeppelin/ui-renderer
│       ├── react/           # @openzeppelin/ui-react
│       └── storage/         # @openzeppelin/ui-storage
└── openzeppelin-adapters/   # Adapter packages
    └── packages/
        ├── adapter-evm/     # @openzeppelin/adapter-evm
        ├── adapter-midnight/# @openzeppelin/adapter-midnight
        ├── adapter-polkadot/# @openzeppelin/adapter-polkadot
        ├── adapter-solana/  # @openzeppelin/adapter-solana
        └── adapter-stellar/ # @openzeppelin/adapter-stellar
```

## Commands

### Switch to Local UI Kit + Adapters

```bash
pnpm dev:local
```

This command automatically:

1. Builds all packages in the local openzeppelin-ui directory (defaults to `../openzeppelin-ui`)
2. Builds adapter packages in the local openzeppelin-adapters directory (defaults to `../openzeppelin-adapters`)
3. Runs `LOCAL_UI=true LOCAL_ADAPTERS=true pnpm install` to resolve both dependency families to local paths

This ensures you always have up-to-date compiled types when working with local packages.

### Switch to Local UI Kit Only

```bash
pnpm dev:uikit:local
```

Use this when you only want local `@openzeppelin/ui-*` packages and want adapters to keep resolving from the workspace or npm.

### Custom Paths

If your checkouts live in different locations, use the environment variables directly:

```bash
LOCAL_UI_PATH=/path/to/openzeppelin-ui LOCAL_ADAPTERS_PATH=/path/to/openzeppelin-adapters pnpm dev:local
```

Or, for UI-kit-only overrides:

```bash
LOCAL_UI_PATH=/path/to/openzeppelin-ui pnpm dev:uikit:local
```

### Switch Back to npm Packages

```bash
pnpm dev:npm
```

This runs a regular `pnpm install` which uses the published npm/workspace versions.

## Development Workflow

### Making Changes to UI Packages

1. Make changes in `openzeppelin-ui/packages/*`
2. Rebuild the changed package(s):
   - Quick rebuild: `cd ../openzeppelin-ui && pnpm build`
   - Or re-run: `pnpm dev:uikit:local` for UI only, or `pnpm dev:local` for UI + adapters
3. Restart the ui-builder dev server if needed

### Hot Reload

For faster iteration, run the openzeppelin-ui build in watch mode:

```bash
# Terminal 1: Watch openzeppelin-ui
cd openzeppelin-ui
pnpm build --watch  # If supported, or rebuild manually

# Terminal 2: Run ui-builder
cd ui-builder
pnpm dev
```

## Exported Apps

When exporting forms with `env: 'local'`, the generated `package.json` uses `file:` protocol to point to the local openzeppelin-ui packages:

```json
{
  "dependencies": {
    "@openzeppelin/ui-renderer": "file:../openzeppelin-ui/packages/renderer",
    "@openzeppelin/ui-components": "file:../openzeppelin-ui/packages/components"
  }
}
```

This allows testing exported apps against local package changes before publishing.

### Environment Options for Exports

| Environment  | @openzeppelin/ui-\*                  | Legacy ui-builder-\* (adapters) |
| ------------ | ------------------------------------ | ------------------------------- |
| `local`      | `file:../openzeppelin-ui/packages/*` | `workspace:*`                   |
| `staging`    | Stable versions (`^x.y.z`)           | RC versions or `rc` dist-tag    |
| `production` | Stable versions (`^x.y.z`)           | Stable versions (`^x.y.z`)      |

## Adapters (openzeppelin-adapters)

Adapter packages are published from the [openzeppelin-adapters](https://github.com/OpenZeppelin/openzeppelin-adapters) repository. `apps/builder/src/export/versions.ts` is refreshed with:

```bash
pnpm update-export-versions
```

That script reads **stable** adapter versions from the public npm registry unless `LOCAL_ADAPTERS_PATH` points at a local checkout (same idea as `LOCAL_UI_PATH` for UI packages).

### Switch ui-builder to a local adapter checkout

```bash
pnpm dev:adapters:local
```

This command:

1. Builds adapter packages from `../openzeppelin-adapters` by default
2. Runs `LOCAL_ADAPTERS=true pnpm install` so `@openzeppelin/adapter-*` dependencies resolve to `file:` paths
3. Leaves the existing UI-kit local workflow (`pnpm dev:local`) unchanged

If your adapter checkout is elsewhere, use the canonical path variable:

```bash
LOCAL_ADAPTERS_PATH=/path/to/openzeppelin-adapters pnpm dev:adapters:local
```

`LOCAL_UI_BUILDER_PATH` is still accepted as a temporary compatibility alias, but new scripts and docs should use `LOCAL_ADAPTERS_PATH`.

To switch back to published/workspace resolution for both UI and adapters:

```bash
pnpm dev:npm
```

### Staging redeploy after an adapter RC

When you only need to validate a new adapter RC in staging (no Builder code change):

1. Confirm the RC is on npm: `npm view @openzeppelin/adapter-evm dist-tags.rc` (see openzeppelin-adapters `docs/RUNBOOK.md`).
2. In ui-builder, run `pnpm update-export-versions` if you need `versions.ts` to track a new stable line; staging exports still resolve adapters via the `rc` dist-tag when `versions.ts` holds plain semver.
3. Redeploy or rebuild the staging environment so the Builder image picks up the intended dependency lockfile or image tag.

### Defective adapter release

If a published adapter version must be pulled or replaced, follow **Defective Release Recovery** in `openzeppelin-adapters/docs/RUNBOOK.md` (`npm deprecate`, corrected publish, consumer communication). ui-builder does not publish adapters; it consumes them from npm.

### Rollout gate (consumer cutovers)

Do **not** merge package-name or lockfile cutover PRs in ui-builder, openzeppelin-ui, role-manager, or rwa-wizard until the initial `@openzeppelin/adapter-*` publish train is verified installable from the registry. See `openzeppelin-adapters/docs/RUNBOOK.md` § Rollout Gates and the notice step in `openzeppelin-adapters/.github/workflows/publish.yml`.

## Troubleshooting

### "Module not found" Errors

Re-run `pnpm dev:local` to rebuild and reinstall local packages:

```bash
pnpm dev:local
```

Or manually ensure openzeppelin-ui is built:

```bash
cd ../openzeppelin-ui
pnpm install
pnpm build
```

If the missing module comes from `@openzeppelin/adapter-*`, rebuild and relink the adapter checkout instead:

```bash
pnpm dev:adapters:local
```

When the configured adapter path is wrong, `.pnpmfile.cjs` now throws a direct error that includes the resolved path and the env vars to fix (`LOCAL_ADAPTERS_PATH` first, `LOCAL_UI_BUILDER_PATH` as a compatibility alias).

### Changes Not Reflected

After changing openzeppelin-ui or adapter code, rebuild and restart:

```bash
pnpm dev:local  # Rebuilds openzeppelin-ui and openzeppelin-adapters automatically
pnpm dev        # Restart dev server
```

### Switching Between Modes

If you experience issues after switching between local and npm modes:

```bash
# Clean and reinstall
pnpm clean
rm -rf node_modules
pnpm install  # or pnpm dev:local
```

### Verifying Local Mode is Active

When running `pnpm dev:local`, you should see:

```text
🔨 Building local openzeppelin-ui packages...
...
🔨 Building local openzeppelin-adapters packages...
...
[local-dev] @openzeppelin/ui-types → /path/to/openzeppelin-ui/packages/types
[local-dev] @openzeppelin/ui-utils → /path/to/openzeppelin-ui/packages/utils
[local-dev] @openzeppelin/adapter-evm → /path/to/openzeppelin-adapters/packages/adapter-evm
...
✅ Using local @openzeppelin/ui-* packages from ../openzeppelin-ui
✅ Using local @openzeppelin/adapter-* packages from ../openzeppelin-adapters
```

## Best Practices

1. **Keep All Repos Updated**: Pull latest changes from ui-builder, openzeppelin-ui, and openzeppelin-adapters regularly
2. **Build Before Testing**: Always rebuild local dependencies after changes
3. **Use npm for CI**: Local mode is for development only; CI should use npm packages
4. **Commit Separately**: Changes to openzeppelin-ui and openzeppelin-adapters should be committed/pushed separately
