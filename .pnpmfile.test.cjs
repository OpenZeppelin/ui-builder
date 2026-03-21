const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

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

function createRepo(name, packageDirs) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));

  for (const packageDir of packageDirs) {
    fs.mkdirSync(path.join(repoRoot, packageDir), { recursive: true });
  }

  return repoRoot;
}

function loadHook() {
  const hookPath = require.resolve('./.pnpmfile.cjs');
  delete require.cache[hookPath];
  return require(hookPath);
}

test('rewrites adapter dependencies when LOCAL_ADAPTERS is enabled', () => {
  const adaptersRepo = createRepo('ui-builder-adapters', ['packages/adapter-evm']);
  const { hooks } = loadHook();
  const pkg = {
    dependencies: {
      '@openzeppelin/adapter-evm': 'workspace:*',
    },
  };

  const updated = withEnv(
    {
      LOCAL_ADAPTERS: 'true',
      LOCAL_ADAPTERS_PATH: adaptersRepo,
    },
    () => hooks.readPackage(pkg, { dir: process.cwd(), log: () => {} })
  );

  assert.equal(
    updated.dependencies['@openzeppelin/adapter-evm'],
    `file:${path.join(adaptersRepo, 'packages', 'adapter-evm')}`
  );
});

test('keeps adapter dependencies untouched when only LOCAL_UI is enabled', () => {
  const uiRepo = createRepo('ui-builder-ui', ['packages/components']);
  const { hooks } = loadHook();
  const pkg = {
    dependencies: {
      '@openzeppelin/ui-components': '^1.0.0',
      '@openzeppelin/adapter-evm': 'workspace:*',
    },
  };

  const updated = withEnv(
    {
      LOCAL_UI: 'true',
      LOCAL_UI_PATH: uiRepo,
      LOCAL_ADAPTERS: undefined,
      LOCAL_ADAPTERS_PATH: undefined,
    },
    () => hooks.readPackage(pkg, { dir: process.cwd(), log: () => {} })
  );

  assert.equal(
    updated.dependencies['@openzeppelin/ui-components'],
    `file:${path.join(uiRepo, 'packages', 'components')}`
  );
  assert.equal(updated.dependencies['@openzeppelin/adapter-evm'], 'workspace:*');
});

test('accepts LOCAL_UI_BUILDER_PATH as a compatibility alias for adapters', () => {
  const adaptersRepo = createRepo('ui-builder-adapters-alias', ['packages/adapter-evm']);
  const { hooks } = loadHook();
  const pkg = {
    dependencies: {
      '@openzeppelin/adapter-evm': 'workspace:*',
    },
  };

  const updated = withEnv(
    {
      LOCAL_ADAPTERS: 'true',
      LOCAL_ADAPTERS_PATH: undefined,
      LOCAL_UI_BUILDER_PATH: adaptersRepo,
    },
    () => hooks.readPackage(pkg, { dir: process.cwd(), log: () => {} })
  );

  assert.equal(
    updated.dependencies['@openzeppelin/adapter-evm'],
    `file:${path.join(adaptersRepo, 'packages', 'adapter-evm')}`
  );
});

test('throws a clear error when the adapter checkout path is invalid', () => {
  const missingRepo = path.join(os.tmpdir(), 'missing-ui-builder-adapters');
  const { hooks } = loadHook();
  const pkg = {
    dependencies: {
      '@openzeppelin/adapter-evm': 'workspace:*',
    },
  };

  assert.throws(
    () =>
      withEnv(
        {
          LOCAL_ADAPTERS: 'true',
          LOCAL_ADAPTERS_PATH: missingRepo,
          LOCAL_UI_BUILDER_PATH: undefined,
        },
        () => hooks.readPackage(pkg, { dir: process.cwd(), log: () => {} })
      ),
    (error) => {
      assert.match(error.message, /openzeppelin-adapters checkout not found/);
      assert.match(error.message, /LOCAL_ADAPTERS_PATH/);
      return true;
    }
  );
});
