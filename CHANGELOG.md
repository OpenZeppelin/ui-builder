## [1.0.4](https://github.com/OpenZeppelin/transaction-form-builder/compare/v1.0.3...v1.0.4) (2025-03-12)


### Bug Fixes

* **ui:** tailwind integration ([13ef57d](https://github.com/OpenZeppelin/transaction-form-builder/commit/13ef57d1e1535ef4774bf7a3bf73412485f2f594))

## [1.0.3](https://github.com/OpenZeppelin/transaction-form-builder/compare/v1.0.2...v1.0.3) (2025-03-07)


### Bug Fixes

* update theme utility classes for Tailwind CSS v4 compatibility ([c5ef108](https://github.com/OpenZeppelin/transaction-form-builder/commit/c5ef108fbd81c146e14289fb2955fa8fc1cbf544))

## [1.0.2](https://github.com/OpenZeppelin/transaction-form-builder/compare/v1.0.1...v1.0.2) (2025-03-07)


### Bug Fixes

* update Tailwind CSS v4 configuration for ESM compatibility ([b5fd682](https://github.com/OpenZeppelin/transaction-form-builder/commit/b5fd6820098124cebb870d04d1270b8f1ecc2e91))

## [1.0.1](https://github.com/OpenZeppelin/transaction-form-builder/compare/v1.0.0...v1.0.1) (2025-03-07)


### Bug Fixes

* rename postcss.config.js to .cjs to fix ESM compatibility ([78dada4](https://github.com/OpenZeppelin/transaction-form-builder/commit/78dada4f1eb5c7d3afe6b4d24d5a08228142a313))

# 1.0.0 (2025-03-07)


### Bug Fixes

* **config:** migrate to ESLint 9.x CommonJS configuration ([b6ef58d](https://github.com/OpenZeppelin/transaction-form-builder/commit/b6ef58da42aa41f160361b052c12b8096d81db3a))
* **config:** remove ESM version of ESLint config ([05f9aad](https://github.com/OpenZeppelin/transaction-form-builder/commit/05f9aad2e811ce823710bd2e2e681f2e5afef16b))
* **config:** resolve ESLint TypeScript import issues ([118e91e](https://github.com/OpenZeppelin/transaction-form-builder/commit/118e91eaed5b4ea133e5ff00cca7809fbd7e2d55))


### Features

* **core:** initial commit ([30f1f8b](https://github.com/OpenZeppelin/transaction-form-builder/commit/30f1f8b983f4d5696742c7789f9cb7333a82b180))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-03-07

### Added

- Initial project setup with React 19, TypeScript, Vite, and Tailwind CSS
- Integrated shadcn/ui components (Button, Toast, etc.)
- Added ESLint and Prettier with strict configurations
- Set up import sorting with eslint-plugin-simple-import-sort
- Implemented Husky and lint-staged for pre-commit hooks
- Added commitlint with Conventional Commits support
- Configured Commitizen for interactive commit creation
- Created a custom Tailwind plugin for animations
- Added Storybook for component documentation
- Implemented Vitest for unit testing
- Added GitHub Actions workflows for CI, security, and dependency checks
- Set up semantic-release for automated versioning and releases
- Created comprehensive documentation (README, CONTRIBUTING, SECURITY)
- Added scripts for dependency management and updates
- Created custom utility scripts for checking deprecated dependencies

### Changed

- Updated all dependencies to their latest versions
- Modified Tailwind configuration to better match project structure
- Optimized VSCode settings for the project

### Security

- Implemented GitHub workflow for security scanning
- Added dependency review workflow for vulnerability detection
