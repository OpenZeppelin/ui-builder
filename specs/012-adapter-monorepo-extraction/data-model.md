# Data Model: Adapter Monorepo Extraction

**Feature**: 012-adapter-monorepo-extraction  
**Date**: 2026-03-18

## Overview

This feature extracts adapter packages from `ui-builder` into a dedicated repository and preserves the multi-stage release flow used by Builder consumers. The model here represents packages, release channels, consumer repositories, and exported app version references rather than application database entities.

## Entities

### 1. Adapter Package

A package that encapsulates ecosystem-specific behavior and is maintained in the new adapter monorepo.

| Field          | Type     | Description                                             |
| -------------- | -------- | ------------------------------------------------------- |
| currentName    | string   | Existing package name in `ui-builder`                   |
| targetName     | string   | New package name in `@openzeppelin/adapter-*` namespace |
| directory      | path     | Package directory in the new adapter repo               |
| visibility     | enum     | `public` or `internal`                                  |
| version        | semver   | Coordinated linked package version for public adapters  |
| releaseChannel | enum     | `rc`, `latest`, or `internal-only`                      |
| entryPoints    | string[] | Supported root and subpath exports used by consumers    |
| consumers      | string[] | Repositories or apps that depend on the package         |

**Relationships**:

- Adapter Package -> belongs to -> Adapter Release Set
- Adapter Package -> consumed by -> Consumer Repository
- Adapter Package -> referenced by -> Export Version Reference

### 2. Internal Adapter Package

An adapter package that moves to the new repository but remains unpublished and bundled into public adapters.

| Field         | Type     | Description                                                    |
| ------------- | -------- | -------------------------------------------------------------- |
| targetName    | string   | Internal package name (for workspace identity)                 |
| publishable   | boolean  | Always `false` for the current design                          |
| bundledInto   | string[] | Public packages that embed the internal package                |
| workspaceOnly | boolean  | Indicates package is resolved only inside the adapter monorepo |

**Current Instance**:

- `@openzeppelin/adapter-evm-core`

### 3. Adapter Release Set

A coordinated Changesets release unit for the public adapters.

| Field           | Type     | Description                                             |
| --------------- | -------- | ------------------------------------------------------- |
| packageNames    | string[] | Public adapter packages included in the linked release  |
| version         | semver   | Shared linked version for the release set               |
| channels        | string[] | Publish channels used by consumers (`rc`, `latest`)     |
| releasePrBranch | string   | Release preparation branch managed by Changesets        |
| provenance      | boolean  | Indicates release provenance is generated and published |

**Rules**:

- Public adapters release as one linked version set.
- RC publication happens before stable publication.
- Stable publication happens only after release preparation completes.

### 4. Consumer Repository

A repository that installs or locally resolves adapter packages.

| Field                     | Type     | Description                                                                       |
| ------------------------- | -------- | --------------------------------------------------------------------------------- |
| name                      | string   | Repository name                                                                   |
| role                      | enum     | `publisher-consumer`, `runtime-consumer`, `example-consumer`, `manifest-consumer` |
| adapterDependencies       | string[] | Adapter packages referenced directly                                              |
| versionResolutionStrategy | enum     | `published-metadata`, `local-path-linking`                                        |
| deploymentOwnership       | enum     | `none`, `staging`, `production`, `both`                                           |
| localDevVariables         | string[] | Environment variables used to point at local adapter sources                      |

**Known Consumers**:

| Repository        | Role               | Deployment Ownership |
| ----------------- | ------------------ | -------------------- |
| `ui-builder`      | publisher-consumer | both                 |
| `role-manager`    | runtime-consumer   | none                 |
| `openzeppelin-ui` | example-consumer   | none                 |
| `rwa-wizard`      | manifest-consumer  | none                 |

### 5. Export Version Reference

A Builder-owned package version reference used when generating exported applications.

