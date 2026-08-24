import { describe, expect, it } from 'vitest';

import { getNetworksByEcosystem } from '../../core/ecosystemManager';
import { AppExportSystem } from '../AppExportSystem';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';

/**
 * `@metamask/sdk` is not open source: it ships a proprietary ConsenSys licence
 * granting only a licence for Non-Commercial Use, and requiring any derivative to
 * carry that same restriction forward. The OpenZeppelin adapters are AGPL-3.0,
 * which forbids conveying the work under added restrictions, so the two cannot both
 * be satisfied.
 *
 * `@wagmi/connectors` declares it as a hard dependency rather than an optional peer,
 * so it installs whether or not a `metaMask()` connector is registered. An exported
 * app therefore needs both halves:
 *
 *  - `.pnpmfile.cjs` to keep it out of the install tree, and
 *  - a `vite.config.ts` alias to a stub, because `@wagmi/connectors` re-exports an
 *    unreachable `metaMask` module containing `await import('@metamask/sdk')` and
 *    Rollup resolves dynamic imports at build time. Without the alias the generated
 *    app fails to build with "Rollup failed to resolve import".
 *
 * Exercises the EVM path: the Stellar export cannot run under vitest because
 * @stellar/freighter-api is CJS and breaks named-export interop there.
 */
describe('exported app excludes the proprietary MetaMask SDK', () => {
  it('strips it at install time and aliases the bundler to a stub', async () => {
    const networks = await getNetworksByEcosystem('evm');
    const networkConfig = networks.find((n) => n.id === 'ethereum-mainnet') ?? networks[0];
    expect(networkConfig).toBeDefined();

    const exportSystem = new AppExportSystem();
    const result = await exportSystem.exportApp(
      createMinimalFormConfig('transfer', 'evm'),
      createMinimalContractSchema('transfer', 'evm'),
      networkConfig,
      'transfer',
      { projectName: 'metamask-exclusion-verify', env: 'production' }
    );

    const files = await extractFilesFromZip(result.data);

    // 1. The install-tree half.
    const hook = files['.pnpmfile.cjs'];
    expect(hook).toBeDefined();
    expect(hook).toContain("'@wagmi/connectors': ['@metamask/sdk']");
    expect(hook).toContain('function stripMetaMaskDependencies(pkg, context)');
    expect(hook).toContain('stripMetaMaskDependencies(pkg, context)');

    // 2. The bundler half, or the generated app cannot build.
    expect(files['src/shims/metamask-removed.ts']).toBeDefined();
    expect(files['vite.config.ts']).toContain("'@metamask/sdk'");
    expect(files['vite.config.ts']).toContain('./src/shims/metamask-removed.ts');

    // 3. The SDK must never be a declared dependency of an exported app.
    const packageJson = JSON.parse(files['package.json']);
    const allDeps = Object.keys({
      ...((packageJson.dependencies ?? {}) as Record<string, string>),
      ...((packageJson.devDependencies ?? {}) as Record<string, string>),
    });

    expect(allDeps).not.toContain('@metamask/sdk');
    expect(allDeps).not.toContain('@metamask/sdk-communication-layer');
    expect(allDeps).not.toContain('@metamask/sdk-install-modal-web');
  });

  it('bans the three SDK names exactly, not the whole @metamask scope', async () => {
    // Most of @metamask/* is MIT or ISC and is legitimately required transitively
    // (utils, providers, json-rpc-engine, rpc-errors, superstruct, sdk-analytics).
    // A scope-wide strip would break far more than it fixes, so the hook must name
    // the SDK explicitly and must not reference the bare scope.
    const networks = await getNetworksByEcosystem('evm');
    const networkConfig = networks.find((n) => n.id === 'ethereum-mainnet') ?? networks[0];

    const exportSystem = new AppExportSystem();
    const result = await exportSystem.exportApp(
      createMinimalFormConfig('transfer', 'evm'),
      createMinimalContractSchema('transfer', 'evm'),
      networkConfig,
      'transfer',
      { projectName: 'metamask-scope-verify', env: 'production' }
    );

    const hook = (await extractFilesFromZip(result.data))['.pnpmfile.cjs'];

    // Assert the mechanism, not the prose: the strip list names the SDK exactly,
    // and nothing matches the scope by prefix. (The hook's comments legitimately
    // mention `@metamask/*` when explaining why the scope is not banned.)
    expect(hook).toContain("'@wagmi/connectors': ['@metamask/sdk']");
    expect(hook).not.toContain("startsWith('@metamask");
    expect(hook).not.toMatch(/METAMASK_STRIP\s*=\s*\{[^}]*@metamask\/(?!sdk')/);
  });
});
