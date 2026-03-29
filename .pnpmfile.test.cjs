const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const TEST_CACHE_DIR = '.packed-packages/local-dev-test';
const temporaryDirectories = [];

function createTemporaryDirectory(prefix) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

test.after(() => {
  for (const directory of temporaryDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function withEnv(overrides, fn) {
  const previous = new Map();

  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return fn();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function createUiRepo(name) {
  const repoRoot = createTemporaryDirectory(`${name}-`);
  const packageRoot = path.join(repoRoot, 'packages', 'components');
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.writeFileSync(
    path.join(packageRoot, 'package.json'),
    JSON.stringify({ name: '@openzeppelin/ui-components', version: '1.0.0' }, null, 2)
  );
  return repoRoot;
}

function createAdaptersRepo(name) {
  const repoRoot = createTemporaryDirectory(`${name}-`);
  const packageRoot = path.join(repoRoot, 'packages', 'adapter-evm');
  const vitePackageRoot = path.join(repoRoot, 'packages', 'adapters-vite');
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.mkdirSync(vitePackageRoot, { recursive: true });
  fs.writeFileSync(
    path.join(packageRoot, 'package.json'),
    JSON.stringify({ name: '@openzeppelin/adapter-evm', version: '1.0.0' }, null, 2)
  );
  fs.writeFileSync(
    path.join(vitePackageRoot, 'package.json'),
    JSON.stringify({ name: '@openzeppelin/adapters-vite', version: '1.0.0' }, null, 2)
  );
  return repoRoot;
}

function loadHook() {
  const hookPath = require.resolve('./.pnpmfile.cjs');
  delete require.cache[hookPath];
  return require(hookPath);
}

function createPackage() {
  return {
    dependencies: {
      '@openzeppelin/ui-components': '^1.0.0',
      '@openzeppelin/adapters-vite': '^1.0.0',
      '@openzeppelin/adapter-evm': '^1.0.0',
    },
  };
}

function getPackedManifestPath(familyKey) {
  return path.join(__dirname, TEST_CACHE_DIR, `${familyKey}.json`);
}

function withTestConfig(fn) {
  const configPath = path.join(__dirname, '.openzeppelin-dev.json');
  const previous = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(previous);

  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        ...parsed,
        cacheDir: TEST_CACHE_DIR,
      },
      null,
      2
    )
  );

  try {
    return fn();
  } finally {
    fs.writeFileSync(configPath, previous);
    fs.rmSync(path.join(__dirname, TEST_CACHE_DIR), { recursive: true, force: true });
  }
}

function withPackedManifest(familyKey, packages, fn) {
  const manifestPath = getPackedManifestPath(familyKey);
  const manifestDir = path.dirname(manifestPath);
  const hadManifest = fs.existsSync(manifestPath);
  const previous = hadManifest ? fs.readFileSync(manifestPath, 'utf8') : null;

  fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        repoRoot: '/tmp/local-dev-test',
        packages,
      },
      null,
      2
    )
  );

  try {
    return fn();
  } finally {
    if (hadManifest) {
      fs.writeFileSync(manifestPath, previous);
    } else if (fs.existsSync(manifestPath)) {
      fs.unlinkSync(manifestPath);
    }
  }
}

test('rewrites both UI and adapter dependencies during dev:local flows', () => {
  const uiRepo = createUiRepo('ui-builder-ui');
  const adaptersRepo = createAdaptersRepo('ui-builder-adapters');
  withTestConfig(() => {
    const { hooks } = loadHook();

    const updated = withEnv(
      {
        LOCAL_UI: 'true',
        LOCAL_ADAPTERS: 'true',
        LOCAL_UI_PATH: uiRepo,
        LOCAL_ADAPTERS_PATH: adaptersRepo,
      },
      () => hooks.readPackage(createPackage(), { dir: process.cwd(), log: () => {} })
    );

    assert.equal(
      updated.dependencies['@openzeppelin/ui-components'],
      `file:${fs.realpathSync(path.join(uiRepo, 'packages', 'components'))}`
    );
    assert.equal(
      updated.dependencies['@openzeppelin/adapter-evm'],
      `file:${fs.realpathSync(path.join(adaptersRepo, 'packages', 'adapter-evm'))}`
    );
    assert.equal(
      updated.dependencies['@openzeppelin/adapters-vite'],
      `file:${fs.realpathSync(path.join(adaptersRepo, 'packages', 'adapters-vite'))}`
    );
  });
});

