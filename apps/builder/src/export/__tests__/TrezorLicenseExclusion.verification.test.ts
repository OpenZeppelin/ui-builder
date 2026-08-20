import { describe, expect, it } from 'vitest';

import { getNetworksByEcosystem } from '../../core/ecosystemManager';
import { AppExportSystem } from '../AppExportSystem';
import { createMinimalContractSchema, createMinimalFormConfig } from '../utils/testConfig';
import { extractFilesFromZip } from '../utils/zipInspector';

/**
 * @creit.tech/stellar-wallets-kit -- pulled in by @openzeppelin/adapter-stellar --
 * declares @trezor/connect-web and @trezor/connect-plugin-stellar as hard
 * dependencies. Both are licensed under the Trezor Reference Source License, which
 * excludes redistribution, so every exported app ships a .pnpmfile.cjs that strips
 * them at install time.
 *
 * Trezor is not a wallet option in a generated app either way: the kit's barrel does
 * not re-export modules/trezor.module, and allowAllModules() -- which the generated
 * wallet config uses -- returns only the eight non-Trezor modules.
 *
 * The hook is a template root file, so it ships for every ecosystem. This exercises
 * the EVM path because the Stellar export cannot run under vitest: @stellar/freighter-api
 * is CJS and breaks named-export interop in that environment.
 */
describe('exported app excludes the T-RSL Trezor stack', () => {
  it('ships a .pnpmfile.cjs stripping both Trezor packages from the wallets kit', async () => {
    const networks = await getNetworksByEcosystem('evm');
    const networkConfig = networks.find((n) => n.id === 'ethereum-mainnet') ?? networks[0];
    expect(networkConfig).toBeDefined();

    const exportSystem = new AppExportSystem();
    const formConfig = createMinimalFormConfig('transfer', 'evm');
    const contractSchema = createMinimalContractSchema('transfer', 'evm');

    const result = await exportSystem.exportApp(
      formConfig,
      contractSchema,
      networkConfig,
      'transfer',
      { projectName: 'trezor-exclusion-verify', env: 'production' }
    );

    const files = await extractFilesFromZip(result.data);

    const hook = files['.pnpmfile.cjs'];
    expect(hook).toBeDefined();
    expect(hook).toContain("const TREZOR_DEP_HOST = '@creit.tech/stellar-wallets-kit'");
    expect(hook).toContain('@trezor/connect-web');
    expect(hook).toContain('@trezor/connect-plugin-stellar');
    expect(hook).toContain('function readPackage(pkg, context)');
    expect(hook).toContain('stripTrezorDependencies(pkg, context)');

    // No Trezor package may ever be a declared dependency of an exported app.
    const packageJson = JSON.parse(files['package.json']);
    const allDeps = {
      ...((packageJson.dependencies ?? {}) as Record<string, string>),
      ...((packageJson.devDependencies ?? {}) as Record<string, string>),
    };
    expect(Object.keys(allDeps).filter((name) => name.startsWith('@trezor/'))).toEqual([]);
  });
});
