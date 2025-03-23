#!/usr/bin/env node

/**
 * Data-Slot Style Generator
 * This script automatically extracts Tailwind classes from UI components with data-slot attributes
 * and generates a CSS file with corresponding @apply directives.
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
    `  Generated on: ${new Date().toISOString()}`,
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
