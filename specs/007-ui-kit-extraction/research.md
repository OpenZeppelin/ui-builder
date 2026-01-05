# Research: UI Kit Monorepo Extraction

**Feature**: 007-ui-kit-extraction
**Date**: 2026-01-01

## Research Tasks

### 1. Changesets Configuration for Independent Versioning

**Decision**: Use unlinked changesets configuration (no `linked` array)

**Rationale**: The current UI Builder repo uses linked versioning where all packages bump together. For the new repo, independent versioning allows each package to release separately based on actual changes, reducing unnecessary version churn.

**Alternatives Considered**:

- Linked versioning (all packages same version) - Rejected: adds unnecessary coupling
- Fixed versioning (strict lockstep) - Rejected: too restrictive for independent packages

**Configuration**:

```json
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
```

---

### 2. SLSA Provenance Workflow

**Decision**: Reuse `slsa-framework/slsa-github-generator` workflow from UI Builder

**Rationale**: The existing UI Builder publish workflow already implements SLSA Level 3 provenance using the official slsa-framework generator. This is a well-tested, security-compliant approach.

**Alternatives Considered**:

- Custom provenance implementation - Rejected: unnecessary complexity, security risk
- Skip provenance - Rejected: violates constitution principle III and security requirements

**Implementation**: Copy and adapt `.github/workflows/publish.yml` from UI Builder, updating:

- Repository references (`OpenZeppelin/openzeppelin-ui`)
- Package names in provenance attestations
- Changeset config path

---

### 3. Build Tooling: tsdown Migration

**Decision**: Use tsdown instead of tsup for package bundling