test('supports adapter-only overrides with LOCAL_ADAPTERS_PATH', () => {
  const preferredRepo = createAdaptersRepo('ui-builder-adapters-preferred');
  withTestConfig(() => {
    const { hooks } = loadHook();

    const updated = withEnv(
      {
        LOCAL_UI: undefined,
        LOCAL_ADAPTERS: 'true',
        LOCAL_ADAPTERS_PATH: preferredRepo,
      },
      () => hooks.readPackage(createPackage(), { dir: process.cwd(), log: () => {} })
    );

    assert.equal(
      updated.dependencies['@openzeppelin/adapter-evm'],
      `file:${fs.realpathSync(path.join(preferredRepo, 'packages', 'adapter-evm'))}`
    );
    assert.equal(
      updated.dependencies['@openzeppelin/adapters-vite'],
      `file:${fs.realpathSync(path.join(preferredRepo, 'packages', 'adapters-vite'))}`
    );
  });
});

test('throws a clear error when the adapter checkout path is invalid', () => {
  const missingRepo = path.join(os.tmpdir(), 'missing-ui-builder-adapters');
  withTestConfig(() => {
    const { hooks } = loadHook();

    assert.throws(
      () =>
        withEnv(
          {
            LOCAL_ADAPTERS: 'true',
            LOCAL_ADAPTERS_PATH: missingRepo,
          },
          () => hooks.readPackage(createPackage(), { dir: process.cwd(), log: () => {} })
        ),
      (error) => {
        assert.match(error.message, /openzeppelin-adapters checkout not found/);
        assert.match(error.message, /LOCAL_ADAPTERS_PATH/);
        assert.match(error.message, new RegExp(missingRepo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        return true;
      }
    );
  });
});

test('prefers packed local tarballs when a manifest is present', () => {
  const adaptersRepo = createAdaptersRepo('ui-builder-adapters-packed');
  const tarballDir = createTemporaryDirectory('ui-builder-packed-');
  const tarballPath = path.join(tarballDir, 'openzeppelin-adapter-evm-1.0.0.tgz');
  fs.writeFileSync(tarballPath, 'stub tarball');
  withTestConfig(() => {
    const { hooks } = loadHook();

    const updated = withPackedManifest(
      'adapters',
      { '@openzeppelin/adapter-evm': tarballPath },
      () =>
        withEnv(
          {
            LOCAL_ADAPTERS: 'true',
            LOCAL_ADAPTERS_PATH: adaptersRepo,
          },
          () => hooks.readPackage(createPackage(), { dir: process.cwd(), log: () => {} })
        )
    );

    assert.equal(updated.dependencies['@openzeppelin/adapter-evm'], `file:${tarballPath}`);
    assert.equal(
      updated.dependencies['@openzeppelin/adapters-vite'],
      `file:${fs.realpathSync(path.join(adaptersRepo, 'packages', 'adapters-vite'))}`
    );
  });
});

test('throws a clear error when a configured package directory is missing package.json', () => {
  const adaptersRepo = createTemporaryDirectory('ui-builder-adapters-missing-package-json-');
  const vitePackageRoot = path.join(adaptersRepo, 'packages', 'adapters-vite');
  fs.mkdirSync(path.join(adaptersRepo, 'packages', 'adapter-evm'), { recursive: true });
  fs.mkdirSync(vitePackageRoot, { recursive: true });
  fs.writeFileSync(
    path.join(vitePackageRoot, 'package.json'),
    JSON.stringify({ name: '@openzeppelin/adapters-vite', version: '1.0.0' }, null, 2)
  );
  withTestConfig(() => {
    const { hooks } = loadHook();

    assert.throws(
      () =>
        withEnv(
          {
            LOCAL_ADAPTERS: 'true',
            LOCAL_ADAPTERS_PATH: adaptersRepo,
          },
          () => hooks.readPackage(createPackage(), { dir: process.cwd(), log: () => {} })
        ),
      (error) => {
        assert.match(error.message, /package\.json/);
        assert.match(error.message, /@openzeppelin\/adapter-evm/);
        return true;
      }
    );
  });
});

test('resolves default family paths from the workspace root instead of context.dir', () => {
  const containerRoot = createTemporaryDirectory('ui-builder-pnpmfile-fixture-');
  const workspaceRoot = path.join(containerRoot, 'consumer-app');
  const adaptersRepo = path.join(containerRoot, 'openzeppelin-adapters');
  const nestedContextDir = path.join(workspaceRoot, 'packages', 'consumer-app');
  fs.mkdirSync(workspaceRoot, { recursive: true });

  const packageRoot = path.join(adaptersRepo, 'packages', 'adapter-evm');
  const vitePackageRoot = path.join(adaptersRepo, 'packages', 'adapters-vite');
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.mkdirSync(vitePackageRoot, { recursive: true });
  fs.writeFileSync(
    path.join(packageRoot, 'package.json'),
    JSON.stringify({ name: '@openzeppelin/adapter-evm', version: '1.0.0' }, null, 2)
  );
  fs.writeFileSync(
    path.join(vitePackageRoot, 'package.json'),
    JSON.stringify({ name: '@openzeppelin/adapters-vite', version: '1.0.0' }, null, 2)
  );
  fs.mkdirSync(nestedContextDir, { recursive: true });

  fs.copyFileSync(path.join(__dirname, '.pnpmfile.cjs'), path.join(workspaceRoot, '.pnpmfile.cjs'));
  fs.writeFileSync(
    path.join(workspaceRoot, '.openzeppelin-dev.json'),
    JSON.stringify(
      {
        version: 1,
        families: {
          adapters: {},
        },
      },
      null,
      2
    )
  );

  const hookPath = path.join(workspaceRoot, '.pnpmfile.cjs');
  delete require.cache[hookPath];
  const { hooks } = require(hookPath);

  const pkg = withEnv(
    {
      LOCAL_ADAPTERS: 'true',
    },
    () =>
      hooks.readPackage(createPackage(), {
        dir: nestedContextDir,
        log: () => {},
      })
  );

  assert.equal(
    pkg.dependencies['@openzeppelin/adapter-evm'],
    `file:${fs.realpathSync(path.join(adaptersRepo, 'packages', 'adapter-evm'))}`
  );
  assert.equal(
    pkg.dependencies['@openzeppelin/adapters-vite'],
    `file:${fs.realpathSync(path.join(adaptersRepo, 'packages', 'adapters-vite'))}`
  );
});

test('rejects inherited family keys from malformed config payloads', () => {
  const workspaceRoot = createTemporaryDirectory('ui-builder-pnpmfile-prototype-');
  const pnpmfilePath = path.join(workspaceRoot, '.pnpmfile.cjs');
  const configPath = path.join(workspaceRoot, '.openzeppelin-dev.json');

  fs.copyFileSync(path.join(__dirname, '.pnpmfile.cjs'), pnpmfilePath);
  fs.writeFileSync(
    configPath,
    '{\n  "version": 1,\n  "families": {\n    "__proto__": {}\n  }\n}\n'
  );

  delete require.cache[pnpmfilePath];
  const { hooks } = require(pnpmfilePath);

  assert.throws(
    () =>
      withEnv(
        {
          LOCAL_ADAPTERS: 'true',
        },
        () => hooks.readPackage(createPackage(), { dir: workspaceRoot, log: () => {} })
      ),
    /Unsupported family "__proto__"/
  );
});

test('rejects cache directories that escape the workspace root', () => {
  const workspaceRoot = createTemporaryDirectory('ui-builder-pnpmfile-cache-escape-');
  const pnpmfilePath = path.join(workspaceRoot, '.pnpmfile.cjs');
  const configPath = path.join(workspaceRoot, '.openzeppelin-dev.json');

  fs.copyFileSync(path.join(__dirname, '.pnpmfile.cjs'), pnpmfilePath);
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        version: 1,
        cacheDir: '../outside-cache',
        families: {
          adapters: {},
        },
      },
      null,
      2
    )
  );

  delete require.cache[pnpmfilePath];
  const { hooks } = require(pnpmfilePath);

  assert.throws(
    () =>
      withEnv(
        {
          LOCAL_ADAPTERS: 'true',
        },
        () => hooks.readPackage(createPackage(), { dir: workspaceRoot, log: () => {} })
      ),
    /cacheDir".*subdirectory of the workspace root/i
  );
});

