/// <reference types="vite/client" />

/**
 * Type definitions for Vite's import.meta features
 */
interface ImportMeta {
  glob<T = unknown>(globPattern: string): Record<string, () => Promise<T>>;
  glob<T = unknown>(globPattern: string, options: { eager: true }): Record<string, T>;
  glob<T = string>(
    globPattern: string,
    options: { query: '?raw'; import: 'default'; eager?: boolean }
  ): Record<string, T>;
  glob<T = unknown>(
    globPattern: string,
    options: { query: '?url'; import: 'default'; eager?: boolean }
  ): Record<string, string>;
}
