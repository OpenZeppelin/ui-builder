---
name: commit
description: Creates commits following the monorepo's Conventional Commits standard with proper GPG signing, scope selection, and pre-commit validation. Reminds about changesets for package changes. Use when creating commits, writing commit messages, or when the user asks to commit changes.
---

# Commit Skill for UI Builder Monorepo

This skill guides committing changes following the project's Conventional Commits standard.

## Critical Requirements

1. **Always run commits outside sandbox** - Full shell permissions required for GPG signing and pre-commit hooks
2. **Never use `--no-gpg-sign`** - All commits must be GPG-signed
3. **Never use `--no-verify`** - Pre-commit hooks must run

## Commit Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Rules

| Rule               | Requirement                                                          |
| ------------------ | -------------------------------------------------------------------- |
| Header max length  | 100 characters                                                       |
| Subject case       | lowercase (never sentence-case, start-case, pascal-case, upper-case) |
| Subject ending     | No period                                                            |
| Scope              | **Required** (scope-empty is enforced)                               |
| Body line length   | Max 100 characters                                                   |
| Body leading blank | Required if body present                                             |

## Commit Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `style`    | Formatting, whitespace (no code change)                 |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or correcting tests                              |
| `build`    | Build system or external dependencies                   |
| `ci`       | CI configuration changes                                |
| `chore`    | Other changes (not src or test)                         |
| `revert`   | Reverts a previous commit                               |
| `wip`      | Work in progress (avoid if possible)                    |

## Allowed Scopes

The commitlint config enforces these scopes:

| Scope              | Description                      |
| ------------------ | -------------------------------- |
| `ui`               | UI components and styling        |
| `api`              | API-related code                 |
| `auth`             | Authentication and authorization |
| `builder`          | Builder app functionality        |
| `export`           | Export functionality             |
| `deps`             | Dependencies                     |
| `config`           | Configuration files              |
| `ci`               | CI/CD configuration              |
| `utils`            | Utility functions                |
| `docs`             | Documentation                    |
| `tests`            | Test-related changes             |
| `release`          | Release automation               |
| `adapter`          | Generic adapter changes          |
| `adapter-evm`      | EVM adapter                      |
| `adapter-evm-core` | EVM core package                 |
| `adapter-polkadot` | Polkadot adapter                 |
| `adapter-solana`   | Solana adapter                   |
| `adapter-stellar`  | Stellar adapter                  |
| `adapter-midnight` | Midnight adapter                 |
| `common`           | Common/shared code               |

### Extended Scopes (Update commitlint if needed)

These scopes are commonly used but may need to be added to `commitlint.config.js`:

- `spec` / `specs` - Specification documents
- `adapters` - Multiple adapters
- `changeset` - Changeset files
- `core` - Core functionality
- `form` - Form-related code

## Commit Workflow

```bash
# 1. Stage changes
git add <files>

# 2. Commit with HEREDOC (recommended for multi-line messages)
git commit -m "$(cat <<'EOF'
feat(builder): add new contract template selector

Implements a dropdown component for selecting contract templates
with search functionality and categorization support.
EOF
)"

# Or use interactive Commitizen
pnpm commit
```

## Changeset Reminder

**Before committing changes to `packages/` directory, check if a changeset is needed.**

A changeset is required when:

- Adding features to published packages
- Fixing bugs in published packages
- Making breaking changes

Check for existing changesets:

```bash
ls .changeset/*.md
```

If no changeset exists for your changes, create one:

```bash
pnpm changeset
```

Linked adapter packages (versioned together):

- `@openzeppelin/ui-builder-adapter-evm`
- `@openzeppelin/ui-builder-adapter-evm-core` (bundled, not published separately)
- `@openzeppelin/ui-builder-adapter-polkadot`
- `@openzeppelin/ui-builder-adapter-solana`
- `@openzeppelin/ui-builder-adapter-stellar`
- `@openzeppelin/ui-builder-adapter-midnight`

## Pre-commit Hooks

The following checks run automatically:

1. **File permission check**: Ensures correct file modes
2. **Formatting**: Runs Prettier via `pnpm fix-all`
3. **Linting**: Runs ESLint
4. **Re-staging**: Auto-stages formatting fixes

If pre-commit fails, fix the issues and commit again.

## Pre-push Hooks

Before pushing, these checks run:

1. **Linting**: Full lint pass
2. **Adapter compliance**: `pnpm lint:adapters`
3. **Export versions sync**: Updates `apps/builder/src/export/versions.ts` if needed

If versions.ts is updated, you must amend your commit:

```bash
git add apps/builder/src/export/versions.ts
git commit --amend --no-edit
```

## Breaking Changes

Indicate breaking changes with `!` after type/scope:

```bash
feat(api)!: change response format to JSON
```

Or with a footer:

```
feat(api): change response format

BREAKING CHANGE: Response format changed from XML to JSON.
All clients must update their parsers.
```

## Common Pitfalls

### Sandbox Mode Errors

**Symptom**: Commit fails with permission errors, GPG signing fails, or hooks don't run.

**Fix**: Run commit commands with full shell permissions (outside sandbox).

### Invalid Scope

**Symptom**: `scope-enum` error from commitlint.

**Fix**: Use one of the allowed scopes above, or update `commitlint.config.js` to add a new scope if justified.

### Subject Case Error

**Symptom**: `subject-case` error.

**Fix**: Use lowercase for the entire subject:

- Bad: `Add new feature`
- Good: `add new feature`

## Examples from Commit History

```bash
# Feature with scope
feat(adapter-polkadot): add network icons for Polkadot ecosystem

# Fix with scope
fix(builder): correct ecosystem order in feature flag tests

# Refactor with scope
refactor(adapter-evm): migrate to use adapter-evm-core

# Chore without specific scope (use broader category)
chore: update export versions for ui-types 1.4.0 and ui-utils 1.1.1

# Documentation
docs(specs): update spec 008 and 009 for wallet extraction

# Performance improvement
perf(builder): fix slow dev server startup (minutes to seconds)

# With PR reference
feat(adapter-evm-core): Extract reusable EVM core modules (#309)
```

## Quick Reference

```bash
# Stage and commit interactively
git add . && pnpm commit

# Check commit format is valid
echo "feat(builder): add feature" | npx commitlint

# View recent commit formats for reference
git log --oneline -10

# Amend last commit (only if not pushed!)
git commit --amend
```
