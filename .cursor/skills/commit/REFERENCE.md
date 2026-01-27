# Commit Reference Documentation

Detailed reference for the commit skill with troubleshooting, configuration details, and advanced usage.

## Full commitlint Configuration

The project uses `@commitlint/config-conventional` with these customizations:

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 100],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        'wip',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'ui',
        'api',
        'auth',
        'builder',
        'export',
        'deps',
        'config',
        'ci',
        'utils',
        'docs',
        'tests',
        'release',
        'adapter',
        'adapter-evm',
        'adapter-evm-core',
        'adapter-polkadot',
        'adapter-solana',
        'adapter-stellar',
        'adapter-midnight',
        'common',
      ],
    ],
    'scope-empty': [2, 'never'],
  },
  ignores: [
    (message) =>
      message.includes('[skip ci]') ||
      /^chore\(release\):.+/.test(message) ||
      message === 'docs(tests): update coverage badges',
  ],
};
```

### Rule Severity Levels

- `0` = disabled
- `1` = warning
- `2` = error

## Husky Hooks Details

### commit-msg Hook

Location: `.husky/commit-msg`

Validates commit message format using commitlint. Skipped in CI environments.

### pre-commit Hook

Location: `.husky/pre-commit`

Actions:

1. Checks and fixes file permissions
2. Runs `pnpm fix-all` (prettier + eslint)
3. Re-stages modified files

### pre-push Hook

Location: `.husky/pre-push`

Actions:

1. Runs `pnpm fix-all`
2. Runs `pnpm lint:adapters`
3. Runs `pnpm run update-export-versions`
4. Fails if versions.ts was modified (needs re-commit)

## Adding New Scopes

When a new package or module is created, update `commitlint.config.js`:

```javascript
'scope-enum': [
  2,
  'always',
  [
    // ... existing scopes
    'new-scope-name',  // Add new scope here
  ],
],
```

Common scenarios requiring new scopes:

| New Package                | Suggested Scope   |
| -------------------------- | ----------------- |
| `packages/adapter-<chain>` | `adapter-<chain>` |
| `packages/<name>`          | `<name>`          |
| `apps/<name>`              | `<name>`          |
| New spec document          | `spec` or `specs` |

## Changeset Integration

### When to Add Changesets

Add a changeset when:

- Publishing new features to packages
- Fixing bugs in published packages
- Making breaking changes

### Creating Changesets

```bash
pnpm changeset
```

Select:

1. Which packages changed
2. Semver bump type (patch/minor/major)
3. Description of change

### Changeset File Format

```markdown
---
'@openzeppelin/ui-builder-adapter-evm': minor
'@openzeppelin/ui-builder-adapter-stellar': minor
---

Added new feature X across EVM and Stellar adapters
```

### Linked Packages

These packages are versioned together (from `.changeset/config.json`):

- `@openzeppelin/ui-builder-adapter-evm`
- `@openzeppelin/ui-builder-adapter-midnight`
- `@openzeppelin/ui-builder-adapter-polkadot`
- `@openzeppelin/ui-builder-adapter-solana`
- `@openzeppelin/ui-builder-adapter-stellar`

## Troubleshooting Decision Tree

```
Commit fails?
├── "scope-enum" error
│   └── Use allowed scope or update commitlint.config.js
├── "subject-case" error
│   └── Use lowercase: "add feature" not "Add feature"
├── "header-max-length" error
│   └── Shorten subject to under 100 chars
├── Hook permission denied / GPG signing failed
│   └── Running in sandbox mode - use full permissions
└── pre-push versions.ts modified
    └── git add apps/builder/src/export/versions.ts && git commit --amend
```

## Commit Message Templates

### Feature

```
feat(<scope>): add <feature description>

<Optional: More detailed explanation of what the feature does,
why it was added, and any important implementation details.>

<Optional: Related issues or context>
```

### Bug Fix

```
fix(<scope>): resolve <bug description>

<Optional: Explanation of what was wrong and how it was fixed>

Fixes #<issue-number>
```

### Breaking Change

```
feat(<scope>)!: change <breaking description>

<Explanation of what changed>

BREAKING CHANGE: <Description of breaking change and migration path>
```

### Refactor

```
refactor(<scope>): <what was refactored>

<Optional: Why the refactor was needed, what improved>
```

### Documentation

```
docs(<scope>): <what was documented>

<Optional: Additional context>
```

## CI Considerations

Commits in CI skip the commit-msg hook (checked via `$CI` env var). However:

- Merge commits still validate on PR
- Release commits use special format: `chore(release): version packages`
- Coverage badge updates use: `docs(tests): update coverage badges`
