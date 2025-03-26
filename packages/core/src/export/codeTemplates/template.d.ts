/**
 * Type declarations for template files
 *
 * This file tells TypeScript to ignore our template syntax
 */

// Declare module for template files
declare module '*.template.tsx' {
  const content: string;
  export default content;
}

// Declare modules for template imports - use a more generic pattern
declare module '../adapters/**/adapter' {
  export class AdapterPlaceholder {
    signAndBroadcast(formData: Record<string, any>): Promise<any>;
  }
}

// We intentionally don't declare template variables here, as they're handled
// using @ts-expect-error comments in the template files themselves

// Augment TS to accept our template markers
declare namespace JSX {
  interface IntrinsicElements {
    // Allow template attributes
    [key: string]: any;
  }
}