test('canonicalizes symlinked repository roots before rewriting file dependencies', () => {
  const containerRoot = createTemporaryDirectory('ui-builder-pnpmfile-symlink-');
  const actualRepo = createAdaptersRepo('ui-builder-adapters-realpath-target');
  const symlinkRepo = path.join(containerRoot, 'adapters-link');
  fs.symlinkSync(actualRepo, symlinkRepo);
  const logs = [];
  withTestConfig(() => {
    const { hooks } = loadHook();

    const pkg = withEnv(
      {
        LOCAL_ADAPTERS: 'true',
        LOCAL_ADAPTERS_PATH: symlinkRepo,
      },
      () =>
        hooks.readPackage(createPackage(), {
          dir: process.cwd(),
          log: (message) => logs.push(message),
        })
    );

    const canonicalPackageRoot = fs.realpathSync(path.join(actualRepo, 'packages', 'adapter-evm'));
    const canonicalVitePackageRoot = fs.realpathSync(
      path.join(actualRepo, 'packages', 'adapters-vite')
    );
    assert.equal(pkg.dependencies['@openzeppelin/adapter-evm'], `file:${canonicalPackageRoot}`);
    assert.equal(pkg.dependencies['@openzeppelin/adapters-vite'], `file:${canonicalVitePackageRoot}`);
    assert.ok(
      logs.some((message) =>
        new RegExp(canonicalPackageRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(message)
      )
    );
    assert.ok(
      logs.some((message) =>
        new RegExp(canonicalVitePackageRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(message)
      )
    );
  });
});
