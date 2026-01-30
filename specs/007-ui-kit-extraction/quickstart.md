# Quickstart: UI Kit Monorepo Extraction

**Feature**: 007-ui-kit-extraction
**Date**: 2026-01-01

## Prerequisites

- Node.js >= 20.19.0
- pnpm 10.x
- Access to OpenZeppelin GitHub organization
- npm publish permissions for `@openzeppelin` scope

## Phase 1: Create New Repository

### Step 1.1: Initialize Repository

```bash
# Create new repo on GitHub: OpenZeppelin/openzeppelin-ui
# Clone and initialize
git clone git@github.com:OpenZeppelin/openzeppelin-ui.git
cd openzeppelin-ui

# Initialize pnpm
pnpm init

# Create workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
  - 'examples/*'
  - '!**/node_modules/**'
EOF
```

### Step 1.2: Copy Configuration Files

From `ui-builder/`:

- `.prettierrc.cjs` → root
- `eslint.config.cjs` → root (update paths)
- `tsconfig.base.json` → root
- `commitlint.config.js` → root
- `.husky/` → root

### Step 1.3: Copy Packages

```bash
# From ui-builder root
DEST="../openzeppelin-ui"

# Copy each package (preserving git history optional)
cp -r packages/types $DEST/packages/types
cp -r packages/utils $DEST/packages/utils
cp -r packages/styles $DEST/packages/styles
cp -r packages/ui $DEST/packages/components  # Rename!
cp -r packages/renderer $DEST/packages/renderer
cp -r packages/react-core $DEST/packages/react  # Rename!
cp -r packages/storage $DEST/packages/storage
```

### Step 1.4: Update Package Names

For each package, update `package.json`:

```bash
# Example for types package
cd packages/types
# Change: "@openzeppelin/ui-builder-types" → "@openzeppelin/ui-types"
# Change: repository.url → "https://github.com/OpenZeppelin/openzeppelin-ui"
```

### Step 1.5: Update Internal Imports

```bash
# Find and replace all imports
find packages -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/@openzeppelin\/ui-builder-types/@openzeppelin\/ui-types/g' \
  -e 's/@openzeppelin\/ui-builder-utils/@openzeppelin\/ui-utils/g' \
  -e 's/@openzeppelin\/ui-builder-styles/@openzeppelin\/ui-styles/g' \
  -e 's/@openzeppelin\/ui-builder-ui/@openzeppelin\/ui-components/g' \
  -e 's/@openzeppelin\/ui-builder-renderer/@openzeppelin\/ui-renderer/g' \
  -e 's/@openzeppelin\/ui-builder-react-core/@openzeppelin\/ui-react/g' \
  -e 's/@openzeppelin\/ui-builder-storage/@openzeppelin\/ui-storage/g' \
  {} \;
```

### Step 1.6: Setup Changesets

```bash
pnpm add -Dw @changesets/cli @changesets/changelog-github

# Initialize changesets
pnpm changeset init

# Update config
cat > .changeset/config.json << 'EOF'
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "OpenZeppelin/openzeppelin-ui" }],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch"
}
EOF
```

### Step 1.7: Setup CI Workflows

Copy and adapt from `ui-builder/.github/`:

- `actions/prepare/action.yml`
- `workflows/ci.yml`
- `workflows/publish.yml`

Update references:

- Repository name
- Package names
- Secret names (if different)

### Step 1.8: Verify Build

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

## Phase 2: Publish Initial Release

### Step 2.1: Create Initial Changesets

```bash
# Create changeset for all packages
pnpm changeset

# Select all packages, choose "major" for 1.0.0
```

### Step 2.2: Version Packages

```bash
pnpm changeset version
# Verify all packages are at 1.0.0
```

### Step 2.3: Push and Release

```bash
git add -A
git commit -m "chore: initial release v1.0.0"
git push origin main

# CI will create release PR, merge it to publish
```

## Phase 3: Update UI Builder

### Step 3.1: Update Dependencies

In `ui-builder/`:

```bash
# Remove workspace packages from dependencies
# Add npm packages instead

# For builder package.json
pnpm remove @openzeppelin/ui-builder-types @openzeppelin/ui-builder-utils \
  @openzeppelin/ui-builder-ui @openzeppelin/ui-builder-renderer \
  @openzeppelin/ui-builder-react-core @openzeppelin/ui-builder-storage \
  @openzeppelin/ui-builder-styles

pnpm add @openzeppelin/ui-types @openzeppelin/ui-utils \
  @openzeppelin/ui-components @openzeppelin/ui-renderer \
  @openzeppelin/ui-react @openzeppelin/ui-storage \
  @openzeppelin/ui-styles
```

### Step 3.2: Update Imports

```bash
# Same find-replace as Step 1.5, applied to:
# - packages/builder/
# - packages/adapter-*/
```

### Step 3.3: Update Export Pipeline

In `packages/builder/src/export/PackageManager.ts`:

```typescript
// Update internalPackages set
const UI_PACKAGES = [
  '@openzeppelin/ui-renderer',
  '@openzeppelin/ui-storage',
  '@openzeppelin/ui-types',
  '@openzeppelin/ui-utils',
  '@openzeppelin/ui-components',
  '@openzeppelin/ui-react',
] as const;
```

In `packages/builder/src/export/versions.ts`:

- Update package names
- Set initial versions to `1.0.0`

### Step 3.4: Update Changesets Config

Remove migrated packages from `.changeset/config.json` linked array:

```json
{
  "linked": [
    [
      "@openzeppelin/ui-builder-adapter-evm",
      "@openzeppelin/ui-builder-adapter-midnight",
      "@openzeppelin/ui-builder-adapter-solana",
      "@openzeppelin/ui-builder-adapter-stellar"
    ]
  ]
}
```

### Step 3.5: Remove Migrated Packages

```bash
# Remove package directories
rm -rf packages/types packages/utils packages/styles packages/ui \
  packages/renderer packages/react-core packages/storage
```

### Step 3.6: Verify

```bash
pnpm install
pnpm build
pnpm test
pnpm test:export  # Critical: verify exported apps work
```

## Verification Checklist

- [ ] New repo builds without errors
- [ ] All tests pass in new repo
- [ ] Packages publish to npm successfully
- [ ] UI Builder builds with npm packages
- [ ] UI Builder tests pass
- [ ] Exported apps build and run correctly
- [ ] No `ui-builder` references in new packages
- [ ] Documentation updated

## Rollback Plan

If issues discovered after publish:

```bash
# Deprecate bad version
npm deprecate @openzeppelin/ui-types@1.0.0 "Issue found, use 1.0.1"

# Publish patch with fix
pnpm changeset  # patch bump
pnpm changeset version
git commit -m "fix: address issue"
git push  # triggers publish
```