**Rationale**: tsup has been deprecated in favor of [tsdown](https://tsdown.dev/guide/migrate-from-tsup), which is built on Rolldown for faster and more powerful bundling. The migration is straightforward and maintains compatibility with existing configuration patterns.

**Key Differences from tsup**:

- `format` defaults to `esm` (tsup defaulted to both)
- `clean` enabled by default
- `dts` auto-enabled if package.json has `types` field
- `target` reads from `engines.node` in package.json

**Migration Command**:

```bash
npx tsdown-migrate
```

**Configuration** (tsdown.config.ts):

```typescript
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom'],
});
```

**Alternatives Considered**:

- Keep tsup - Rejected: deprecated tooling increases maintenance burden
- Use Rolldown directly - Rejected: tsdown provides better DX for library bundling
- Use Vite library mode - Rejected: tsdown is purpose-built for TypeScript libraries

---

### 4. Package Naming and Directory Structure

**Decision**: Use simplified directory names matching npm package suffixes

**Rationale**: Directory names should match the npm package name suffix for clarity:

- `packages/types/` → `@openzeppelin/ui-types`
- `packages/components/` → `@openzeppelin/ui-components` (rename from `ui/`)
- `packages/react/` → `@openzeppelin/ui-react` (rename from `react-core/`)

**Alternatives Considered**:

- Keep original directory names (types, utils, ui, react-core) - Rejected: inconsistent with package names
- Use full package names as directories - Rejected: too verbose

**Mapping**:

| Current Directory | New Directory | Package Name                  |
| ----------------- | ------------- | ----------------------------- |
| `types/`          | `types/`      | `@openzeppelin/ui-types`      |
| `utils/`          | `utils/`      | `@openzeppelin/ui-utils`      |
| `styles/`         | `styles/`     | `@openzeppelin/ui-styles`     |
| `ui/`             | `components/` | `@openzeppelin/ui-components` |
| `renderer/`       | `renderer/`   | `@openzeppelin/ui-renderer`   |
| `react-core/`     | `react/`      | `@openzeppelin/ui-react`      |
| `storage/`        | `storage/`    | `@openzeppelin/ui-storage`    |

---

### 5. Internal Import Path Updates

**Decision**: Use automated find-and-replace with verification

**Rationale**: All internal imports must change from `@openzeppelin/ui-builder-*` to `@openzeppelin/ui-*`. This is a mechanical transformation best done with scripted find-and-replace followed by TypeScript compilation to verify correctness.

**Scope of Changes**:

- Package `dependencies` in `package.json` files
- Import statements in `.ts` and `.tsx` files
- Type references and re-exports in `index.ts` files
- Documentation and README files

**Verification**: After replacement, run `pnpm build` and `pnpm typecheck` to ensure no broken imports.

---

### 6. Export Pipeline Package Name Set

**Decision**: Create a centralized mapping constant for package names

**Rationale**: The `PackageManager.ts` uses a hardcoded `internalPackages` Set. Creating a centralized mapping makes updates easier and reduces risk of inconsistency.

**Current Code** (to be updated):

```typescript
const internalPackages = new Set([
  '@openzeppelin/ui-builder-renderer',
  '@openzeppelin/ui-builder-storage',
  '@openzeppelin/ui-builder-types',
  '@openzeppelin/ui-builder-utils',
  '@openzeppelin/ui-builder-ui',
  '@openzeppelin/ui-builder-react-core',
  ...Object.values(adapterPackageMap),
]);
```

**New Code**:

```typescript
const UI_PACKAGES = [
  '@openzeppelin/ui-renderer',
  '@openzeppelin/ui-storage',
  '@openzeppelin/ui-types',
  '@openzeppelin/ui-utils',
  '@openzeppelin/ui-components',
  '@openzeppelin/ui-react',
] as const;

const internalPackages = new Set([...UI_PACKAGES, ...Object.values(adapterPackageMap)]);
```

---

### 7. GitHub App and Secrets Configuration

**Decision**: Request new GitHub App token or share existing credentials

**Rationale**: The publish workflow requires:

- `GH_APP_ID` and `GH_APP_PRIVATE_KEY` for creating release PRs
- `NPM_TOKEN` for publishing to npm

**Options**:

1. Share existing GitHub App across both repos (simpler setup)
2. Create new GitHub App for openzeppelin-ui (better isolation)

**Recommendation**: Option 1 initially, migrate to Option 2 if needed for security isolation.

---

### 8. Version Strategy for First Release

**Decision**: Publish all packages at 1.0.0

**Rationale**: Per clarification, all packages start at 1.0.0 to signal a clean namespace break. This is semantically correct since the package names are new.

**Release Process**:

1. Create initial changesets for all packages with `major` bump type
2. Merge to main
3. CI creates release PR bumping to 1.0.0
4. Merge release PR to trigger publish

---

### 9. Example App Scope

**Decision**: Minimal React + Vite app demonstrating core component usage

**Rationale**: Per FR-021 and SC-006, the example must demonstrate at least 5 key components. A minimal app reduces maintenance burden while providing a working reference.

**Components to Demonstrate**:

1. Button (from ui-components)
2. Input (from ui-components)
3. Select (from ui-components)
4. Card (from ui-components)
5. FormRenderer (from ui-renderer)

**Stack**:

- Vite 5.x
- React 19
- TypeScript
- Tailwind CSS 4 (via ui-styles)

---

## Resolved Clarifications

All NEEDS CLARIFICATION items from Technical Context have been resolved:

| Item               | Resolution                  |
| ------------------ | --------------------------- |
| Initial version    | 1.0.0 for all packages      |
| Migration strategy | Sequential (new repo first) |
| Backward compat    | No wrapper packages         |
| Repo name          | `openzeppelin-ui`           |
| Rollback strategy  | npm deprecation + patch     |

---

## Dependencies Verified

| Dependency           | Status    | Notes                                               |
| -------------------- | --------- | --------------------------------------------------- |
| GitHub repo creation | Pending   | Requires admin access to OpenZeppelin org           |
| npm package names    | Pending   | Need to verify `@openzeppelin/ui-*` names available |
| CI secrets           | Pending   | Need GH_APP_ID, GH_APP_PRIVATE_KEY, NPM_TOKEN       |
| SLSA framework       | Available | v2.1.0 workflow confirmed working                   |
| Changesets           | Available | Current setup can be adapted                        |
