#!/usr/bin/env node
/**
 * Fails if a dependency family we removed for licensing reasons reappears in the
 * install tree.
 *
 * Two families were stripped, and both are easy to reintroduce by accident because
 * neither is a direct dependency -- they arrive transitively and a grep of source
 * code will not surface them:
 *
 * - `@trezor/*` is licensed under the Trezor Reference Source License, which grants
 *   "reference use" within one company and excludes redistribution. It arrives via
 *   `@creit.tech/stellar-wallets-kit`, which declares it as a hard dependency.
 * - `@reown/*` moved to the Reown Community License at 1.8.3: commercial fees above
 *   500 monthly active users, a clause requiring all use to connect to Reown's
 *   gateway, and a confidentiality clause. It arrives via
 *   `@walletconnect/ethereum-provider`, which `@wagmi/connectors` declares as a hard
 *   dependency. `@walletconnect/*` itself is Apache-2.0, but it is the only route
 *   Reown takes into the tree, so it is banned too.
 *
 * Both are removed by `readPackage` hooks in `.pnpmfile.cjs`. This guard checks the
 * outcome (nothing in the lockfile) *and* the mechanism (the hooks are still
 * wired), so deleting a hook fails loudly even if the committed lockfile happens to
 * be clean.
 *
 * Deliberately dependency-free and lockfile-only: it runs before `pnpm install` and
 * needs no network.
 */

const fs = require('node:fs');
const path = require('node:path');

const BANNED_SCOPES = [
  {
    scope: '@trezor/',
    licence: 'Trezor Reference Source License (no redistribution)',
    arrivesVia: '@creit.tech/stellar-wallets-kit',
  },
  {
    scope: '@reown/',
    licence: 'Reown Community License (fees above 500 MAU)',
    arrivesVia: '@walletconnect/ethereum-provider',
  },
  {
    scope: '@walletconnect/',
    licence: 'Apache-2.0 itself, but the only route @reown/* takes into the tree',
    arrivesVia: '@wagmi/connectors',
  },
];

const REQUIRED_HOOKS = ['stripTrezorDependencies', 'stripWalletConnectDependencies'];

const repoRoot = path.resolve(__dirname, '..');
const lockfilePath = path.join(repoRoot, 'pnpm-lock.yaml');
const pnpmfilePath = path.join(repoRoot, '.pnpmfile.cjs');

const problems = [];

// 1. The outcome: nothing from a banned family may appear in the lockfile.
if (!fs.existsSync(lockfilePath)) {
  problems.push(`Missing ${path.relative(repoRoot, lockfilePath)} -- cannot verify dependencies.`);
} else {
  const lines = fs.readFileSync(lockfilePath, 'utf8').split('\n');

  for (const { scope, licence, arrivesVia } of BANNED_SCOPES) {
    const hits = [];
    lines.forEach((line, index) => {
      if (line.includes(scope)) {
        hits.push({ line: index + 1, text: line.trim() });
      }
    });

    if (hits.length > 0) {
      problems.push(
        `${hits.length} lockfile reference(s) to ${scope}*\n` +
          `    licence: ${licence}\n` +
          `    usually arrives via: ${arrivesVia}\n` +
          hits
            .slice(0, 5)
            .map((hit) => `    pnpm-lock.yaml:${hit.line}: ${hit.text.slice(0, 100)}`)
            .join('\n') +
          (hits.length > 5 ? `\n    ... and ${hits.length - 5} more` : '')
      );
    }
  }
}

// 2. The mechanism: the strip hooks must still be wired into readPackage.
if (!fs.existsSync(pnpmfilePath)) {
  problems.push(`Missing ${path.relative(repoRoot, pnpmfilePath)} -- the strip hooks live there.`);
} else {
  const pnpmfile = fs.readFileSync(pnpmfilePath, 'utf8');
  for (const hook of REQUIRED_HOOKS) {
    // Defined and actually called, not just present as a dead function.
    // The call must be a statement, so anchor to line start -- otherwise the
    // function declaration itself satisfies the "is it called" test.
    const defined = pnpmfile.includes(`function ${hook}(`);
    const called = new RegExp(`^\\s+${hook}\\(pkg`, 'm').test(pnpmfile);
    if (!defined || !called) {
      problems.push(
        `.pnpmfile.cjs no longer ${defined ? 'calls' : 'defines'} ${hook}().\n` +
          '    Without it the banned packages return to the install tree on the next resolution.'
      );
    }
  }
}

if (problems.length > 0) {
  console.error('\n✖ Dependency licence check failed\n');
  for (const problem of problems) {
    console.error(`  - ${problem}\n`);
  }
  console.error(
    'These families were removed deliberately. If a change legitimately needs one of\n' +
      'them, that is a licensing decision -- raise it rather than relaxing this check.\n' +
      'To restore the intended state: keep the .pnpmfile.cjs hooks, delete\n' +
      'node_modules/.pnpm-workspace-state-v1.json, then re-run pnpm install.\n'
  );
  process.exit(1);
}

console.log('✓ Dependency licence check passed (no @trezor/*, @reown/* or @walletconnect/*)');
