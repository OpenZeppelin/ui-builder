# CI/CD & environments

This document describes how **UI Builder** is built and deployed. The repository contains the Builder **application** only; npm libraries (`@openzeppelin/ui-*`, `@openzeppelin/adapter-*`, etc.) are released from other repositories.

## Table of contents

- [Overview](#overview)
- [Workflows](#workflows)
- [Staging vs production](#staging-vs-production)
- [Export / `versions.ts`](#export--versionsts)
- [Troubleshooting](#troubleshooting)
- [Additional resources](#additional-resources)

---

## Overview

- **Local**: develop against the app; optional local path overrides for UI/adapters (see root README).
- **Staging**: Docker image built on push to `main`; ECS deploy. The image resolves adapter packages from npm using the **`rc`** dist-tag (adapters are published from [openzeppelin-adapters](https://github.com/OpenZeppelin/openzeppelin-adapters)).
- **Production**: Docker image built when a **GitHub Release** is published; stable adapter versions from npm.

---

## Workflows

| Workflow              | File                 | Trigger                                |
| --------------------- | -------------------- | -------------------------------------- |
| Staging deploy        | `docker-stg.yaml`    | Push to `main`, or `workflow_dispatch` |
| Production deploy     | `docker-prod.yaml`   | GitHub Release published               |
| CI                    | `ci.yml`             | Push / PR to `main`                    |
| Check export versions | `check-versions.yml` | PRs to `main`, `develop`, `release/**` |

---

## Staging vs production

- Staging builds pass **`ADAPTER_DIST_TAG=rc`** so the Docker build can prefer adapter prereleases for QA.
- Production builds use stable semver ranges as defined in the app and lockfile.

---

## Export / `versions.ts`

Exported apps embed resolved dependency versions in `apps/builder/src/export/versions.ts`. PRs should keep that file in sync with published npm metadata. The **Check Version Sync** workflow runs `pnpm update-export-versions` and fails if `versions.ts` drifts.

---

## Troubleshooting

### Docker build fails

- Confirm `VITE_EXPORT_ENV` matches the target (`staging` vs `production`).
- Ensure registry secrets used in the workflow are present.

### `versions.ts` out of sync

- Run `pnpm update-export-versions` with registry access and commit the result.

### AWS / ECS deploy fails

- Verify OIDC role ARNs and ECS cluster/service names in the workflow env.

```bash
# Inspect pinned export versions
cat apps/builder/src/export/versions.ts

# Local export smoke test
pnpm export-app export --env local
```

---

## Additional resources

- [AWS OIDC with GitHub Actions](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [Docker multi-stage builds](https://docs.docker.com/develop/dev-best-practices/multi-stage-builds/)
