#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

console.log('=== PRETTIER DIFF DEBUG ===');

// Get the current content
const currentContent = fs.readFileSync('./global.css', 'utf8');

// Get what prettier wants with config
try {
  const formattedContent = execSync(
    './node_modules/.bin/prettier global.css --config ./.prettierrc.cjs 2>&1',
    { encoding: 'utf8' }
  );
  
  // Write both to temp files for diff
  fs.writeFileSync('./current.css', currentContent);
  fs.writeFileSync('./formatted.css', formattedContent);
  
  // Run diff
  console.log('\n=== DIFF (current vs prettier with config) ===');
  try {
    const diff = execSync('diff -u current.css formatted.css 2>&1', { encoding: 'utf8' });
    console.log(diff);
  } catch (e) {
    // diff returns exit code 1 when files differ
    if (e.stdout) {
      console.log(e.stdout.toString());
    }
  }
  
  // Also show specific differences
  console.log('\n=== Line by line comparison ===');
  const currentLines = currentContent.split('\n');
  const formattedLines = formattedContent.split('\n');
  
  let differences = 0;
  for (let i = 0; i < Math.max(currentLines.length, formattedLines.length); i++) {
    if (currentLines[i] !== formattedLines[i]) {
      differences++;
      console.log(`Line ${i + 1}:`);
      console.log(`  Current:   "${currentLines[i]}"`);
      console.log(`  Formatted: "${formattedLines[i]}"`);
      if (differences > 10) {
        console.log('... (showing first 10 differences)');
        break;
      }
    }
  }
  
  console.log(`\nTotal lines with differences: ${differences}`);
  
  // Check endings
  console.log('\n=== File endings ===');
  console.log('Current file ends with newline:', currentContent.endsWith('\n'));
  console.log('Formatted file ends with newline:', formattedContent.endsWith('\n'));
  console.log('Current file length:', currentContent.length);
  console.log('Formatted file length:', formattedContent.length);
  
  // Clean up
  fs.unlinkSync('./current.css');
  fs.unlinkSync('./formatted.css');
  
} catch (e) {
  console.log('Error running prettier:', e.message);
}
