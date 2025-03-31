#!/usr/bin/env node

/**
 * Data-Slot Style Generator
 * This script automatically extracts Tailwind classes from UI components with data-slot attributes
 * and generates a CSS file with corresponding @apply directives.
 *
 * WHY THIS IS NECESSARY:
 * 1. Tailwind's JIT engine scans source files for class strings to generate CSS.
 * 2. Complex components using libraries like Radix UI often render parts of their UI
 *    (e.g., dropdowns, dialogs) in DOM Portals, separate from the main component tree.
 * 3. During development (`pnpm dev` with Vite HMR), Tailwind's JIT scanning can be unreliable
 *    in detecting utility classes used *only* within these portal-rendered components
 *    (like Radix Select, Popover, Dialog content).
 * 4. This can lead to missing base styles (backgrounds, padding, borders) for these
 *    components in the core app's dynamic preview, even if Tailwind is configured
 *    to scan the component library's source code.
 * 5. This script provides a workaround by explicitly finding base utility classes
 *    associated with `data-slot` attributes in the component source code (both core/ui
 *    and form-renderer/ui) and generating a static CSS file (`auto-generated-data-slots.css`)
 *    that uses `@apply` to force Tailwind to include these essential styles.
 * 6. This generated CSS is imported by `packages/styles/global.css` and ensures
 *    the base styles for slotted components are always available, bypassing potential
 *    JIT/portal detection issues in the dev environment.
 * 7. NOTE: This does NOT address utility classes used on elements *without* data-slots
 *    within the component library (e.g., layout classes on wrapper divs). Those are
 *    handled in the *exported* application context by configuring the exported app's
 *    Tailwind config to scan the library in node_modules.
 */

import generateDefault from '@babel/generator';
import * as parser from '@babel/parser';
import traverseDefault from '@babel/traverse';
import fastGlob from 'fast-glob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ES modules with CJS dependencies
const traverse = traverseDefault.default || traverseDefault;
const generate = generateDefault.default || generateDefault;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logging utility
function log(message) {
  console.log(`[Data-Slot Generator] ${message}`);
}

// Find all UI component files
async function findComponentFiles() {
  log('Scanning for UI components...');
  return fastGlob('packages/*/src/components/ui/**/*.tsx');
}

// Extract data slots and their Tailwind classes from component files
async function extractDataSlotsFromFiles(files) {
  const dataSlots = {};

  for (const file of files) {
    try {
      log(`Processing ${file}`);
      const content = fs.readFileSync(file, 'utf-8');
      const ast = parser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      // Traverse the AST to find JSX elements with data-slot attributes
      traverse(ast, {
        JSXOpeningElement(path) {
          const attributes = path.node.attributes;
          let dataSlot = null;
          let classNames = null;

          // Find data-slot attribute
          for (const attr of attributes) {
            if (attr.type === 'JSXAttribute' && attr.name.name === 'data-slot' && attr.value) {
              if (attr.value.type === 'StringLiteral') {
                dataSlot = attr.value.value;
              }
            }

            // Find className prop
            if (attr.type === 'JSXAttribute' && attr.name.name === 'className' && attr.value) {
              if (attr.value.type === 'StringLiteral') {
                classNames = attr.value.value;
              } else if (attr.value.type === 'JSXExpressionContainer' && attr.value.expression) {
                // Handle complex expressions (like cn() calls)
                if (attr.value.expression.type === 'CallExpression') {
                  // This is likely a cn() or clsx() call
                  if (
                    attr.value.expression.arguments &&
                    attr.value.expression.arguments.length > 0
                  ) {
                    const firstArg = attr.value.expression.arguments[0];

                    // Try to extract string literals from the first argument
                    if (firstArg.type === 'StringLiteral') {
                      classNames = firstArg.value;
                    } else if (
                      firstArg.type === 'TemplateLiteral' &&
                      firstArg.quasis &&
                      firstArg.quasis.length
                    ) {
                      classNames = firstArg.quasis.map((q) => q.value.raw).join('');
                    } else if (firstArg.type === 'ObjectExpression') {
                      // For cases like buttonVariants({ variant, size, className }), skip extraction
                      log(
                        `Found complex expression for className: ${generate(attr.value.expression).code}`
                      );
                    } else {
                      // For other valid expressions, try to generate code and log
                      log(
                        `Found complex expression for className: ${generate(attr.value.expression).code}`
                      );
                    }
                  }
                } else if (attr.value.expression.type === 'StringLiteral') {
                  classNames = attr.value.expression.value;
                } else if (
                  attr.value.expression.type === 'Identifier' &&
                  attr.value.expression.name === 'className'
                ) {
                  // Just a className prop being passed through
                  log(`Found complex expression for className: ${attr.value.expression.name}`);
                } else {
                  // Other expression types - try to generate code
                  log(
                    `Found complex expression for className: ${generate(attr.value.expression).code}`
                  );
                }
              }
            }
          }

          // If both data-slot and className are found, add to the dataSlots object
          if (dataSlot && classNames) {
            log(`Found data-slot='${dataSlot}' with classes: ${classNames}`);
            if (!dataSlots[dataSlot]) {
              dataSlots[dataSlot] = new Set();
            }
            classNames.split(' ').forEach((cls) => dataSlots[dataSlot].add(cls));
          }
        },
      });
    } catch (error) {
      log(`Error processing ${file}:`, error);
    }
  }

  return dataSlots;
}

// Generate CSS content from extracted data slots
function generateCssContent(dataSlots) {
  const lines = [
    '/* ',
    '  Auto-generated data-slot styles',
    '  This file is generated automatically. DO NOT EDIT DIRECTLY.',
    ' ',
    '  PURPOSE:',
    '  This file ensures that essential base styles for UI components (especially those',
    '  using Radix UI and rendering in Portals, like Select, Popover, Dialog) are',
    "  reliably included in the CSS bundle, particularly for the core app's dev environment.",
    "  Tailwind's JIT engine can sometimes fail to detect styles used exclusively within",
    '  portal-rendered content when scanning source code directly. Using `@apply` here',
    '  forces Tailwind to generate these styles.',
    ' ',
    '  See `packages/styles/scripts/generate-data-slots.js` for more details.',
    '*/',
    '',
  ];

  // Convert data slots to CSS rules
  for (const [slot, classes] of Object.entries(dataSlots)) {
    if (classes.size === 0) continue;

    lines.push(`[data-slot='${slot}'] {`);
    lines.push(`  @apply ${Array.from(classes).join(' ')};`);
    lines.push('}');
    lines.push('');
  }

  return lines.join('\n');
}

// Main function to generate data-slot styles
async function generateDataSlotStyles() {
  log('Starting generation of data-slot styles...');
  log('Scanning for UI components...');

  const files = await findComponentFiles();
  log(`Found ${files.length} component files`);

  const dataSlots = await extractDataSlotsFromFiles(files);
  const cssContent = generateCssContent(dataSlots);

  const outputPath = path.join(__dirname, '../utils/auto-generated-data-slots.css');
  fs.writeFileSync(outputPath, cssContent);

  log(`Generated data-slot styles successfully at ${outputPath}`);
}

// Run the generator
generateDataSlotStyles().catch((err) => {
  log(`Error: ${err.message}`);
  process.exit(1);
});
