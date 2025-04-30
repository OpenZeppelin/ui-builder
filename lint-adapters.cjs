/**
 * Script to run ESLint against adapter files to check for interface compliance
 */

const { ESLint } = require('eslint');
const path = require('path');
const fs = require('fs');

// Create an instance of ESLint with our custom config
const eslint = new ESLint();

// Function to find adapter implementation in the current package
function findAdapterFiles() {
  const adapterFiles = [];
  const srcDir = path.resolve(process.cwd(), 'src');

  // Skip if the src directory doesn't exist
  if (!fs.existsSync(srcDir)) {
    console.warn(`Warning: src directory not found: ${srcDir}`);
    return adapterFiles;
  }

  // Look for adapter.ts in the src directory
  const adapterFile = path.join(srcDir, 'adapter.ts');
  if (fs.existsSync(adapterFile)) {
    adapterFiles.push(adapterFile);
  }

  return adapterFiles;
}

// Function to run ESLint against adapter files
async function lintAdapters() {
  try {
    console.log('Linting adapter files for interface compliance...');

    // Get all adapter files
    const adapterFiles = findAdapterFiles();

    if (adapterFiles.length === 0) {
      console.error('No adapter files found. Check the src directory for adapter.ts file.');
      process.exit(1);
    }

    console.log(`Found ${adapterFiles.length} adapter implementations to check:`);
    adapterFiles.forEach((file) => console.log(`- ${path.relative(process.cwd(), file)}`));
    console.log();

    // Lint the files
    const results = await eslint.lintFiles(adapterFiles);

    // Filter for our custom rule
    const adapterRuleViolations = results
      .flatMap((result) => result.messages)
      .filter((message) => message.ruleId === 'custom/no-extra-adapter-methods');

    // Format and output results
    if (adapterRuleViolations.length > 0) {
      console.log('\n⚠️ Found adapter interface violations:');
      adapterRuleViolations.forEach((message) => {
        console.log(`- ${message.message} (${message.filePath}:${message.line}:${message.column})`);
      });
      console.log(
        '\nThese methods should be either removed or marked as private if they are helper methods.'
      );
      process.exit(1); // Exit with error code if violations are found
    } else {
      console.log('✅ All adapter implementations comply with the ContractAdapter interface!');
    }

    // Output full lint results
    const formatter = await eslint.loadFormatter('stylish');
    const formattedResults = await formatter.format(results);
    console.log('\nFull lint results:');
    console.log(formattedResults);

    // Exit with error if any lint issues were found
    const hasLintErrors = results.some((result) => result.errorCount > 0);
    process.exit(hasLintErrors ? 1 : 0);
  } catch (error) {
    console.error('Error linting adapter files:', error);
    process.exit(1);
  }
}

// Run the linting
lintAdapters();
