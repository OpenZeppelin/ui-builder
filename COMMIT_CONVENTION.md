# Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

## Examples

```
feat(ui): add button component
```

```
fix(api): handle error in transaction submission

This commit fixes an issue where the API would not properly handle errors during transaction submission.

Fixes #123
```

## Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit
- **wip**: Work in progress

## Scopes

- **ui**: UI components and styling
- **api**: API-related code
- **auth**: Authentication and authorization
- **builder**: Builder functionality
- **export**: Export functionality
- **deps**: Dependencies
- **config**: Configuration files
- **ci**: CI/CD configuration
- **utils**: Utility functions
- **docs**: Documentation
- **tests**: Test-related changes
- **release**: Release automation
- **adapter**: Generic adapter changes
- **adapter-evm**: EVM adapter functionality
- **adapter-evm-core**: EVM core package
- **adapter-polkadot**: Polkadot adapter functionality
- **adapter-solana**: Solana adapter functionality
- **adapter-stellar**: Stellar adapter functionality
- **adapter-midnight**: Midnight adapter functionality
- **common**: Common/shared code

## Breaking Changes

Breaking changes should be indicated by adding `!` after the type/scope:

```
feat(api)!: change API response format
```

Or by adding a `BREAKING CHANGE:` footer:

```
feat(api): change API response format

BREAKING CHANGE: The API response format has changed from XML to JSON.
```
