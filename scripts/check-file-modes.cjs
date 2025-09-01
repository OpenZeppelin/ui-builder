#!/usr/bin/env node
/**
 * Guard against tracked executables and symlinks that break Changesets commitMode=github-api.
 * Allows executables only under `.husky/`. Auto-fixes disallowed executables, reports symlinks.
 */
const { execSync } = require('node:child_process');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function main() {
  const autoFix = process.argv.includes('--fix') || process.env.AUTOFIX_FILE_MODES === 'true';
  
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

  // Auto-fix executable permissions if requested
  let fixedFiles = [];
  if (autoFix && execDisallowed.length > 0) {
    console.log('🔧 Auto-fixing file permissions...');
    for (const path of execDisallowed) {
      try {
        run(`git update-index --chmod=-x "${path}"`);
        fixedFiles.push(path);
        console.log(`  ✅ Fixed: ${path}`);
      } catch (error) {
        console.error(`  ❌ Failed to fix: ${path} - ${error.message}`);
      }
    }
  }

  // Check final state
  const remainingExecDisallowed = execDisallowed.filter(path => !fixedFiles.includes(path));

  if (remainingExecDisallowed.length === 0 && symlinkDisallowed.length === 0) {
    if (fixedFiles.length > 0) {
      console.log(`✅ File mode check passed after auto-fixing ${fixedFiles.length} file(s).`);
    } else {
      console.log('✅ File mode check passed: no disallowed executables or symlinks.');
    }
    return;
  }

  // Report remaining issues
  if (remainingExecDisallowed.length > 0) {
    console.error('❌ Disallowed executable files (100755) detected:');
    for (const p of remainingExecDisallowed) console.error(` - ${p}`);
    if (!autoFix) {
      console.error('\nFix with:');
      console.error('  git update-index --chmod=-x <file>');
      console.error('Or run with --fix flag to auto-fix: npm run check-file-modes -- --fix');
    }
  }

  if (symlinkDisallowed.length > 0) {
    console.error('❌ Disallowed symlinks (120000) detected:');
    for (const p of symlinkDisallowed) console.error(` - ${p}`);
    console.error('\nReplace symlinks with regular files or proxy modules.');
  }

  process.exit(1);
}

main();
