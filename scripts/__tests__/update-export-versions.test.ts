import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const core = require('../lib/update-export-versions-core.cjs') as {
  ADAPTER_PACKAGES: string[];
  resolveAdapterVersion: (
    packageName: string,
    options?: { localAdaptersPath?: string; execSyncImpl?: (cmd: string, opts: object) => string }
  ) => string | null;
  getNpmVersion: (
    packageName: string,
    execImpl?: (cmd: string, opts: object) => string
  ) => string | null;
  getAdapterVersionFromLocalPath: (packageName: string, localAdaptersRoot: string) => string | null;
};

describe('update-export-versions published adapter metadata', () => {
  it('lists only @openzeppelin/adapter-* public packages (no legacy ui-builder names)', () => {
    for (const name of core.ADAPTER_PACKAGES) {
      expect(name).toMatch(/^@openzeppelin\/adapter-/);
      expect(name).not.toContain('ui-builder');
    }
    expect(core.ADAPTER_PACKAGES).toContain('@openzeppelin/adapter-evm');
    expect(core.ADAPTER_PACKAGES).toHaveLength(5);
  });

  it('resolves adapter versions from npm when no local override path is provided', () => {
    const exec = vi.fn().mockReturnValue('1.4.2\n');
    const v = core.resolveAdapterVersion('@openzeppelin/adapter-evm', {
      localAdaptersPath: '',
      execSyncImpl: exec as (cmd: string, opts: object) => string,
    });
    expect(v).toBe('1.4.2');
    expect(exec).toHaveBeenCalledWith(
      'npm view @openzeppelin/adapter-evm version',
      expect.objectContaining({ encoding: 'utf8' })
    );
  });

  it('prefers LOCAL_ADAPTERS_PATH package.json over npm', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oz-adapters-'));
    try {
      const pkgDir = path.join(dir, 'packages', 'adapter-evm');
      fs.mkdirSync(pkgDir, { recursive: true });
      fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ version: '9.8.7' }));

      const exec = vi.fn();
      const v = core.resolveAdapterVersion('@openzeppelin/adapter-evm', {
        localAdaptersPath: dir,
        execSyncImpl: exec as (cmd: string, opts: object) => string,
      });

      expect(v).toBe('9.8.7');
      expect(exec).not.toHaveBeenCalled();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('falls back to npm when LOCAL_ADAPTERS_PATH is set but package.json is missing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oz-adapters-empty-'));
    try {
      const exec = vi.fn().mockReturnValue('3.0.0\n');
      const v = core.resolveAdapterVersion('@openzeppelin/adapter-stellar', {
        localAdaptersPath: dir,
        execSyncImpl: exec as (cmd: string, opts: object) => string,
      });
      expect(v).toBe('3.0.0');
      expect(exec).toHaveBeenCalled();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('getAdapterVersionFromLocalPath returns null for unknown package folder', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oz-adapters-partial-'));
    try {
      const v = core.getAdapterVersionFromLocalPath('@openzeppelin/adapter-evm', dir);
      expect(v).toBeNull();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
