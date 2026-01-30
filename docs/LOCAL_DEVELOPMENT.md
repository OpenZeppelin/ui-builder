# Local Development with openzeppelin-ui

This guide explains how to develop with local versions of `@openzeppelin/ui-*` packages from the [openzeppelin-ui](https://github.com/OpenZeppelin/openzeppelin-ui) repository.

## Quick Start

```bash
# 1. Clone both repos as siblings
cd ~/dev
git clone git@github.com:OpenZeppelin/ui-builder.git
git clone git@github.com:OpenZeppelin/openzeppelin-ui.git

# 2. Install dependencies in openzeppelin-ui
cd openzeppelin-ui
pnpm install

# 3. Enable local packages in ui-builder (auto-builds openzeppelin-ui)
cd ../ui-builder
pnpm dev:local

# 4. Start development
pnpm dev
```

## How It Works

The local development setup uses pnpm's `.pnpmfile.cjs` hook to dynamically resolve `@openzeppelin/ui-*` packages to local file paths when `LOCAL_UI=true` is set.

### Directory Structure

```
~/dev/
├── ui-builder/    # UI Builder app
└── openzeppelin-ui/         # UI Kit packages (sibling directory)
    └── packages/
        ├── types/           # @openzeppelin/ui-types
        ├── utils/           # @openzeppelin/ui-utils
        ├── styles/          # @openzeppelin/ui-styles
        ├── components/      # @openzeppelin/ui-components
        ├── renderer/        # @openzeppelin/ui-renderer
        ├── react/           # @openzeppelin/ui-react
        └── storage/         # @openzeppelin/ui-storage
```

## Commands

### Switch to Local Packages

```bash
pnpm dev:local
```

This command automatically:

1. Builds all packages in the local openzeppelin-ui directory (defaults to `../openzeppelin-ui`)
2. Runs `LOCAL_UI=true pnpm install` to resolve all `@openzeppelin/ui-*` dependencies to local paths

This ensures you always have up-to-date compiled types when working with local packages.

### Custom Path

If your openzeppelin-ui checkout is in a different location, use the `LOCAL_UI_PATH` environment variable:

```bash
LOCAL_UI_PATH=/path/to/openzeppelin-ui pnpm dev:local
```

This will build and link packages from the specified directory.

### Switch Back to npm Packages

```bash
pnpm dev:npm
```

This runs a regular `pnpm install` which uses the published npm versions.

## Development Workflow

### Making Changes to UI Packages

1. Make changes in `openzeppelin-ui/packages/*`
2. Rebuild the changed package(s):
   - Quick rebuild: `cd ../openzeppelin-ui && pnpm build`
   - Or re-run: `pnpm dev:local` (rebuilds and reinstalls)
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

### Changes Not Reflected

After changing openzeppelin-ui code, rebuild and restart:

```bash
pnpm dev:local  # Rebuilds openzeppelin-ui automatically
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

```
🔨 Building local openzeppelin-ui packages...
...
[local-dev] @openzeppelin/ui-types → /path/to/openzeppelin-ui/packages/types
[local-dev] @openzeppelin/ui-utils → /path/to/openzeppelin-ui/packages/utils
...
✅ Using local @openzeppelin/ui-* packages from ../openzeppelin-ui
```

## Best Practices

1. **Keep Both Repos Updated**: Pull latest changes from both repos regularly
2. **Build Before Testing**: Always rebuild openzeppelin-ui after changes
3. **Use npm for CI**: Local mode is for development only; CI should use npm packages
4. **Commit Separately**: Changes to openzeppelin-ui should be committed/pushed separately