| Field            | Type   | Description                                    |
| ---------------- | ------ | ---------------------------------------------- |
| packageName      | string | Package represented in Builder export metadata |
| resolvedVersion  | string | Current resolved version string                |
| environment      | enum   | `local`, `staging`, `production`               |
| resolutionSource | enum   | `workspace`, `npm-rc`, `npm-stable`            |
| validationState  | enum   | `in-sync`, `out-of-sync`                       |

**Current Implementation Artifact**:

- `apps/builder/src/export/versions.ts`

### 6. Local Development Link

A consumer-side mapping that rewrites published adapter package dependencies to a local sibling checkout.

| Field             | Type                   | Description                                                  |
| ----------------- | ---------------------- | ------------------------------------------------------------ |
| consumerRepo      | string                 | Repository using the local development override              |
| packageMap        | Record<string, string> | Mapping from npm package names to local paths                |
| canonicalPathVar  | string                 | Canonical environment variable for adapter repo path         |
| compatibilityVars | string[]               | Legacy env vars kept temporarily for migration compatibility |

## Package Inventory

| Current Name                                | Target Name                      | Visibility | Notes                                  |
| ------------------------------------------- | -------------------------------- | ---------- | -------------------------------------- |
| `@openzeppelin/ui-builder-adapter-evm`      | `@openzeppelin/adapter-evm`      | public     | Primary EVM adapter                    |
| `@openzeppelin/ui-builder-adapter-evm-core` | `@openzeppelin/adapter-evm-core` | internal   | Bundled into EVM and Polkadot adapters |
| `@openzeppelin/ui-builder-adapter-midnight` | `@openzeppelin/adapter-midnight` | public     | Depends on patches/runtime support     |
| `@openzeppelin/ui-builder-adapter-polkadot` | `@openzeppelin/adapter-polkadot` | public     | Reuses EVM core internals              |
| `@openzeppelin/ui-builder-adapter-solana`   | `@openzeppelin/adapter-solana`   | public     | Early-stage but still migrated         |
| `@openzeppelin/ui-builder-adapter-stellar`  | `@openzeppelin/adapter-stellar`  | public     | Production adapter                     |

## Relationships

```text
Adapter Release Set
├── public Adapter Package(s)
│   ├── consumed by ui-builder
│   ├── consumed by role-manager
│   ├── consumed by openzeppelin-ui example app
│   └── optionally referenced by rwa-wizard
└── internal Adapter Package(s)
    └── bundled into public adapters

ui-builder
├── resolves published metadata per environment
├── maintains Export Version Reference(s)
└── deploys staging/production Builder app
```

## State Transitions

### Adapter Release Lifecycle

```text
[Changeset Pending]
      |
      v
[RC Published]
      |
      v
[Staging Validation Available]
      |
      v
[Release PR Prepared]
      |
      v
[Stable Published]
      |
      v
[Production Consumer Adoption]
```

### Consumer Resolution Lifecycle

```text
[Published Metadata Available]
      |
      v
[Consumer Workflow Resolves Version]
      |
      v
[versions.ts / equivalent metadata updated]
      |
      v
[Export or runtime dependency generated]
```

## Validation Rules

### Package Rules

- Public adapter packages use linked versioning.
- Internal adapter packages are not published and remain bundled into their consuming public adapters.
- Consumer-facing entry points already used by downstream repos must remain available after extraction.

### Release Rules

- RC releases publish to the `rc` channel before stable release.
- Stable release uses the stable channel (`latest`/stable semver set).
- Release provenance remains enabled for published packages.

### Consumer Rules

- Consumers resolve versions from published package metadata within their own workflows.
- `ui-builder` staging resolves adapter versions from the `rc` channel.
- `ui-builder` production resolves stable adapter versions.
- Exported applications must not retain legacy `ui-builder-adapter` names.

### Local Development Rules

- Consumers may override published adapter packages via `.pnpmfile.cjs` path rewriting.
- `LOCAL_ADAPTERS_PATH` is the canonical adapter repo path variable in the new model.
