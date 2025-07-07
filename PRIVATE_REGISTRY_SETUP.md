# Private Registry Setup

> **⚠️ IMPORTANT**: This file should be **deleted** when transitioning to public release, as it contains internal setup information that is not relevant for public users.

## Current Configuration

This project uses **organization-level scoping** in `.npmrc` to route all `@openzeppelin` packages to the private GitHub registry. This approach was chosen to:

1. Keep the official `@openzeppelin` namespace for future public release
2. Solve the npm/pnpm limitation where registry scoping only works at the organization level, not per package
3. Ensure consistent package resolution during development and CI

## Registry Scoping Issue

The original problem was that we couldn't use per-package registry scoping like:

```
@openzeppelin/transaction-form-builder-core:registry=https://npm.pkg.github.com/
@openzeppelin/relayer-sdk:registry=https://registry.npmjs.org/
```

This would cause 404 errors because npm/pnpm only supports organization-level scoping:

```
@openzeppelin:registry=https://npm.pkg.github.com/
```

## Managing Public Dependencies

Since we use organization-level scoping, **ALL** `@openzeppelin` packages must be available in the private registry, including public dependencies like `@openzeppelin/relayer-sdk`.

### Publishing Public Dependencies to Private Registry

To add a public `@openzeppelin` package to the private registry:

```bash
# 1. Clone the public repository
git clone https://github.com/OpenZeppelin/openzeppelin-relayer-sdk.git
cd openzeppelin-relayer-sdk

# 2. Install and build
pnpm install
pnpm build

# 3. Configure npm for GitHub registry (if not already configured globally)
echo "@openzeppelin:registry=https://npm.pkg.github.com/" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc

# 4. Publish to private registry
npm publish --registry=https://npm.pkg.github.com/
```

### Automated Approach (Optional)

For frequently updated dependencies, you could create a workflow to automatically sync public packages to your private registry. However, for the current setup, manual publishing when needed is sufficient.

## Transition to Public Release

When ready to publish packages publicly:

### 1. Update `.npmrc`

Remove the private registry configuration:

```diff
- @openzeppelin:registry=https://npm.pkg.github.com/
```

### 2. Update Release Workflow

Modify `.github/workflows/release.yml` to publish to npm instead of GitHub registry.

### 3. Update Semantic Release Configuration

Ensure semantic-release is configured to publish to npm registry.

### 4. No Code Changes Required

All package names, imports, and dependencies remain the same.

## Benefits of This Approach

1. **Namespace Preservation**: Keeps official `@openzeppelin` namespace
2. **Smooth Transition**: Easy migration to public publishing
3. **Consistency**: All packages come from the same registry
4. **Future-Proof**: No breaking changes when going public

## Limitations

1. **Manual Dependency Management**: Public `@openzeppelin` packages must be manually published to private registry
2. **Registry Maintenance**: Need to keep private registry in sync with required public packages
3. **Team Coordination**: All team members need access to the private registry

## Alternative Considered

We considered using a different namespace (like `@oz-transaction-form`) but decided against it since these packages will eventually be published under the official `@openzeppelin` namespace.
