# Package Contracts: UI Kit Extraction

**Feature**: 007-ui-kit-extraction
**Date**: 2026-01-01

## Overview

This document defines the contracts (interfaces and structures) that packages in the new `openzeppelin-ui` monorepo must adhere to for consistency and interoperability.

---

## 1. Package.json Contract

Every package MUST have a `package.json` conforming to this structure:

```json
{
  "name": "@openzeppelin/ui-{name}",
  "version": "1.0.0",
  "private": false,
  "description": "{description}",
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "sideEffects": false,
  "files": ["dist", "README.md"],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsdown",
    "clean": "rm -rf dist tsconfig.tsbuildinfo",
    "prepublishOnly": "[ \"$SKIP_PUBLISH_BUILD\" = \"true\" ] || pnpm run build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint \"src/**/*.{ts,tsx}\" --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint \"src/**/*.{ts,tsx}\" --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""
  },
  "author": "OpenZeppelin",
  "license": "AGPL-3.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/OpenZeppelin/openzeppelin-ui",
    "directory": "packages/{name}"
  }
}
```

### Required Fields

| Field                  | Requirement                                     |
| ---------------------- | ----------------------------------------------- |
| `name`                 | Must match `@openzeppelin/ui-{name}` pattern    |
| `version`              | Semver, starting at `1.0.0`                     |
| `type`                 | Must be `"module"`                              |
| `main`                 | Must point to CJS build                         |
| `module`               | Must point to ESM build                         |
| `types`                | Must point to TypeScript declarations           |
| `exports`              | Must define `.` entry with types/import/require |
| `publishConfig.access` | Must be `"public"`                              |

---

## 2. tsdown.config.ts Contract

Every package MUST have a `tsdown.config.ts` with this structure:

```typescript
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    'react',
    'react-dom',
    // Add peer dependencies here
  ],
});
```

### Requirements

- Dual format output (ESM + CJS)
- TypeScript declarations generated (`dts: true` auto-enabled if package.json has `types` field)
- Source maps enabled
- Peer dependencies externalized

### Migration Note

tsdown is the successor to tsup, built on Rolldown for faster builds. Migration from tsup is straightforward:

```bash
npx tsdown-migrate
```

See [tsdown migration guide](https://tsdown.dev/guide/migrate-from-tsup) for details.

---

## 3. Internal Dependency Contract

Packages referencing other `@openzeppelin/ui-*` packages MUST use workspace protocol:

```json
{
  "dependencies": {
    "@openzeppelin/ui-types": "workspace:^",
    "@openzeppelin/ui-utils": "workspace:^"
  }
}
```

### Rules

- Use `workspace:^` for internal dependencies (not `workspace:*`)
- Changesets `updateInternalDependencies: "patch"` ensures version sync
- Published packages will have concrete version ranges

---

## 4. Export Index Contract

Every package MUST have `src/index.ts` as the public API entry point:

```typescript
/**
 * @openzeppelin/ui-{name}
 *
 * {Package description}
 */

// Re-export public types
export type { PublicType1, PublicType2 } from './types';

// Re-export public functions/classes
export { publicFunction, PublicClass } from './module';

// Re-export sub-modules if needed
export * from './submodule';
```

### Rules

- All public API exported from `src/index.ts`
- Internal utilities NOT exported (use `internal/` directory convention)
- JSDoc module-level comment required
- Type exports use `export type` syntax

---

## 5. Peer Dependency Contract

Packages with React components MUST declare peer dependencies:

```json
{
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

### React Packages

| Package         | Peer Dependencies                             |
| --------------- | --------------------------------------------- |
| `ui-components` | `react`, `react-dom`                          |
| `ui-renderer`   | `react`, `react-dom`, `react-hook-form`       |
| `ui-react`      | `react`, `react-dom`, `@tanstack/react-query` |
| `ui-storage`    | `react`                                       |

### Non-React Packages

| Package     | Peer Dependencies |
| ----------- | ----------------- |
| `ui-types`  | (none)            |
| `ui-utils`  | (none)            |
| `ui-styles` | (none, CSS only)  |

---

## 6. CI Workflow Contract

### ci.yml

Triggered on: `push` to `main`, `pull_request` to `main`

Jobs:

1. **build**: Install, build all packages, test ES module imports
2. **test**: Run `pnpm test`
3. **lint**: Run `pnpm lint` and `pnpm format:check`
4. **typecheck**: Run `pnpm typecheck`

### publish.yml

Triggered on: `push` to `main` (after CI passes)

Jobs:

1. **provenance**: Generate SLSA Level 3 provenance
2. **release**: Create release PR or publish to npm

Required Secrets:

- `GH_APP_ID`
- `GH_APP_PRIVATE_KEY`
- `NPM_TOKEN`

---

## 7. Changeset Contract

### Creating Changesets

```bash
pnpm changeset
```

Changeset file format:

```markdown
---
'@openzeppelin/ui-types': patch
'@openzeppelin/ui-utils': patch
---

Description of change
```

### Bump Types

| Type    | When to Use                       |
| ------- | --------------------------------- |
| `major` | Breaking API changes              |
| `minor` | New features, backward compatible |
| `patch` | Bug fixes, internal changes       |

---

## 8. README Contract

Every package MUST have a `README.md` with:

```markdown
# @openzeppelin/ui-{name}

{Brief description}

[![npm version](https://img.shields.io/npm/v/@openzeppelin/ui-{name}.svg)](https://www.npmjs.com/package/@openzeppelin/ui-{name})

## Installation

\`\`\`bash
pnpm add @openzeppelin/ui-{name}
\`\`\`

## Usage

\`\`\`typescript
import { ... } from '@openzeppelin/ui-{name}';
\`\`\`

## API Reference

{Link to documentation or inline docs}

## License

AGPL-3.0
```

---

## 9. Migration Contract

When updating UI Builder repo to consume new packages:

### Import Replacements

| Old Import                            | New Import                    |
| ------------------------------------- | ----------------------------- |
| `@openzeppelin/ui-builder-types`      | `@openzeppelin/ui-types`      |
| `@openzeppelin/ui-builder-utils`      | `@openzeppelin/ui-utils`      |
| `@openzeppelin/ui-builder-styles`     | `@openzeppelin/ui-styles`     |
| `@openzeppelin/ui-builder-ui`         | `@openzeppelin/ui-components` |
| `@openzeppelin/ui-builder-renderer`   | `@openzeppelin/ui-renderer`   |
| `@openzeppelin/ui-builder-react-core` | `@openzeppelin/ui-react`      |
| `@openzeppelin/ui-builder-storage`    | `@openzeppelin/ui-storage`    |

### Dependency Updates

```json
{
  "dependencies": {
    "@openzeppelin/ui-types": "^1.0.0",
    "@openzeppelin/ui-utils": "^1.0.0",
    "@openzeppelin/ui-components": "^1.0.0",
    "@openzeppelin/ui-renderer": "^1.0.0",
    "@openzeppelin/ui-react": "^1.0.0",
    "@openzeppelin/ui-storage": "^1.0.0",
    "@openzeppelin/ui-styles": "^1.0.0"
  }
}
```
