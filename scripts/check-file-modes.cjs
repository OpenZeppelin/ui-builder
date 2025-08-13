#!/usr/bin/env node
/**
 * Guard against tracked executables and symlinks that break Changesets commitMode=github-api.
 * Allows executables only under `.husky/`. Fails on any other 100755 or any 120000 entries.
 */
const { execSync } = require('node:child_process');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function main() {
  const lsOutput = run('git ls-files -s');
  const lines = lsOutput.split(/\r?\n/);

  const execDisallowed = [];
  const symlinkDisallowed = [];

  for (const line of lines) {
    // Format: <mode> <object> <stage>\t<path>
    // But with -s it's: <mode> <object> <stage> <path>
    const parts = line.split(/\s+/);
    if (parts.length < 4) continue;
    const mode = parts[0];
    const path = parts.slice(3).join(' ');

    const isHusky = path.startsWith('.husky/');

    if (mode === '100755') {
      if (!isHusky) execDisallowed.push(path);
    } else if (mode === '120000') {
      symlinkDisallowed.push(path);
    }
  }

  if (execDisallowed.length === 0 && symlinkDisallowed.length === 0) {
    console.log('✅ File mode check passed: no disallowed executables or symlinks.');
    return;
  }

  if (execDisallowed.length > 0) {
    console.error('❌ Disallowed executable files (100755) detected:');
    for (const p of execDisallowed) console.error(` - ${p}`);
    console.error('\nFix with:');
    console.error('  git update-index --chmod=-x <file>');
  }

  if (symlinkDisallowed.length > 0) {
    console.error('❌ Disallowed symlinks (120000) detected:');
    for (const p of symlinkDisallowed) console.error(` - ${p}`);
    console.error('\nReplace symlinks with regular files or proxy modules.');
  }

  process.exit(1);
}

main();
