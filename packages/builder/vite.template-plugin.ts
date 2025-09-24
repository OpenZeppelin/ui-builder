/**
 * Template Processing Plugin for Vite
 *
 * This plugin transforms .template.tsx files into JavaScript template functions
 * that can be imported and used with parameters.
 */

import { logger } from '@openzeppelin/ui-builder-utils';
/**
 * Create a template processing plugin
 */
export default function templatePlugin() {
  return {
    name: 'vite-template-plugin',
    transform(code: string, id: string) {
      // Only process files in the codeTemplates directory with .template.tsx extension
      if (id.includes('/codeTemplates/') && id.endsWith('.template.tsx')) {
        logger.info('vite-template-plugin', `Processing template file: ${id}`);

        // Handle template parameters with a simple pattern like ${{paramName}}
        const processedCode = code
          // Convert imports to template strings when needed
          .replace(/import\s+{\s*(\w+)\s*}\s+from\s+['"]([^'"]+)['"]/g, 'import { $1 } from "$2"')
          // Convert JSX expressions with ${{paramName}} to string template expressions
          .replace(/{\s*\$\{\{(\w+)\}\}\s*}/g, '${$1}');

        // Extract parameter names from the template
        const paramNames = extractParams(code);

        // Return a JavaScript module that exports a template function
        return {
          code: `
            /**
             * Template function generated from ${id.split('/').pop()}
             * 
             * @param params - Template parameters
             * @returns The generated code as a string
             */
            export default function template(params) {
              // Destructure parameters with type safety
              const { ${paramNames.join(', ')} } = params;
              
              // Return the processed template
              return \`${processedCode}\`;
            }
          `,
          map: null, // No source map for now
        };
      }
    },
  };
}

/**
 * Extract parameter names from template code
 *
 * @param code - The template code
 * @returns Array of unique parameter names
 */
function extractParams(code: string): string[] {
  // Find all occurrences of ${{paramName}}
  const paramMatches = code.match(/\$\{\{(\w+)\}\}/g) || [];

  // Extract the actual parameter names and remove duplicates
  return [
    ...new Set(
      paramMatches
        .map((match) => {
          const nameMatch = match.match(/\$\{\{(\w+)\}\}/);
          return nameMatch ? nameMatch[1] : '';
        })
        .filter(Boolean)
    ),
  ];
}
